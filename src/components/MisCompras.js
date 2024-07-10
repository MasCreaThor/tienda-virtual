// src/components/MisCompras.js
import React, { useState, useEffect, useContext } from 'react';
import { Container, Typography, Paper, Grid, Box, Chip, CircularProgress, Alert, Tabs, Tab, Card, CardContent, CardMedia, Divider } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalMallIcon from '@mui/icons-material/LocalMall'; // Importar otro icono
import { ref, get } from 'firebase/database';
import { db } from './config/firebaseConfig';

import { AuthContext } from './AuthContext';

const MisCompras = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const { user, loading: authLoading } = useContext(AuthContext);

  useEffect(() => {
    const fetchOrders = async () => {
      if (authLoading) return;
      
      if (!user) {
        setError('Debes iniciar sesión para ver tus compras.');
        setLoading(false);
        return;
      }

      try {
        const ordersRef = ref(db, 'orders');
        const snapshot = await get(ordersRef);
        if (snapshot.exists()) {
          const allOrders = snapshot.val();
          const userOrders = Object.entries(allOrders)
            .filter(([_, order]) => order.userId === user.uid)
            .map(([id, order]) => ({ id, ...order }))
            .sort((a, b) => b.createdAt - a.createdAt);
          setOrders(userOrders);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Hubo un error al cargar tus compras. Por favor, intenta de nuevo más tarde.');
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, authLoading]);

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'processing': return 'info';
      case 'shipped': return 'success';
      case 'delivered': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'processing': return 'Procesando';
      case 'shipped': return 'Enviado';
      case 'delivered': return 'Entregado';
      case 'cancelled': return 'Cancelado';
      default: return 'Desconocido';
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const filterOrdersByStatus = (status) => {
    return orders.filter(order => {
      if (status === 'pending') return order.status === 'pending' || order.status === 'processing';
      if (status === 'shipped') return order.status === 'shipped';
      if (status === 'delivered') return order.status === 'delivered';
      return false;
    });
  };

  if (authLoading || loading) return <Container><CircularProgress /></Container>;
  if (error) return <Container><Alert severity="error">{error}</Alert></Container>;

  return (
    <>

      <hr></hr>
      
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} mb={2}>
         
          <Typography variant="h4" gutterBottom>Mis Compras</Typography>
          <LocalMallIcon sx={{ ml: 1, color: 'secondary.main' }} />
        </Box>
        <Paper elevation={3} sx={{ borderRadius: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange} centered>
            <Tab label="Solicitud Pendiente" />
            <Tab label="Pedido Enviado" />
            <Tab label="Pedido Finalizado" />
          </Tabs>
        </Paper>
        <Box mt={3}>
          {orders.length === 0 ? (
            <Alert severity="info">Aún no has realizado ninguna compra.</Alert>
          ) : (
            <Grid container spacing={3}>
              {filterOrdersByStatus(['pending', 'shipped', 'delivered'][tabValue]).map((order) => (
                <Grid item xs={12} key={order.id}>
                  <Card elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">Pedido #{order.id.slice(-6)}</Typography>
                        <Chip 
                          label={getStatusText(order.status)} 
                          color={getStatusColor(order.status)}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Realizado el {formatDate(order.createdAt)}
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        Total: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(order.total)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Método de pago: {order.paymentMethod}
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" gutterBottom>Productos:</Typography>
                      <Grid container spacing={2}>
                        {order.items.map((item, index) => (
                          <Grid item xs={12} sm={6} md={4} key={index}>
                            <Card variant="outlined">
                              <CardMedia
                                component="img"
                                height="140"
                                image={item.imagenes ? item.imagenes[0] : 'https://via.placeholder.com/140'}
                                alt={item.nombre}
                              />
                              <CardContent>
                                <Typography variant="subtitle2" noWrap>{item.nombre}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Cantidad: {item.cantidad}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Precio: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(item.precio)}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Container>
    </>
  );
};

export default MisCompras;
