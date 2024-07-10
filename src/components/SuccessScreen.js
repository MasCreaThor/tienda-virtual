import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from './config/firebaseConfig';
import { ref, get } from 'firebase/database';

const SuccessScreen = () => {
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setLoading(true);
      const searchParams = new URLSearchParams(location.search);
      const orderId = searchParams.get('orderId');
      
      if (!orderId) {
        setError('No se encontró el ID del pedido');
        setLoading(false);
        return;
      }

      try {
        const orderRef = ref(db, `orders/${orderId}`);
        const orderSnapshot = await get(orderRef);

        if (orderSnapshot.exists()) {
          const orderData = orderSnapshot.val();
          
          // Fetch product and provider details for each item in the order
          const itemsWithDetails = await Promise.all(orderData.items.map(async (item) => {
            const productRef = ref(db, `productos/${item.productoId}`);
            const productSnapshot = await get(productRef);
            if (productSnapshot.exists()) {
              const productData = productSnapshot.val();
              const providerRef = ref(db, `proveedores/${productData.proveedor}`);
              const providerSnapshot = await get(providerRef);
              if (providerSnapshot.exists()) {
                const providerData = providerSnapshot.val();
                return { ...item, proveedor: productData.proveedor, proveedorTelefono: providerData.telefono };
              }
            }
            return item;
          }));

          setOrderDetails({ ...orderData, items: itemsWithDetails, id: orderId });
        } else {
          setError('No se encontraron detalles del pedido');
        }
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError('Error al cargar los detalles del pedido');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [location]);

  const openWhatsAppChat = (providerPhone) => {
    if (!orderDetails) return;

    const itemsForProvider = orderDetails.items.filter(item => item.proveedorTelefono === providerPhone);

    let message = "Hola, acabo de realizar un pedido con los siguientes productos:\n\n";
    itemsForProvider.forEach(item => {
      message += `${item.nombre} - Cantidad: ${item.cantidad} - Precio: ${item.precio * item.cantidad}\n`;
    });
    message += `\nTotal del pedido: ${orderDetails.total}\n`;
    message += `ID del pedido: ${orderDetails.id}\n`;
    message += `Fecha del pedido: ${new Date(orderDetails.createdAt).toLocaleString()}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${providerPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh">
        <Typography variant="h6" color="error" gutterBottom>
          {error}
        </Typography>
        <Button variant="contained" onClick={() => navigate('/')}>
          Volver al inicio
        </Button>
      </Box>
    );
  }

  const uniqueProviders = [...new Set(orderDetails.items.map(item => item.proveedorTelefono))];

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      bgcolor="#f0f8ff"
      padding={3}
    >
      <CheckCircleOutlineIcon sx={{ fontSize: 100, color: 'green', mb: 2 }} />
      <Typography variant="h4" gutterBottom textAlign="center">
        ¡Pedido realizado con éxito!
      </Typography>
      <Typography variant="body1" align="center" sx={{ mb: 4 }}>
        Gracias por tu compra. Tu pedido ha sido procesado correctamente.
      </Typography>
      {uniqueProviders.map((providerPhone, index) => (
        <Button
          key={index}
          variant="contained"
          color="primary"
          size="large"
          startIcon={<WhatsAppIcon />}
          onClick={() => openWhatsAppChat(providerPhone)}
          sx={{ mb: 2 }}
        >
          Contactar al proveedor {index + 1}
        </Button>
      ))}
      <Button
        variant="outlined"
        color="primary"
        onClick={() => navigate('/')}
        sx={{ mt: 2 }}
      >
        Volver a la tienda
      </Button>
    </Box>
  );
};

export default SuccessScreen;