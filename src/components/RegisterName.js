import React, { useState } from 'react';
import { Button, TextField, Typography } from '@mui/material';
import { styled } from '@mui/system';
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

const RegisterName = ({ nextStep }) => {
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    nextStep(name, lastName);
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
          ¿Cuál es tu nombre completo?
        </Typography>
        <Typography variant="subtitle1" gutterBottom align="center">
          Nos encantaría conocerte mejor.
        </Typography>
        <form onSubmit={handleSubmit}>
          <StyledTextField
            label="Nombre Completo"
            variant="outlined"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          <StyledTextField
            label="Apellido Completo"
            variant="outlined"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          <StyledButton type="submit" fullWidth>
            Siguiente
          </StyledButton>
        </form>
      </FormWrapper>
    </FormContainer>
  );
};

export default RegisterName;