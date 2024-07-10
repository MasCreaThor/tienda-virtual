import React, { useState, useEffect } from 'react';
import { ref, onValue, push, update, remove } from 'firebase/database';
import { db } from './config/firebaseConfig';
import { 
  Tabs, Tab, Box, TextField, Button, Table, TableBody, TableCell, TableHead, TableRow, Paper, 
  IconButton, Container, Grid, Typography, Snackbar, Alert, TableContainer
} from '@mui/material';
import { styled } from '@mui/system';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const FormWrapper = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  '&.MuiTableCell-head': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
  },
  '&.MuiTableCell-body': {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  // hide last border
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

const Proveedores = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [proveedores, setProveedores] = useState([]);
  const [editingProveedorId, setEditingProveedorId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const proveedoresRef = ref(db, 'proveedores');
    onValue(proveedoresRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setProveedores(Object.entries(data).map(([key, value]) => ({ id: key, ...value })));
      }
    });
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!nombre || !telefono) {
      setSnackbar({ open: true, message: 'Por favor completa todos los campos', severity: 'error' });
      return;
    }

    const newProveedor = {
      nombre,
      telefono,
    };

    const proveedoresRef = ref(db, 'proveedores');
    if (editingProveedorId) {
      const proveedorRef = ref(db, `proveedores/${editingProveedorId}`);
      update(proveedorRef, newProveedor);
      setEditingProveedorId(null);
      setSnackbar({ open: true, message: 'Proveedor actualizado con éxito', severity: 'success' });
    } else {
      push(proveedoresRef, newProveedor);
      setSnackbar({ open: true, message: 'Proveedor registrado con éxito', severity: 'success' });
    }

    setNombre('');
    setTelefono('');
  };

  const handleEditProveedor = (proveedor) => {
    setNombre(proveedor.nombre);
    setTelefono(proveedor.telefono);
    setEditingProveedorId(proveedor.id);
    setActiveTab(0);
  };

  const handleDeleteProveedor = (proveedorId) => {
    const proveedorRef = ref(db, `proveedores/${proveedorId}`);
    remove(proveedorRef);
    setSnackbar({ open: true, message: 'Proveedor eliminado con éxito', severity: 'success' });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ width: '100%', typography: 'body1', mt: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Registrar Proveedor" />
          <Tab label="Ver Proveedores" />
        </Tabs>
        {activeTab === 0 && (
          <FormWrapper>
            <Typography variant="h6" gutterBottom>
              {editingProveedorId ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor'}
            </Typography>
            <form onSubmit={handleFormSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Nombre completo"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Teléfono"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button type="submit" variant="contained" color="primary" fullWidth>
                    {editingProveedorId ? 'Actualizar' : 'Registrar'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </FormWrapper>
        )}
        {activeTab === 1 && (
          <TableContainer component={Paper} sx={{ mt: 3, overflowX: 'auto' }}>
            <Table sx={{ minWidth: 650 }} aria-label="tabla de proveedores">
              <TableHead>
                <TableRow>
                  <StyledTableCell>Nombre Completo</StyledTableCell>
                  <StyledTableCell>Teléfono</StyledTableCell>
                  <StyledTableCell align="center">Acciones</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {proveedores.map((proveedor) => (
                  <StyledTableRow key={proveedor.id}>
                    <StyledTableCell component="th" scope="row">
                      {proveedor.nombre}
                    </StyledTableCell>
                    <StyledTableCell>{proveedor.telefono}</StyledTableCell>
                    <StyledTableCell align="center">
                      <IconButton 
                        onClick={() => handleEditProveedor(proveedor)}
                        color="primary"
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleDeleteProveedor(proveedor.id)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </StyledTableCell>
                  </StyledTableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Proveedores;