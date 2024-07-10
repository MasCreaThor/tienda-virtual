import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDatabase, ref, onValue } from 'firebase/database';
import { Card, CardMedia, CardContent, Typography, Container, Grid, CircularProgress, Alert } from '@mui/material';
import './assets/CategoriaProductos.css';
import './assets/ProductCard.css';

const CategoriaProductos = () => {
  const { categoriaId } = useParams();
  const navigate = useNavigate();
  const [categoria, setCategoria] = useState(null);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const db = getDatabase();
    const categoriaRef = ref(db, `categorias/${categoriaId}`);
    const productosRef = ref(db, 'productos');

    const unsubscribeCategoria = onValue(categoriaRef, (snapshot) => {
      const categoriaData = snapshot.val();
      if (categoriaData) {
        setCategoria(categoriaData);
      } else {
        setError('Categoría no encontrada');
      }
    });

    const unsubscribeProductos = onValue(productosRef, (snapshot) => {
      const productosData = snapshot.val();
      if (productosData) {
        const productosFiltrados = Object.entries(productosData)
          .filter(([_, producto]) => producto.categoria === categoriaId)
          .map(([id, data]) => ({ id, ...data }));
        setProductos(productosFiltrados);
      } else {
        setProductos([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching data: ", error);
      setError(error);
      setLoading(false);
    });

    return () => {
      unsubscribeCategoria();
      unsubscribeProductos();
    };
  }, [categoriaId]);

  const handleProductClick = (productoId) => {
    navigate(`/productos/${productoId}`);
  };

  const formatPrice = (price) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  if (loading) {
    return (
      <div className="loading-container">
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <Alert severity="error">Error: {error.message || error}</Alert>
      </div>
    );
  }

  if (!categoria) {
    return (
      <div className="error-container">
        <Alert severity="error">Categoría no encontrada</Alert>
      </div>
    );
  }

  return (
    <Container maxWidth="lg" className="categoria-productos-container">
      <div className="categoria-banner">
        <img src={categoria.imagen} alt={categoria.nombre} className="categoria-imagen" />
        <h1 className="categoria-nombre">{categoria.nombre}</h1>
      </div>
      
      {productos.length === 0 ? (
        <div className="empty-container">
          <Alert severity="info">No hay productos disponibles en esta categoría.</Alert>
        </div>
      ) : (
        <div className="product-grid-container">
          <Grid container spacing={2}>
            {productos.map((producto) => (
              <Grid item key={producto.id} xs={6} sm={6} md={4} lg={3}>
                <Card 
                  className="product-card"
                  onClick={() => handleProductClick(producto.id)}
                >
                  <div className="product-image-container">
                    <CardMedia
                      component="img"
                      alt={producto.nombre}
                      image={producto.imagenes && producto.imagenes.length > 0 ? producto.imagenes[0] : ''}
                      title={producto.nombre}
                      className="product-image"
                    />
                  </div>
                  <CardContent className="product-content">
                    <Typography variant="body2" component="h2" className="product-title" align="left">
                      {producto.nombre.length > 20 ? `${producto.nombre.substring(0, 20)}...` : producto.nombre}
                    </Typography>
                    <Typography variant="h6" color="primary" component="p" className="product-price" align="left">
                      ${formatPrice(producto.precio)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </div>
      )}
    </Container>
  );
};

export default CategoriaProductos;