// ErrorScreen.jsx
import React, { useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const ErrorScreen = ({ onTimeout }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onTimeout();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onTimeout]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      bgcolor="#fff0f0"
    >
      <ErrorOutlineIcon sx={{ fontSize: 100, color: 'red', mb: 2 }} />
      <Typography variant="h4" gutterBottom>
        Error al procesar el pedido
      </Typography>
      <Typography variant="body1" align="center" sx={{ mb: 4 }}>
        Lo sentimos, ha ocurrido un error. Serás redirigido en unos segundos...
      </Typography>
      <CircularProgress />
    </Box>
  );
};

export default ErrorScreen;