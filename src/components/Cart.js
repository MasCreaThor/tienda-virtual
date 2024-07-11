import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, onValue, remove, update, get } from 'firebase/database';
import { auth, db } from './config/firebaseConfig';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import {
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  Box,
  IconButton,
  CircularProgress,
  Alert,
  Paper,
  ButtonGroup,
  Select,
  MenuItem,
  FormControl,
  useTheme,
  useMediaQuery,
  Grid,
  Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import PaymentAndOrder from './PaymentAndOrder';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const fetchCartData = useCallback(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const cartRef = ref(db, `carritos/${user.uid}`);
    const productsRef = ref(db, 'productos');

    Promise.all([
      get(cartRef),
      get(productsRef)
    ]).then(([cartSnapshot, productsSnapshot]) => {
      const cartData = cartSnapshot.val();
      const productsData = productsSnapshot.val();

      if (cartData && productsData) {
        const items = Object.entries(cartData).map(([key, value]) => {
          const product = productsData[value.productoId];
          if (product) {
            return { 
              id: key, 
              ...value, 
              nombre: product.nombre,
              precio: product.precio,
              colores: product.colores,
              imagenes: product.imagenes,
              tallas: product.tallas
            };
          }
          return null;
        }).filter(item => item !== null);
        setCartItems(items);
      } else {
        setCartItems([]);
      }
      setLoading(false);
    }).catch((error) => {
      console.error("Error fetching data: ", error);
      setError(error.message);
      setLoading(false);
    });
  }, [user]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setAuthChecked(true);
      if (currentUser) {
        fetchCartData();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [fetchCartData]);

  const handleRemoveItem = (itemId) => {
    const user = auth.currentUser;
    if (!user) {
      setError('Debes iniciar sesión para eliminar productos de tu carrito.');
      return;
    }

    const cartItemRef = ref(db, `carritos/${user.uid}/${itemId}`);
    remove(cartItemRef).then(() => {
      setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
    }).catch((error) => {
      console.error("Error removing cart item: ", error);
      setError(error.message);
    });
  };

  const handleQuantityChange = (itemId, change) => {
    const user = auth.currentUser;
    if (!user) return;

    const item = cartItems.find(item => item.id === itemId);
    const newQuantity = Math.max(1, item.cantidad + change);
    
    const cartItemRef = ref(db, `carritos/${user.uid}/${itemId}`);
    update(cartItemRef, { cantidad: newQuantity }).then(() => {
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, cantidad: newQuantity } : item
        )
      );
    }).catch((error) => {
      console.error("Error updating cart item: ", error);
    });
  };

  const handleSizeChange = (itemId, size) => {
    const user = auth.currentUser;
    if (!user) return;

    const cartItemRef = ref(db, `carritos/${user.uid}/${itemId}`);
    update(cartItemRef, { talla: size }).then(() => {
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, talla: size } : item
        )
      );
    }).catch((error) => {
      console.error("Error updating cart item size: ", error);
    });
  };

  const handleColorChange = (itemId, color) => {
    const user = auth.currentUser;
    if (!user) return;

    const cartItemRef = ref(db, `carritos/${user.uid}/${itemId}`);
    update(cartItemRef, { color: color }).then(() => {
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, color: color } : item
        )
      );
    }).catch((error) => {
      console.error("Error updating cart item color: ", error);
    });
  };

  const calculateSubtotal = useCallback((items) => {
    const subtotal = items.reduce((sum, item) => sum + parseFloat(item.precio) * item.cantidad, 0);
    return subtotal;
  }, []);

  const calculateTotal = useCallback((items) => {
    const subtotal = calculateSubtotal(items);
    const shipping = 1500;
    const total = subtotal + shipping;
    return total;
  }, [calculateSubtotal]);

  const formatPrice = (price) => {
    return price.toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
  };

  if (!authChecked) return <Container><CircularProgress /></Container>;
  if (!user) return <Container><Alert severity="info">Debes iniciar sesión para ver tu carrito de compras.</Alert></Container>;
  if (loading) return <Container><CircularProgress /></Container>;
  if (error) return <Container><Alert severity="error">{error}</Alert></Container>;
  if (!cartItems || cartItems.length === 0) return (
    <Container><Alert severity="info">No hay productos en tu carrito de compras.</Alert></Container>
  );

  return (
    <Container maxWidth="lg" translate="no">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h4>TUㅤ </h4>
        <ShoppingCartIcon sx={{ ml: 1, color: 'green' }} />
        <h4>ㅤDE COMPRAS</h4>
      </div>
      <hr/>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Producto</TableCell>
              <TableCell>Talla</TableCell>
              <TableCell>Color</TableCell>
              <TableCell>Cantidad</TableCell>
              <TableCell>Precio Unitario</TableCell>
              <TableCell>Precio Total</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cartItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell translate="no">
                  <Box display="flex" alignItems="center">
                    <img 
                      src={item.colores ? 
                        item.colores.find(c => c.nombre === item.color)?.imagen : 
                        item.imagenes[0]} 
                      alt={item.nombre} 
                      style={{ width: 50, marginRight: 16 }} 
                      translate="no"
                    />
                    <Typography>{item.nombre}</Typography>
                  </Box>
                </TableCell>
                <TableCell translate="no">
                  <FormControl fullWidth>
                    <Select
                      value={item.talla}
                      onChange={(e) => handleSizeChange(item.id, e.target.value)}
                    >
                      {item.tallas && item.tallas.map((size) => (
                        <MenuItem key={size} value={size}>{size}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell translate="no">
                  {item.colores ? (
                    <FormControl fullWidth>
                      <Select
                        value={item.color}
                        onChange={(e) => handleColorChange(item.id, e.target.value)}
                      >
                        {item.colores.map((color) => (
                          <MenuItem key={color.nombre} value={color.nombre}>{color.nombre}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : 'N/A'}
                </TableCell>
                <TableCell translate="no">
                  <ButtonGroup>
                    <Button
                      onClick={() => handleQuantityChange(item.id, -1)}
                      disabled={item.cantidad <= 1}
                    >
                      <RemoveIcon />
                    </Button>
                    <Button disabled>{item.cantidad}</Button>
                    <Button onClick={() => handleQuantityChange(item.id, 1)}>
                      <AddIcon />
                    </Button>
                  </ButtonGroup>
                </TableCell>
                <TableCell translate="no">{formatPrice(parseFloat(item.precio))}</TableCell>
                <TableCell translate="no">{formatPrice(parseFloat(item.precio) * item.cantidad)}</TableCell>
                <TableCell translate="no">
                  <IconButton color="secondary" onClick={() => handleRemoveItem(item.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Grid item xs={12} md={5}>
        <Paper 
          elevation={3} 
          sx={{
            padding: 3,
            backgroundColor: theme.palette.background.default,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}></Typography>
          <Divider sx={{ my: 2 }} />
          
          {[
            { label: 'Subtotal', value: calculateSubtotal(cartItems) },
            { label: 'Envío', value: 1500 },
          ].map((item, index) => (
            <Box 
              key={index}
              display="flex" 
              justifyContent="space-between" 
              mb={1.5}
              sx={{ 
                '&:last-of-type': { mb: 2 },
                fontSize: isMobile ? '0.9rem' : '1rem',
              }}
            >
              <Typography color="text.secondary">{item.label}</Typography>
              <Typography>{formatPrice(item.value)}</Typography>
            </Box>
          ))}
          
          <Divider sx={{ my: 2 }} />
          
          <Box 
            display="flex" 
            justifyContent="space-between" 
            alignItems="center"
          >
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Total a pagar</Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 'bold',
                color: theme.palette.primary.main 
              }}
            >
              {formatPrice(calculateTotal(cartItems))}
            </Typography>
          </Box>
        </Paper>
      </Grid>

      {!showPaymentOptions ? (
        <Box mt={2}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={() => setShowPaymentOptions(true)}
          >
            Proceder al pago
          </Button>
          <br></br><br></br><hr></hr><br></br>
        </Box>
      ) : (
        <PaymentAndOrder 
          cartItems={cartItems} 
          calculateTotal={calculateTotal} 
          user={user}
          navigate={navigate}
        />
      )}
    </Container>
  );
};

export default Cart;