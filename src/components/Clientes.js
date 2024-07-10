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
  Typography 
} from '@mui/material';
import { getDatabase, ref, get, remove } from 'firebase/database';

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

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
    <div>
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
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Apellido</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Documento</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredClientes.map((cliente) => (
              <TableRow key={cliente.id}>
                <TableCell>{cliente.fullName}</TableCell>
                <TableCell>{cliente.lastName}</TableCell>
                <TableCell>{cliente.email}</TableCell>
                <TableCell>{cliente.phone}</TableCell>
                <TableCell>{cliente.recipientDocument || 'N/A'}</TableCell>
                <TableCell>
                  <Button 
                    variant="contained" 
                    color="error" 
                    onClick={() => handleDeleteCliente(cliente.id)}
                  >
                    Eliminar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default Clientes;