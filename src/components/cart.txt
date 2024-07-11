import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SuccessScreen from './SuccessScreen';
import ErrorScreen from './ErrorScreen';
import { ref, onValue, remove, update, get, set, push } from 'firebase/database';
import { auth, db, storage } from './config/firebaseConfig';
import { uploadBytes, ref as storageRef, getDownloadURL } from 'firebase/storage';
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
  Modal,
  TextField,
  InputLabel,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

import daviplataLogo from './assets/imgBancos/daviplata.png';
import nequiLogo from './assets/imgBancos/nequi.png';
import bancolombiaLogo from './assets/imgBancos/bancolombia.png';
import daviplataQR from './assets/imgBancos/qr.png';
import nequiQR from './assets/imgBancos/qr.png';
import bancolombiaQR from './assets/imgBancos/qr.png';

const PaymentOption = ({ name, logo, isSelected, onClick, children }) => (
  <Box mb={2}>
    <Button 
      variant={isSelected ? "contained" : "outlined"} 
      color="primary" 
      onClick={onClick} 
      fullWidth
      style={{ justifyContent: "flex-start", padding: "10px" }}
    >
      {logo && <img src={logo} alt={name} style={{ height: "30px", marginRight: "10px" }} />}
      {name}
    </Button>
    {isSelected && (
      <Box mt={2} p={2} border={1} borderColor="grey.300" borderRadius={1}>
        {children}
      </Box>
    )}
  </Box>
);

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [address, setAddress] = useState('');
  const [details, setDetails] = useState('');
  const [recipientDocument, setRecipientDocument] = useState('');
  const [userInfo, setUserInfo] = useState({
    fullName: '',
    lastName: '',
    phone: '',
    email: '',
  });
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [paymentProof, setPaymentProof] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [orderStatus, setOrderStatus] = useState(null);
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

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
        fetchUserInfo(currentUser.uid);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [fetchCartData]);

  useEffect(() => {
    fetch('https://www.datos.gov.co/resource/xdk5-pm3f.json')
      .then(response => response.json())
      .then(data => {
        const uniqueDepartments = [...new Set(data.map(item => item.departamento))];
        setDepartments(uniqueDepartments.sort());
      })
      .catch(error => console.error('Error fetching departments:', error));
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      fetch(`https://www.datos.gov.co/resource/xdk5-pm3f.json?departamento=${selectedDepartment}`)
        .then(response => response.json())
        .then(data => {
          const citiesForDepartment = data.map(item => item.municipio);
          setCities(citiesForDepartment.sort());
        })
        .catch(error => console.error('Error fetching cities:', error));
    }
  }, [selectedDepartment]);

  const fetchUserInfo = (uid) => {
    const userRef = ref(db, `users/${uid}`);
    get(userRef).then((snapshot) => {
      if (snapshot.exists()) {
        setUserInfo(snapshot.val());
      }
    }).catch((error) => {
      console.error("Error fetching user info: ", error);
    });
  };

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

  const handlePaymentSubmit = async () => {
    setIsProcessing(true);
    const user = auth.currentUser;
    if (!user) {
      setError("Debes iniciar sesión para realizar un pedido.");
      setIsProcessing(false);
      return;
    }
  
    if (!selectedDepartment || !selectedCity || !address || !recipientDocument) {
      setError("Por favor, complete todos los campos obligatorios.");
      setIsProcessing(false);
      return;
    }
  
    if (!cartItems || cartItems.length === 0) {
      setError("Tu carrito está vacío. No se puede realizar el pedido.");
      setIsProcessing(false);
      return;
    }
  
    if (selectedPayment !== 'Contraentrega' && !paymentProof) {
      setError("Por favor, sube un comprobante de pago.");
      setIsProcessing(false);
      return;
    }
  
    const userRef = ref(db, `users/${user.uid}`);
    const ordersRef = ref(db, 'orders');
    const cartRef = ref(db, `carritos/${user.uid}`);
  
    const newUserInfo = {
      ...userInfo,
      address: {
        country: 'Colombia',
        department: selectedDepartment,
        city: selectedCity,
        address: address,
        details: details,
      },
      recipientDocument: recipientDocument,
    };
  
    // Limpiar los items del carrito de propiedades undefined
    const cleanedCartItems = cartItems.map(item => {
      const cleanedItem = {...item};
      if (cleanedItem.colores === undefined) {
        delete cleanedItem.colores;
      }
      // Eliminar otras propiedades que puedan ser undefined
      Object.keys(cleanedItem).forEach(key => {
        if (cleanedItem[key] === undefined) {
          delete cleanedItem[key];
        }
      });
      return cleanedItem;
    });
  
    let paymentProofURL = null;
    if (paymentProof && selectedPayment !== 'Contraentrega') {
      const fileRef = storageRef(storage, `payment_proofs/${user.uid}_${Date.now()}`);
      await uploadBytes(fileRef, paymentProof);
      paymentProofURL = await getDownloadURL(fileRef);
    }
  
    const newOrder = {
      userId: user.uid,
      items: cleanedCartItems,
      total: calculateTotal(cartItems),
      status: 'pending',
      paymentMethod: selectedPayment,
      createdAt: Date.now(),
      shippingInfo: newUserInfo.address,
      paymentProofURL: paymentProofURL,
    };
  
    console.log("Iniciando proceso de pedido");
    console.log("Datos del usuario:", newUserInfo);
    console.log("Datos del pedido:", newOrder);
  
    // Primero, actualizar la información del usuario
    push(ordersRef, newOrder)
      .then((newOrderRef) => {
        console.log("Order placed successfully");
        
        // Eliminar los productos del carrito
        remove(cartRef)
          .then(() => {
            console.log("Cart cleared successfully");
            setModalOpen(false);
            setCartItems([]);
            setOrderStatus('success');
            // Redirige a la pantalla de éxito con el ID del pedido
            navigate(`/success?orderId=${newOrderRef.key}`);
          })
          .catch((error) => {
            console.error("Error clearing cart: ", error);
            setError(`Error al limpiar el carrito: ${error.message}`);
          });
      })
      .catch((error) => {
        console.error("Error placing order: ", error);
        setOrderStatus('error');
        setError(`Error al realizar el pedido: ${error.message}`);
      })
      .finally(() => {
        setIsProcessing(false);
      });
  };
  const handleErrorTimeout = useCallback(() => {
    setOrderStatus(null);
    window.location.reload();
  }, []);

  if (orderStatus === 'success') {
    return <SuccessScreen />;
  }

  if (orderStatus === 'error') {
    return <ErrorScreen onTimeout={handleErrorTimeout} />;
  }

  if (!authChecked) return <Container><CircularProgress /></Container>;
  if (!user) return <Container><Alert severity="info">Debes iniciar sesión para ver tu carrito de compras.</Alert></Container>;
  if (loading) return <Container><CircularProgress /></Container>;
  if (error) return <Container><Alert severity="error">{error}</Alert></Container>;
  if (!cartItems || cartItems.length === 0) return (
    <>
  
      <Container><Alert severity="info">No hay productos en tu carrito de compras.</Alert></Container>
    </>
  );

  return (
    <>

     
      <hr></hr>
      <br></br>

      <Container maxWidth="lg" translate="no">
        
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><h4>TUㅤ </h4>
      <ShoppingCartIcon sx={{ ml: 1, color: 'green' }} /><h4>ㅤDE COMPRAS</h4>
     
    </div>
    <hr></hr>
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
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
               
              </Typography>
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
          <Grid container spacing={3} mt={4}>
          <Grid item xs={12} md={7}>
            {!showPaymentOptions ? (
              <Box>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={() => {
                    setShowPaymentOptions(true);
                    setSelectedPayment(null);
                  }}
                  sx={{ mb: 2 }}
                >
                  Pagar pedido
                </Button>
                <Button
  variant="contained"
  style={{ backgroundColor: '#00D157', color: 'white' }}
  fullWidth
  onClick={() => {
    setSelectedPayment('Contraentrega');
    setModalOpen(true);
  }}
>
  Pagar contraentrega
</Button>

              </Box>
            ) : (
              <>
                <Typography variant="h6" gutterBottom>Selecciona un método de pago</Typography>
                <PaymentOption
                  name="Daviplata"
                  logo={daviplataLogo}
                  isSelected={selectedPayment === 'Daviplata'}
                  onClick={() => setSelectedPayment('Daviplata')}
                >
                  <Box bgcolor="#e3001b" color="white" p={2} borderRadius={1}>
                    <Typography variant="h6">Paga con Daviplata</Typography>
                    <Typography>Escanee nuestro QR con su aplicación Daviplata, o agregue nuestro número celular a sus contactos y realice su pago con Daviplata.</Typography>
                    <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography>AHORRO PESOS</Typography>
                        <Typography variant="h6">191-999999999-999</Typography>
                        <Typography>CC PESOS</Typography>
                        <Typography variant="h6">0021-9999-9999-99999999</Typography>
                      </Box>
                      <Box width="150px" height="150px" bgcolor="white">
                        <img src={daviplataQR} alt="Daviplata QR" style={{width: '100%', height: '100%'}} />
                      </Box>
                    </Box>
                    <Button variant="contained" color="inherit" fullWidth style={{marginTop: '10px', color: '#e3001b'}} onClick={() => setModalOpen(true)}>
                      Realizar Pedido
                    </Button>
                  </Box>
                </PaymentOption>
                
                <PaymentOption
                  name="Nequi"
                  logo={nequiLogo}
                  isSelected={selectedPayment === 'Nequi'}
                  onClick={() => setSelectedPayment('Nequi')}
                >
                  <Box bgcolor="#210049" color="white" p={2} borderRadius={1}>
                    <Typography variant="h6">Paga con Nequi</Typography>
                    <Typography>Escanee nuestro QR con su aplicación Nequi, o agregue nuestro número celular a sus contactos y realice su pago con Nequi.</Typography>
                    <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography>Empresa: Solution Maker</Typography>
                        <Typography>NIT: 1042746451</Typography>
                        <Typography>Celular: 99999999</Typography>
                      </Box>
                      <Box width="150px" height="150px" bgcolor="white">
                        <img src={nequiQR} alt="Nequi QR" style={{width: '100%', height: '100%'}} />
                      </Box>
                    </Box>
                    <Button variant="contained" color="inherit" fullWidth style={{marginTop: '10px', color: '#210049'}} onClick={() => setModalOpen(true)}>
                      Realizar Pedido
                    </Button>
                  </Box>
                </PaymentOption>
                
                <PaymentOption
                  name="Bancolombia"
                  logo={bancolombiaLogo}
                  isSelected={selectedPayment === 'Bancolombia'}
                  onClick={() => setSelectedPayment('Bancolombia')}
                >
                  <Box bgcolor="#ffd100" color="black" p={2} borderRadius={1}>
                    <Typography variant="h6">Paga con Bancolombia</Typography>
                    <Typography>Escanee nuestro QR con su aplicación Bancolombia, o agregue nuestro número celular a sus contactos y realice su pago con Bancolombia.</Typography>
                    <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography>AHORRO PESOS</Typography>
                        <Typography variant="h6">191-999999999-999</Typography>
                        <Typography>CC PESOS</Typography>
                        <Typography variant="h6">0021-9999-9999-99999999</Typography>
                      </Box>
                      <Box width="150px" height="150px" bgcolor="white">
                        <img src={bancolombiaQR} alt="Bancolombia QR" style={{width: '100%', height: '100%'}} />
                      </Box>
                    </Box>
                    <Button variant="contained" color="inherit" fullWidth style={{marginTop: '10px', color: '#ffd100', backgroundColor: 'black'}} onClick={() => setModalOpen(true)}>
                      Realizar Pedido
                    </Button>
                  </Box>
                </PaymentOption>
              </>
            )}
          </Grid>
          </Grid>
          <hr></hr>
          <br></br>
          
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: {xs: '90%', sm: '80%', md: '60%'},
            maxWidth: 600,
            maxHeight: '90vh',
            bgcolor: 'background.paper',
            border: '2px solid #000',
            boxShadow: 24,
            p: 4,
            overflow: 'auto',
          }}>
            <Typography id="modal-modal-title" variant="h6" component="h2" gutterBottom>
              Información de envío
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="country"
                  label="País"
                  name="country"
                  value="Colombia"
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="department-label">Departamento</InputLabel>
                  <Select
                    labelId="department-label"
                    id="department"
                    value={selectedDepartment}
                    label="Departamento"
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                  >
                    {departments.map((dept) => (
                      <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="city-label">Ciudad</InputLabel>
                  <Select
                    labelId="city-label"
                    id="city"
                    value={selectedCity}
                    label="Ciudad"
                    onChange={(e) => setSelectedCity(e.target.value)}
                  >
                    {cities.map((city) => (
                      <MenuItem key={city} value={city}>{city}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="address"
                  label="Dirección"
                  name="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  helperText="Ingrese su dirección completa"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="details"
                  label="Detalles"
                  name="details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  helperText="Ingrese detalles adicionales como casa, trabajo, edificio, barrio"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="recipientDocument"
                  label="Documento de quien recibe"
                  name="recipientDocument"
                  value={recipientDocument}
                  onChange={(e) => setRecipientDocument(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="fullName"
                  label="Nombre completo"
                  name="fullName"
                  value={userInfo.fullName}
                  onChange={(e) => setUserInfo({...userInfo, fullName: e.target.value})}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="lastName"
                  label="Apellido"
                  name="lastName"
                  value={userInfo.lastName}
                  onChange={(e) => setUserInfo({...userInfo, lastName: e.target.value})}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="phone"
                  label="Teléfono"
                  name="phone"
                  value={userInfo.phone}
                  onChange={(e) => setUserInfo({...userInfo, phone: e.target.value})}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="email"
                  label="Correo electrónico"
                  name="email"
                  value={userInfo.email}
                  onChange={(e) => setUserInfo({...userInfo, email: e.target.value})}
                />
              </Grid>
              {selectedPayment !== 'Contraentrega' && (
                <Grid item xs={12}>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="raised-button-file"
                    type="file"
                    onChange={(e) => setPaymentProof(e.target.files[0])}
                    required
                  />
                  <label htmlFor="raised-button-file">
                    <Button variant="contained" component="span">
                      Subir comprobante de pago
                    </Button>
                  </label>
                  {paymentProof && (
                    <Typography variant="body2" mt={1}>
                      Archivo seleccionado: {paymentProof.name}
                    </Typography>
                  )}
                  {!paymentProof && (
                    <Typography variant="body2" color="error" mt={1}>
                      *El comprobante de pago es obligatorio
                    </Typography>
                  )}
                </Grid>
              )}
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handlePaymentSubmit}
                  disabled={isProcessing || (selectedPayment !== 'Contraentrega' && !paymentProof)}
                >
                  {isProcessing ? 'Procesando...' : 'Confirmar Pedido'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Modal>
      </Container>
    </>
  );
};

export default Cart;