// src/components/Clientes.js
import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  TextField, 
  Button, 
  Typography,
  Box,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { getDatabase, ref, get, remove } from 'firebase/database';
import { styled } from '@mui/material/styles';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  '&.MuiTableCell-head': {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
    fontWeight: 'bold',
    fontSize: '0.9rem',
  },
  '&.MuiTableCell-body': {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

const ScrollableTableContainer = styled(TableContainer)(({ theme }) => ({
  maxWidth: '100%',
  overflowX: 'auto',
  '&::-webkit-scrollbar': {
    height: '8px',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: theme.palette.grey[300],
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: theme.palette.primary.main,
    borderRadius: '4px',
  },
}));

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    const db = getDatabase();
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    if (snapshot.exists()) {
      const clientesData = Object.entries(snapshot.val()).map(([id, data]) => ({
        id,
        ...data
      }));
      setClientes(clientesData);
      setFilteredClientes(clientesData);
    }
  };

  useEffect(() => {
    const filtered = clientes.filter(cliente => 
      cliente.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.phone.includes(searchTerm) ||
      (cliente.recipientDocument && cliente.recipientDocument.includes(searchTerm))
    );
    setFilteredClientes(filtered);
  }, [searchTerm, clientes]);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleDeleteCliente = async (clienteId) => {
    if (window.confirm('¿Está seguro de que desea eliminar este cliente? Esta acción eliminará todos los datos asociados al cliente.')) {
      const db = getDatabase();
      
      // Eliminar usuario
      await remove(ref(db, `users/${clienteId}`));
      
      // Eliminar carrito
      await remove(ref(db, `carritos/${clienteId}`));
      
      // Eliminar pedidos
      const ordersRef = ref(db, 'orders');
      const ordersSnapshot = await get(ordersRef);
      if (ordersSnapshot.exists()) {
        const orders = ordersSnapshot.val();
        for (const [orderId, order] of Object.entries(orders)) {
          if (order.userId === clienteId) {
            await remove(ref(db, `orders/${orderId}`));
          }
        }
      }
      
      // Actualizar la lista de clientes
      fetchClientes();
    }
  };

  return (
    <Box sx={{ 
      width: '100%', 
      px: isMobile ? 2 : 0, // Padding horizontal en móviles
      pr: isMobile ? 2 : 3, // Padding derecho en escritorio
    }}>
      <Typography variant="h4" gutterBottom>
        Clientes Registrados
      </Typography>
      <TextField
        label="Buscar cliente"
        variant="outlined"
        fullWidth
        margin="normal"
        value={searchTerm}
        onChange={handleSearch}
      />
      <ScrollableTableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <StyledTableRow>
              <StyledTableCell>Nombre</StyledTableCell>
              <StyledTableCell>Apellido</StyledTableCell>
              <StyledTableCell>Email</StyledTableCell>
              <StyledTableCell>Teléfono</StyledTableCell>
              <StyledTableCell>Documento</StyledTableCell>
              <StyledTableCell>Acciones</StyledTableCell>
            </StyledTableRow>
          </TableHead>
          <TableBody>
            {filteredClientes.map((cliente) => (
              <StyledTableRow key={cliente.id}>
                <StyledTableCell>{cliente.fullName}</StyledTableCell>
                <StyledTableCell>{cliente.lastName}</StyledTableCell>
                <StyledTableCell>{cliente.email}</StyledTableCell>
                <StyledTableCell>{cliente.phone}</StyledTableCell>
                <StyledTableCell>{cliente.recipientDocument || 'N/A'}</StyledTableCell>
                <StyledTableCell>
                  <Button 
                    variant="contained" 
                    color="error" 
                    onClick={() => handleDeleteCliente(cliente.id)}
                    size="small"
                  >
                    Eliminar
                  </Button>
                </StyledTableCell>
              </StyledTableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollableTableContainer>
    </Box>
  );
};

export default Clientes;