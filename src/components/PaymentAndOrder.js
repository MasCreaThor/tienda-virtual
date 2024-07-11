import React, { useState, useEffect } from 'react';
import { ref, push, remove, get, set } from 'firebase/database';
import { uploadBytes, ref as storageRef, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config/firebaseConfig';
import {
  Typography,
  Button,
  Box,
  Modal,
  TextField,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';

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

const PaymentAndOrder = ({ cartItems, calculateTotal, user, navigate }) => {
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
  const [paymentProof, setPaymentProof] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    if (user) {
      const userRef = ref(db, `users/${user.uid}`);
      get(userRef).then((snapshot) => {
        if (snapshot.exists()) {
          setUserInfo(snapshot.val());
        }
      }).catch((error) => {
        console.error("Error fetching user info: ", error);
      });
    }
  }, [user]);

  const handlePaymentSubmit = async () => {
    setIsProcessing(true);
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
  
    const cleanedCartItems = cartItems.map(item => {
      const cleanedItem = {...item};
      if (cleanedItem.colores === undefined) {
        delete cleanedItem.colores;
      }
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
      shippingInfo: {
        ...newUserInfo.address,
        recipientDocument: recipientDocument,
      },
      paymentProofURL: paymentProofURL,
    };
  
    console.log("Iniciando proceso de pedido");
    console.log("Datos del usuario:", newUserInfo);
    console.log("Datos del pedido:", newOrder);
  
    push(ordersRef, newOrder)
      .then((newOrderRef) => {
        console.log("Order placed successfully");
        
        remove(cartRef)
          .then(() => {
            console.log("Cart cleared successfully");
            setModalOpen(false);
            navigate(`/success?orderId=${newOrderRef.key}`);
          })
          .catch((error) => {
            console.error("Error clearing cart: ", error);
            setError(`Error al limpiar el carrito: ${error.message}`);
          });
      })
      .catch((error) => {
        console.error("Error placing order: ", error);
        setError(`Error al realizar el pedido: ${error.message}`);
      })
      .finally(() => {
        setIsProcessing(false);
      });
  };

  return (
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
      </>
    );
  };
  
  export default PaymentAndOrder;