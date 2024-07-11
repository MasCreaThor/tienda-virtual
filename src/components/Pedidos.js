import React, { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { db } from './config/firebaseConfig';
import {
  Container, Typography, Tabs, Tab, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Dialog, DialogActions, DialogContent, DialogTitle, Select, MenuItem, FormControl, InputLabel, Card,
  CardContent, CardMedia, Snackbar,
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Pedidos = () => {
  const [value, setValue] = useState(0);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [openOrderDetails, setOpenOrderDetails] = useState(false);
  const [openClientDetails, setOpenClientDetails] = useState(false);
  const [users, setUsers] = useState({});
  const [productos, setProductos] = useState({});
  const [proveedores, setProveedores] = useState({});
  const [categorias, setCategorias] = useState({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    const ordersRef = ref(db, 'orders');
    const usersRef = ref(db, 'users');
    const productosRef = ref(db, 'productos');
    const proveedoresRef = ref(db, 'proveedores');
    const categoriasRef = ref(db, 'categorias');

    onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const orderList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setOrders(orderList);
      }
    });

    onValue(usersRef, (snapshot) => {
      setUsers(snapshot.val() || {});
    });

    onValue(productosRef, (snapshot) => {
      setProductos(snapshot.val() || {});
    });

    onValue(proveedoresRef, (snapshot) => {
      setProveedores(snapshot.val() || {});
    });

    onValue(categoriasRef, (snapshot) => {
      setCategorias(snapshot.val() || {});
    });
  }, []);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleOpenDialog = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleStatusChange = (event) => {
    setNewStatus(event.target.value);
  };

  const updateOrderStatus = () => {
    if (newStatus === 'processing' && selectedOrder.status === 'pending') {
      const orderItems = selectedOrder.items;
      let canProcess = true;
      const updates = {};

      orderItems.forEach(item => {
        const producto = productos[item.productoId];
        if (producto) {
          const currentStock = parseInt(producto.stock);
          const orderedQuantity = item.cantidad;
          if (currentStock < orderedQuantity) {
            canProcess = false;
            setSnackbarMessage(`Stock insuficiente para el producto: ${producto.nombre}`);
            setSnackbarOpen(true);
            return;
          }
          const newStock = currentStock - orderedQuantity;
          updates[`productos/${item.productoId}/stock`] = newStock.toString();
        }
      });

      if (!canProcess) {
        return;
      }

      updates[`orders/${selectedOrder.id}/status`] = newStatus;
      
      update(ref(db), updates)
        .then(() => {
          console.log('Order status and stock updated successfully');
          setSnackbarMessage('Pedido procesado y stock actualizado');
          setSnackbarOpen(true);
          handleCloseDialog();
        })
        .catch((error) => {
          console.error('Error updating order status and stock:', error);
          setSnackbarMessage('Error al procesar el pedido');
          setSnackbarOpen(true);
        });
    } else {
      const orderRef = ref(db, `orders/${selectedOrder.id}`);
      update(orderRef, { status: newStatus })
        .then(() => {
          console.log('Order status updated successfully');
          setSnackbarMessage('Estado del pedido actualizado');
          setSnackbarOpen(true);
          handleCloseDialog();
        })
        .catch((error) => {
          console.error('Error updating order status:', error);
          setSnackbarMessage('Error al actualizar el estado del pedido');
          setSnackbarOpen(true);
        });
    }
  };

  const getOrdersByStatus = (status) => {
    return orders.filter(order => order.status === status);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleOpenOrderDetails = (order) => {
    setSelectedOrder(order);
    setOpenOrderDetails(true);
  };

  const handleCloseOrderDetails = () => {
    setOpenOrderDetails(false);
  };

  const handleOpenClientDetails = (order) => {
    setSelectedOrder(order);
    setOpenClientDetails(true);
  };

  const handleCloseClientDetails = () => {
    setOpenClientDetails(false);
  };

  const renderOrderTable = (orders) => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: 'rgba(0, 132, 255, 0.788);' }}>
            <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>ID Pedido</TableCell>
            <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Pedido</TableCell>
            <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Fecha</TableCell>
            <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Total</TableCell>
            <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Método/Pago</TableCell>
            <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Cliente</TableCell>
            <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Comprobante</TableCell>
            <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>{order.id}</TableCell>
              <TableCell>
                <Button onClick={() => handleOpenOrderDetails(order)}>
                  Ver detalles
                </Button>
              </TableCell>
              <TableCell>{formatDate(order.createdAt)}</TableCell>
              <TableCell>{Number(order.total).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</TableCell>
              <TableCell>{order.paymentMethod}</TableCell>
              <TableCell>
                <Button onClick={() => handleOpenClientDetails(order)}>
                  Ver cliente
                </Button>
              </TableCell>
              <TableCell>
                {order.paymentProofURL ? (
                  <Button onClick={() => window.open(order.paymentProofURL, '_blank')}>
                    Ver Comprobante
                  </Button>
                ) : 'N/A'}
              </TableCell>
              <TableCell>
                <Button onClick={() => handleOpenDialog(order)}>
                  Cambiar Estado
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Gestión de Pedidos
      </Typography>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="order tabs">
          <Tab label="Pendientes" />
          <Tab label="En Proceso" />
          <Tab label="Enviados" />
          <Tab label="Entregados" />
          <Tab label="Cancelados" />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        {renderOrderTable(getOrdersByStatus('pending'))}
      </TabPanel>
      <TabPanel value={value} index={1}>
        {renderOrderTable(getOrdersByStatus('processing'))}
      </TabPanel>
      <TabPanel value={value} index={2}>
        {renderOrderTable(getOrdersByStatus('shipped'))}
      </TabPanel>
      <TabPanel value={value} index={3}>
        {renderOrderTable(getOrdersByStatus('delivered'))}
      </TabPanel>
      <TabPanel value={value} index={4}>
        {renderOrderTable(getOrdersByStatus('cancelled'))}
      </TabPanel>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Cambiar Estado del Pedido</DialogTitle>
        <DialogContent>
          <FormControl fullWidth>
            <InputLabel id="status-select-label">Nuevo Estado</InputLabel>
            <Select
              labelId="status-select-label"
              id="status-select"
              value={newStatus}
              label="Nuevo Estado"
              onChange={handleStatusChange}
            >
              <MenuItem value="pending">Pendiente</MenuItem>
              <MenuItem value="processing">En Proceso</MenuItem>
              <MenuItem value="shipped">Enviado</MenuItem>
              <MenuItem value="delivered">Entregado</MenuItem>
              <MenuItem value="cancelled">Cancelado</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={updateOrderStatus}>Actualizar</Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={openOrderDetails} 
        onClose={handleCloseOrderDetails} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          style: {
            maxHeight: '90vh',
            overflowY: 'auto',
          },
        }}
      >
        <DialogTitle>Detalles del Pedido</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {selectedOrder && selectedOrder.items && selectedOrder.items.map((item, index) => {
              const producto = productos[item.productoId] || {};
              const proveedor = proveedores[producto.proveedor] || {};
              const categoria = categorias[producto.categoria] || {};
              return (
                <Card key={index} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
                  <CardMedia
                    component="img"
                    sx={{ 
                      width: { xs: '100%', sm: 151 }, 
                      height: { xs: 200, sm: 'auto' },
                      objectFit: 'cover'
                    }}
                    image={item.imagenes && item.imagenes[0] ? item.imagenes[0] : producto.imagenes && producto.imagenes[0]}
                    alt={item.nombre || producto.nombre}
                  />
                  <CardContent sx={{ flex: '1 0 auto' }}>
                    <Typography component="div" variant="h6">
                      {item.nombre || producto.nombre}
                    </Typography>
                    <Typography variant="subtitle2" color="text.secondary">
                      Talla: {item.talla}, Color: {item.color || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      Cantidad: {item.cantidad}
                    </Typography>
                    <Typography variant="body2">
                      Proveedor: {proveedor.nombre || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      Categoría: {categoria.nombre || 'N/A'}
                    </Typography>
                    {proveedor.telefono && (
                      <Button 
                        startIcon={<WhatsAppIcon />} 
                        onClick={() => window.open(`https://wa.me/${proveedor.telefono}`, '_blank')}
                        size="small"
                        sx={{ mt: 1 }}
                      >
                        Contactar proveedor
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseOrderDetails}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openClientDetails} onClose={handleCloseClientDetails}>
        <DialogTitle>Detalles del Cliente</DialogTitle>
        <DialogContent>
          {selectedOrder && users[selectedOrder.userId] && (
            <Box>
              <Typography variant="h6">{users[selectedOrder.userId].fullName} {users[selectedOrder.userId].lastName}</Typography>
              <Typography>Email: {users[selectedOrder.userId].email}</Typography>
              <Typography>Teléfono: {users[selectedOrder.userId].phone}</Typography>
              <Typography variant="h6" sx={{ mt: 2 }}>Dirección de envío:</Typography>
              <Typography>{selectedOrder.shippingInfo.address}</Typography>
              <Typography>{selectedOrder.shippingInfo.city}, {selectedOrder.shippingInfo.department}</Typography>
              <Typography>{selectedOrder.shippingInfo.country}</Typography>
              <Typography>Detalles: {selectedOrder.shippingInfo.details}</Typography>
              <Typography>Documento de quien recibe: {selectedOrder.shippingInfo.recipientDocument}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseClientDetails}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Container>
  );
};

export default Pedidos;