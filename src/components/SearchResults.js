import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Grid, Card, CardContent, Typography, CardMedia, Container, Box } from '@mui/material';
import './assets/ProductCard.css';

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [resultados, setResultados] = useState([]);

  useEffect(() => {
    if (location.state && location.state.resultados) {
      // Eliminar duplicados basados en el ID del producto
      const uniqueResultados = Array.from(new Set(location.state.resultados.map(p => p.id)))
        .map(id => location.state.resultados.find(p => p.id === id));
      setResultados(uniqueResultados);
    } else {
      console.log('No se encontraron resultados en el state');
      navigate('/');
    }
  }, [location.state, navigate]);

  const handleCardClick = (productoId) => {
    navigate(`/productos/${productoId}`);
  };

  const formatPrice = (price) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  if (resultados.length === 0) {
    return (
      <Container maxWidth="lg" className="search-results-container">
        <Typography variant="h5">No se encontraron resultados</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" className="search-results-container">
      <Typography variant="h4" gutterBottom>Resultados de la búsqueda</Typography>
      <div className="product-grid-container">
        <Grid container spacing={2}>
          {resultados.map((producto) => (
            <Grid item xs={6} sm={6} md={4} lg={3} key={producto.id}>
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
      </div>
      <br></br><br></br>
    </Container>
  );
};

export default SearchResults;