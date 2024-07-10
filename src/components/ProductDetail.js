import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, onValue, set, update } from 'firebase/database';
import { db } from './config/firebaseConfig';
import { 
  Container, Grid, Typography, Button, Box, CircularProgress, Alert,
  Card, CardMedia, CardContent, IconButton, Modal, Fade
} from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CloseIcon from '@mui/icons-material/Close';
import { useNotification } from './Notification';
import { AuthContext } from './AuthContext';
import Whatsapp from './Whatsapp';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTalla, setSelectedTalla] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [mainImage, setMainImage] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const { Notification, showNotification } = useNotification();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const productRef = ref(db, `productos/${id}`);
    const unsubscribe = onValue(productRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setProduct(data);
        setMainImage(data.imagenes[0] || (data.colores && data.colores[0] && data.colores[0].imagen));
        fetchRelatedProducts(data.categoria);
      } else {
        setError('Producto no encontrado');
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching product data: ", error);
      setError(error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  const fetchRelatedProducts = (categoria) => {
    const productosRef = ref(db, 'productos');
    onValue(productosRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const related = Object.entries(data)
          .filter(([key, value]) => value.categoria === categoria && key !== id)
          .map(([key, value]) => ({ id: key, ...value }))
          .slice(0, 4);
        setRelatedProducts(related);
      }
    });
  };

  const formatPrice = (price) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleAddToCart = () => {
    if (!user) {
      showNotification('Inicia sesión para añadir al carrito', 'warning');
      return;
    }

    if (product.tipoProducto !== 'sin talla y color' && !selectedTalla) {
      showNotification('Por favor selecciona una talla', 'warning');
      return;
    }

    if (product.tipoProducto === 'talla y color' && !selectedColor) {
      showNotification('Por favor selecciona un color', 'warning');
      return;
    }

    const cartRef = ref(db, `carritos/${user.uid}`);
    const cartItemId = `${id}-${selectedTalla || ''}-${selectedColor || ''}`;
    const cartItemRef = ref(db, `carritos/${user.uid}/${cartItemId}`);

    onValue(cartRef, (snapshot) => {
      const cartData = snapshot.val() || {};

      if (cartData[cartItemId]) {
        const updatedQuantity = cartData[cartItemId].cantidad + 1;
        update(cartItemRef, {
          cantidad: updatedQuantity
        });
      } else {
        set(cartItemRef, {
          productoId: id,
          cantidad: 1,
          talla: selectedTalla || null,
          color: selectedColor || null
        });
      }

      showNotification(`${product.nombre} añadido al carrito`, 'success');
    }, {
      onlyOnce: true
    });
  };

  const updateSelectedColor = (index) => {
    if (product.colores && product.colores[index]) {
      setSelectedColor(product.colores[index].nombre);
      setMainImage(product.colores[index].imagen);
    }
  };

  const handlePrevImage = () => {
    if (product.colores && product.colores.length > 0) {
      setCurrentImageIndex((prevIndex) => {
        const newIndex = prevIndex === 0 ? product.colores.length - 1 : prevIndex - 1;
        updateSelectedColor(newIndex);
        return newIndex;
      });
    }
  };

  const handleNextImage = () => {
    if (product.colores && product.colores.length > 0) {
      setCurrentImageIndex((prevIndex) => {
        const newIndex = prevIndex === product.colores.length - 1 ? 0 : prevIndex + 1;
        updateSelectedColor(newIndex);
        return newIndex;
      });
    }
  };

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleRelatedProductClick = (productId) => {
    navigate(`/productos/${productId}`);
  };

  if (loading) return <Container><CircularProgress /></Container>;
  if (error) return <Container><Alert severity="error">{error}</Alert></Container>;
  if (!product) return <Container><Alert severity="info">Producto no encontrado</Alert></Container>;

  return (
    <>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={7}>
          <Box sx={{ position: 'relative', width: '100%', height: 400, cursor: 'pointer' }} onClick={handleOpenModal}>
  <CardMedia
    component="img"
    image={mainImage}
    alt={product.nombre}
    sx={{ 
      width: '100%', 
      height: '100%', 
      objectFit: 'contain' 
    }}
  />
  {product.stock < 1 && (
    <Box
      sx={{
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#e74c3c',
        color: 'white',
        padding: '5px 10px',
        fontWeight: 'bold',
        transform: 'rotate(0deg)',
        zIndex: 1,
      }}
    >
      AGOTADO
    </Box>
              )}
              {product.colores && product.colores.length > 1 && (
                <>
                  <IconButton
                    onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                    sx={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
                  >
                    <ArrowBackIosNewIcon />
                  </IconButton>
                  <IconButton
                    onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                    sx={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}
                  >
                    <ArrowForwardIosIcon />
                  </IconButton>
                </>
              )}
            </Box>
          </Grid>
          <Grid item xs={12} md={5}>
            <Typography variant="h4" gutterBottom sx={{ textAlign: 'left' }}>{product.nombre}</Typography>
            <Typography variant="h4" color="primary" component="p" className="product-price" align="left">
              ${formatPrice(product.precio)}
            </Typography>
            <Typography variant="h6" paragraph sx={{ textAlign: 'left', fontWeight: 'bold' }}>Detalles del producto</Typography>
            <Typography variant="body1" paragraph sx={{ textAlign: 'left' }}>{product.descripcion}</Typography>
            <Typography variant="body1" gutterBottom sx={{ textAlign: 'left', fontWeight: 'bold' }}>Stock: {product.stock}</Typography>
            {product.tipoProducto !== 'sin talla y color' && (
              <>
                <Typography variant="body1" gutterBottom sx={{ textAlign: 'left', fontWeight: 'bold' }}><hr></hr>Elige tu talla</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'left', my: 2 }}>
                  {product.tallas && product.tallas.map((talla) => (
                    <Button
                      key={talla}
                      variant={selectedTalla === talla ? "contained" : "outlined"}
                      onClick={() => setSelectedTalla(talla)}
                      sx={{ mr: 1, mb: 1 }}
                    >
                      {talla}
                    </Button>
                  ))}
                </Box>
              </>
            )}

            {product.tipoProducto === 'talla y color' && (
              <Box sx={{ display: 'flex', justifyContent: 'left', mt: 2 }}>
                {product.colores && product.colores.map((color, index) => (
                  <Box
                    key={color.nombre}
                    onClick={() => {
                      setSelectedColor(color.nombre);
                      setMainImage(color.imagen);
                      setCurrentImageIndex(index);
                    }}
                    sx={{
                      width: 60,
                      height: 60,
                      m: 1,
                      border: selectedColor === color.nombre ? '2px solid #1976d2' : '2px solid transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <CardMedia
                      component="img"
                      image={color.imagen}
                      alt={color.nombre}
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Box>
                ))}
              </Box>
            )}

            <Button
              variant="contained"
              color="primary"
              startIcon={<AddShoppingCartIcon />}
              onClick={handleAddToCart}
              sx={{ mt: 2 }}
              fullWidth
              disabled={product.stock < 1}
            >
              {product.stock < 1 ? 'Agotado' : 'Añadir al carrito'}
            </Button>
          </Grid>
        </Grid>

        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" gutterBottom><hr />Productos relacionados</Typography>
          <Grid container spacing={2}>
            {relatedProducts.map((relatedProduct) => (
              <Grid item key={relatedProduct.id} xs={6} sm={6} md={4} lg={3}>
                <Card 
                  className="product-card" 
                  onClick={() => handleRelatedProductClick(relatedProduct.id)}
                >
<div className="product-image-container">
  <CardMedia
    component="img"
    alt={relatedProduct.nombre}
    image={relatedProduct.imagenes && relatedProduct.imagenes[0]}
    title={relatedProduct.nombre}
    className="product-image"
  />
  {relatedProduct.stock < 1 && (
    <div 
      style={{
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#e74c3c',
        color: 'white',
        padding: '3px 8px',
        fontSize: '0.8rem',
        fontWeight: 'bold',
      }}
    >
      AGOTADO
    </div>
  )}
</div>
                  <CardContent className="product-content">
                    <Typography variant="body2" component="h2" className="product-title" align="left">
                      {relatedProduct.nombre.length > 20 
                        ? `${relatedProduct.nombre.substring(0, 20)}...` 
                        : relatedProduct.nombre}
                    </Typography>
                    <Typography variant="h6" color="primary" component="p" className="product-price" align="left">
                      ${formatPrice(relatedProduct.precio)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
        
        <Modal
          open={openModal}
          onClose={handleCloseModal}
          closeAfterTransition
        >
          <Fade in={openModal}>
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90%',
              maxWidth: 800,
              bgcolor: 'background.paper',
              boxShadow: 24,
              p: 4,
            }}>
              <IconButton
                aria-label="close"
                onClick={handleCloseModal}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  color: (theme) => theme.palette.grey[500],
                }}
              >
                <CloseIcon />
              </IconButton>
              <Box sx={{ position: 'relative', width: '100%', height: '70vh' }}>
                <CardMedia
                  component="img"
                  image={product.colores?.[currentImageIndex]?.imagen || mainImage}
                  alt={product.colores?.[currentImageIndex]?.nombre || product.nombre}
                  sx={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'contain' 
                  }}
                />
                {product.colores && product.colores.length > 1 && (
                  <>
                    <IconButton
                      onClick={handlePrevImage}
                      sx={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
                    >
                      <ArrowBackIosNewIcon />
                    </IconButton>
                    <IconButton
                      onClick={handleNextImage}
                      sx={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}
                    >
                      <ArrowForwardIosIcon />
                    </IconButton>
                  </>
                )}
              </Box>
            </Box>
          </Fade>
        </Modal>

        <Notification />
        <Whatsapp />
        <br/><br/> <br/><br/>
      </Container>
    </>
  );
};

export default ProductDetail;