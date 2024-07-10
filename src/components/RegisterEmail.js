import React, { useState } from 'react';
import { Button, TextField, Typography, Alert } from '@mui/material';
import { styled } from '@mui/system';
import { getDatabase, ref, get, query, orderByChild, equalTo } from "firebase/database";
import { motion } from 'framer-motion';

const FormContainer = styled(motion.div)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  padding: '20px',
  background: 'linear-gradient(135deg, #6e8efb, #a777e3)',
  [theme.breakpoints.down('sm')]: {
    padding: '10px',
  },
}));

const FormWrapper = styled(motion.div)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.9)',
  borderRadius: '15px',
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
  backdropFilter: 'blur(4px)',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  maxWidth: '400px',
  width: '100%',
  padding: '30px',
  boxSizing: 'border-box',
  [theme.breakpoints.down('sm')]: {
    padding: '20px',
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

const RegisterEmail = ({ nextStep }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const checkEmailExists = async (email) => {
    const db = getDatabase();
    const usersRef = ref(db, 'users');
    const emailQuery = query(usersRef, orderByChild('email'), equalTo(email));

    try {
      const snapshot = await get(emailQuery);
      return snapshot.exists();
    } catch (error) {
      console.error("Error checking email:", error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const emailExists = await checkEmailExists(email);
      if (emailExists) {
        setError('Este correo electrónico ya está registrado.');
      } else {
        nextStep(email);
      }
    } catch (err) {
      setError('Ocurrió un error al verificar el correo electrónico. Por favor, intente de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <FormWrapper
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 120 }}
      >
        <Typography variant="h4" gutterBottom align="center" style={{ color: '#6e8efb' }}>
          Agrega tu e-mail
        </Typography>
        <Typography variant="subtitle1" gutterBottom align="center">
          Asegúrate de tener acceso a él.
        </Typography>
        <form onSubmit={handleSubmit}>
          <StyledTextField
            label="Correo Electrónico"
            variant="outlined"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            margin="normal"
            required
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
      </FormWrapper>
    </FormContainer>
  );
};

export default RegisterEmail;