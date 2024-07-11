import React, { useState, useEffect, useRef } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { ref, onValue } from 'firebase/database';
import { db } from './config/firebaseConfig';
import './assets/Dashboard.css';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import 'canvas-toBlob';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [timeFilter, setTimeFilter] = useState('month');
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: null, end: null });

  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const lineChartRef = useRef(null);
  const categoryChartRef = useRef(null);

  useEffect(() => {
    const dataRef = ref(db, '/');
    onValue(dataRef, (snapshot) => {
      const data = snapshot.val();
      setData(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const now = new Date();
    let start, end;

    switch (timeFilter) {
      case 'day':
        start = new Date(now.setHours(0, 0, 0, 0));
        end = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'week':
        start = new Date(now.setDate(now.getDate() - now.getDay()));
        end = new Date(now.setDate(now.getDate() - now.getDay() + 6));
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        start = new Date(now.setDate(now.getDate() - 30));
        end = now;
    }

    setDateRange({ start, end });
  }, [timeFilter]);

  const filterDataByDateRange = (items) => {
    return Object.values(items || {}).filter(item => {
      const itemDate = new Date(item.createdAt);
      return itemDate >= dateRange.start && itemDate <= dateRange.end;
    });
  };

  const getTotalProducts = () => Object.keys(data?.productos || {}).length;
  const getTotalUsers = () => Object.keys(data?.users || {}).length;
  const getTotalCategories = () => Object.keys(data?.categorias || {}).length;
  const getTotalProviders = () => Object.keys(data?.proveedores || {}).length;

  const getOrderStatusCounts = () => {
    const statusCounts = { pending: 0, inProcess: 0, sent: 0, delivered: 0, cancelled: 0 };
    filterDataByDateRange(data?.orders).forEach(order => {
      statusCounts[order.status]++;
    });
    return statusCounts;
  };

  const getTopSellingProducts = () => {
    const productCounts = {};
    filterDataByDateRange(data?.orders).forEach(order => {
      if (order.status === 'delivered') {
        order.items.forEach(item => {
          productCounts[item.nombre] = (productCounts[item.nombre] || 0) + item.cantidad;
        });
      }
    });
    return Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  const getSalesTrend = () => {
    const salesByDate = {};
    filterDataByDateRange(data?.orders).forEach(order => {
      const date = new Date(order.createdAt).toLocaleDateString();
      salesByDate[date] = (salesByDate[date] || 0) + order.total;
    });
    return Object.entries(salesByDate).sort((a, b) => new Date(a[0]) - new Date(b[0]));
  };

  const getCategoryDistribution = () => {
    const categoryCounts = {};
    filterDataByDateRange(data?.orders).forEach(order => {
      order.items.forEach(item => {
        const category = data.productos[item.productoId]?.categoria;
        if (category) {
          categoryCounts[category] = (categoryCounts[category] || 0) + item.cantidad;
        }
      });
    });
    return Object.entries(categoryCounts);
  };

  const renderBarChart = () => {
    const statusCounts = getOrderStatusCounts();
    return (
      <Bar
        ref={barChartRef}
        data={{
          labels: ['Pendientes', 'En Proceso', 'Enviados', 'Entregados', 'Cancelados'],
          datasets: [{
            data: [statusCounts.pending, statusCounts.inProcess, statusCounts.sent, statusCounts.delivered, statusCounts.cancelled],
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
          }]
        }}
        options={{
          responsive: true,
          plugins: {
            title: { display: true, text: 'Estado de Órdenes' },
            legend: { display: false },
          }
        }}
      />
    );
  };

  const renderTopSellingProductsChart = () => {
    const topProducts = getTopSellingProducts();
    return (
      <Pie
        ref={pieChartRef}
        data={{
          labels: topProducts.map(product => product[0]),
          datasets: [{
            data: topProducts.map(product => product[1]),
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
          }]
        }}
        options={{
          responsive: true,
          plugins: {
            title: { display: true, text: 'Top 5 Productos Más Vendidos' },
            legend: { position: 'bottom' },
          }
        }}
      />
    );
  };

  const renderSalesTrendChart = () => {
    const salesTrend = getSalesTrend();
    return (
      <Line
        ref={lineChartRef}
        data={{
          labels: salesTrend.map(item => item[0]),
          datasets: [{
            label: 'Ventas Diarias',
            data: salesTrend.map(item => item[1]),
            borderColor: '#4BC0C0',
            tension: 0.1
          }]
        }}
        options={{
          responsive: true,
          plugins: {
            title: { display: true, text: 'Tendencia de Ventas' },
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Monto de Ventas'
              }
            }
          }
        }}
      />
    );
  };

  const renderCategoryDistributionChart = () => {
    const categoryDistribution = getCategoryDistribution();
    return (
      <Pie
        ref={categoryChartRef}
        data={{
          labels: categoryDistribution.map(category => data.categorias[category[0]]?.nombre || 'Desconocido'),
          datasets: [{
            data: categoryDistribution.map(category => category[1]),
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#8A2BE2']
          }]
        }}
        options={{
          responsive: true,
          plugins: {
            title: { display: true, text: 'Distribución por Categoría' },
            legend: { position: 'bottom' },
          }
        }}
      />
    );
  };

  const handleTimeFilterChange = (filter) => {
    setTimeFilter(filter);
  };

  const downloadExcel = async () => {
    if (!data) {
      console.error('Los datos aún no están disponibles');
      alert('Por favor, espere a que los datos se carguen completamente antes de descargar el reporte.');
      return;
    }

    // Crear un nuevo libro de trabajo
    const wb = XLSX.utils.book_new();

    // Agregar hoja de resumen
    const summaryData = [
      ['Resumen'],
      ['Total Productos', getTotalProducts()],
      ['Total Usuarios', getTotalUsers()],
      ['Total Categorías', getTotalCategories()],
      ['Total Proveedores', getTotalProviders()],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Resumen');

    // Agregar hoja de estado de órdenes
    const statusCounts = getOrderStatusCounts();
    const orderStatusData = [
      ['Estado de Órdenes'],
      ['Estado', 'Cantidad'],
      ['Pendientes', statusCounts.pending],
      ['En Proceso', statusCounts.inProcess],
      ['Enviados', statusCounts.sent],
      ['Entregados', statusCounts.delivered],
      ['Cancelados', statusCounts.cancelled],
    ];
    const orderStatusSheet = XLSX.utils.aoa_to_sheet(orderStatusData);
    XLSX.utils.book_append_sheet(wb, orderStatusSheet, 'Estado de Órdenes');

    // Agregar hoja de productos más vendidos
    const topProducts = getTopSellingProducts();
    const topProductsData = [
      ['Top 5 Productos Más Vendidos'],
      ['Producto', 'Cantidad'],
      ...topProducts,
    ];
    const topProductsSheet = XLSX.utils.aoa_to_sheet(topProductsData);
    XLSX.utils.book_append_sheet(wb, topProductsSheet, 'Top Productos');

    // Agregar hoja de tendencia de ventas
    const salesTrend = getSalesTrend();
    const salesTrendData = [
      ['Tendencia de Ventas'],
      ['Fecha', 'Monto'],
      ...salesTrend,
    ];
    const salesTrendSheet = XLSX.utils.aoa_to_sheet(salesTrendData);
    XLSX.utils.book_append_sheet(wb, salesTrendSheet, 'Tendencia de Ventas');

    // Agregar hoja de distribución por categoría
    const categoryDistribution = getCategoryDistribution();
    const categoryDistributionData = [
      ['Distribución por Categoría'],
      ['Categoría', 'Cantidad'],
      ...categoryDistribution.map(([categoryId, count]) => [data.categorias[categoryId]?.nombre || 'Desconocido', count]),
    ];
    const categoryDistributionSheet = XLSX.utils.aoa_to_sheet(categoryDistributionData);
    XLSX.utils.book_append_sheet(wb, categoryDistributionSheet, 'Distribución por Categoría');

    // Agregar hoja de conclusiones
    const conclusionsData = [
      ['Conclusiones'],
      [''],
      ['Basado en los datos analizados, podemos concluir lo siguiente:'],
      [''],
      ['1. Estado de Órdenes:'],
      [`   - La mayoría de las órdenes están en estado ${Object.entries(statusCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0]}.`],
      [`   - Se deben tomar medidas para reducir el número de órdenes ${Object.entries(statusCounts).reduce((a, b) => a[1] < b[1] ? a : b)[0]}.`],
      [''],
      ['2. Productos Más Vendidos:'],
      [`   - El producto más vendido es "${topProducts[0][0]}" con ${topProducts[0][1]} unidades vendidas.`],
      ['   - Se recomienda mantener un inventario adecuado de los productos top y considerar promociones para los menos vendidos.'],
      [''],
      ['3. Tendencia de Ventas:'],
      [`   - La tendencia general de ventas es ${salesTrend[salesTrend.length - 1][1] > salesTrend[0][1] ? 'al alza' : 'a la baja'}.`],
      ['   - Se sugiere analizar los factores que influyen en los picos y valles de ventas para optimizar estrategias.'],
      [''],
      ['4. Distribución por Categoría:'],
      [`   - La categoría más popular es "${categoryDistribution[0][0]}" con ${categoryDistribution[0][1]} productos vendidos.`],
      ['   - Se recomienda diversificar el inventario en categorías menos populares y promocionar productos de estas categorías.'],
      [''],
      ['Estas conclusiones deben ser consideradas junto con otros factores del negocio para tomar decisiones informadas y estratégicas.'],
    ];
    const conclusionsSheet = XLSX.utils.aoa_to_sheet(conclusionsData);
    XLSX.utils.book_append_sheet(wb, conclusionsSheet, 'Conclusiones');

    // Función para convertir canvas a blob
    const canvasToBlob = (canvas) => {
      return new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/png');
      });
    };

    // Función para agregar una imagen a una hoja
    const addChartImage = async (sheet, chartRef, cell) => {
      if (chartRef.current) {
        const canvas = chartRef.current.canvas;
        const blob = await canvasToBlob(canvas);
        const buffer = await blob.arrayBuffer();
        
        // Añadir texto "Gráfico:"
        XLSX.utils.sheet_add_aoa(sheet, [[{ t: 's', v: 'Gráfico:' }]], { origin: cell });
        
        // Convertir la imagen a base64
        const base64 = btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
        const imgId = sheet['!images'] ? sheet['!images'].length + 1 : 1;
        
        // Añadir la imagen a la hoja
        if (!sheet['!images']) sheet['!images'] = [];
        sheet['!images'].push({
          name: `image${imgId}.png`,
          data: base64,
          opts: {
            base64: true,
            cellRef: XLSX.utils.encode_cell({ r: XLSX.utils.decode_row(cell) + 1, c: XLSX.utils.decode_col(cell) })
          }
        });
      }
    };

    // Agregar imágenes de gráficos a las hojas correspondientes
    await addChartImage(orderStatusSheet, barChartRef, 'A9');
    await addChartImage(topProductsSheet, pieChartRef, 'A9');
await addChartImage(salesTrendSheet, lineChartRef, 'A9');
await addChartImage(categoryDistributionSheet, categoryChartRef, 'A9');

// Generar el archivo Excel
const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

// Obtener la fecha actual para el nombre del archivo
const date = new Date().toISOString().split('T')[0];
saveAs(blob, `Reporte_Dashboard_${date}.xlsx`);
};

  if (loading) {
    return <div className="loading">Cargando datos...</div>;
  }

  if (!data) {
    return <div className="no-data">No se encontraron datos para realizar análisis.</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Dashboard de Ventas y Productos</h1>
        <div className="time-filter">
          <button className={timeFilter === 'day' ? 'active' : ''} onClick={() => handleTimeFilterChange('day')}>Día</button>
          <button className={timeFilter === 'week' ? 'active' : ''} onClick={() => handleTimeFilterChange('week')}>Semana</button>
          <button className={timeFilter === 'month' ? 'active' : ''} onClick={() => handleTimeFilterChange('month')}>Mes</button>
          <button className={timeFilter === 'year' ? 'active' : ''} onClick={() => handleTimeFilterChange('year')}>Año</button>
        </div>
        <button 
  className="download-btn" 
  onClick={downloadExcel} 
  disabled={loading || !data}
>
  Descargar Reporte
</button>
      </header>

      <div className="summary">
        <div className="summary-item">
          <h3>Total Productos</h3>
          <p>{getTotalProducts()}</p>
        </div>
        <div className="summary-item">
          <h3>Total Usuarios</h3>
          <p>{getTotalUsers()}</p>
        </div>
        <div className="summary-item">
          <h3>Total Categorías</h3>
          <p>{getTotalCategories()}</p>
        </div>
        <div className="summary-item">
          <h3>Total Proveedores</h3>
          <p>{getTotalProviders()}</p>
        </div>
      </div>

      <div className="charts">
        <div className="chart-container">
          {renderBarChart()}
        </div>
        <div className="chart-container">
          {renderTopSellingProductsChart()}
        </div>
        <div className="chart-container full-width">
          {renderSalesTrendChart()}
        </div>
        <div className="chart-container">
          {renderCategoryDistributionChart()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;