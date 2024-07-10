// MostrarProductos.js

import React, { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from './config/firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { Card, CardMedia, CardContent, Typography, Grid, CircularProgress, Alert } from '@mui/material';
import './assets/ProductCard.css';

const MostrarProductos = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const productosRef = ref(db, 'productos');
    
    const unsubscribe = onValue(
      productosRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const productosArray = Object.keys(data).map((key) => ({
            id: key,
            ...data[key]
          }));
          setProductos(productosArray);
        } else {
          setProductos([]);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching data: ", error);
        setError(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleCardClick = (productoId) => {
    navigate(`/productos/${productoId}`);
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
        <Alert severity="error">Error al cargar los productos: {error.message}</Alert>
      </div>
    );
  }

  if (productos.length === 0) {
    return (
      <div className="empty-container">
        <Alert severity="info">No hay productos disponibles.</Alert>
      </div>
    );
  }

  const formatPrice = (price) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  return (
    <div className="product-grid-container">
      <Grid container spacing={2}>
        {productos.map((producto) => (
          <Grid item key={producto.id} xs={6} sm={6} md={4} lg={3}>
            <Card className="product-card" onClick={() => handleCardClick(producto.id)}>
              <div className="product-image-container">
                <CardMedia
                  component="img"
                  alt={producto.nombre}
                  image={producto.imagenes && producto.imagenes.length > 0 ? producto.imagenes[0] : ''}
                  title={producto.nombre}
                  className="product-image"
                />
                {producto.stock < 1 && (
                  <div className="agotado-label">AGOTADO</div>
                )}
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
      <br></br><br></br>
    </div>
  );
};

export default MostrarProductos;