import React, { useState } from 'react';
import { Button, TextField, Typography, Alert, ThemeProvider, createTheme, InputAdornment } from '@mui/material';
import { styled } from '@mui/system';
import { getDatabase, ref, get, query, orderByChild, equalTo } from "firebase/database";
import { motion } from 'framer-motion';

const theme = createTheme({
  palette: {
    primary: {
      main: '#6e8efb',
    },
    secondary: {
      main: '#a777e3',
    },
  },
});

const PageContainer = styled('div')({
  minHeight: '100vh',
  width: '100vw',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: 'linear-gradient(135deg, #6e8efb, #a777e3)',
});

const FormContainer = styled(motion.div)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.9)',
  borderRadius: '15px',
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
  backdropFilter: 'blur(4px)',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  padding: '30px',
  width: '100%',
  maxWidth: '400px',
  [theme.breakpoints.down('sm')]: {
    padding: '20px',
    margin: '0 15px',
  },
}));

const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    '&.Mui-focused fieldset': {
      borderColor: '#a777e3',
    },
  },
});

const StyledButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(45deg, #6e8efb 30%, #a777e3 90%)',
  border: 0,
  borderRadius: 3,
  boxShadow: '0 3px 5px 2px rgba(167, 119, 227, .3)',
  color: 'white',
  height: 48,
  padding: '0 30px',
  marginTop: '20px',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'scale(1.05)',
  },
}));

const RegisterPhone = ({ nextStep }) => {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Elimina cualquier carácter que no sea un dígito
    if (value.length <= 10) {
      setPhone(value);
    }
  };

  const checkPhoneExists = async (phone) => {
    const db = getDatabase();
    const usersRef = ref(db, 'users');
    const phoneQuery = query(usersRef, orderByChild('phone'), equalTo('+57 ' + phone));

    try {
      const snapshot = await get(phoneQuery);
      return snapshot.exists();
    } catch (error) {
      console.error("Error checking phone:", error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (phone.length !== 10) {
      setError('Por favor, ingrese un número de teléfono válido (10 dígitos)');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const phoneExists = await checkPhoneExists(phone);
      if (phoneExists) {
        setError('Este número de teléfono ya está registrado.');
      } else {
        nextStep('+57 ' + phone);
      }
    } catch (err) {
      console.error("Error detallado:", err);
      nextStep('+57 ' + phone);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <PageContainer>
        <FormContainer
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h4" gutterBottom align="center" style={{ color: '#6e8efb' }}>
            ¡Registra tu número de teléfono!
          </Typography>
          <Typography variant="subtitle1" gutterBottom align="center">
            Para estar más conectados.
          </Typography>
          <form onSubmit={handleSubmit}>
            <StyledTextField
              label="Número de Teléfono"
              variant="outlined"
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              fullWidth
              margin="normal"
              required
              InputProps={{
                startAdornment: <InputAdornment position="start">+57 </InputAdornment>,
              }}
              placeholder="1234567890"
            />
            {error && <Alert severity="error" style={{ marginBottom: '10px' }}>{error}</Alert>}
            <StyledButton 
              type="submit" 
              fullWidth
              disabled={isLoading}
            >
              {isLoading ? 'Verificando...' : 'Siguiente'}
            </StyledButton>
          </form>
        </FormContainer>
      </PageContainer>
    </ThemeProvider>
  );
};

export default RegisterPhone;