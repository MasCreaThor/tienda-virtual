import React, { useState, useEffect } from 'react';
import { Button, TextField, Typography, Alert, Stack, LinearProgress, ThemeProvider, createTheme } from '@mui/material';
import { styled } from '@mui/system';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, db } from './config/firebaseConfig';
import { useNavigate } from 'react-router-dom';
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

const PasswordStrengthBar = styled(LinearProgress)(({ theme, value }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  height: 10,
  borderRadius: 5,
  '& .MuiLinearProgress-bar': {
    backgroundColor: 
      value < 33 ? theme.palette.error.main :
      value < 66 ? theme.palette.warning.main :
      theme.palette.success.main,
  },
}));

const RegisterPassword = ({ email, name, lastName, phone }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    calculatePasswordStrength(password);
  }, [password]);

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.match(/[a-z]+/)) strength += 25;
    if (password.match(/[A-Z]+/)) strength += 25;
    if (password.match(/[0-9]+/)) strength += 25;
    setPasswordStrength(strength);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setAlertSeverity('error');
      setAlertMessage("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      setAlertSeverity('error');
      setAlertMessage("Las contraseñas no coinciden");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Guardar los datos en Realtime Database
      set(ref(db, 'users/' + user.uid), {
        email: email,
        fullName: name,
        lastName: lastName,
        phone: phone
      });

      setAlertSeverity('success');
      setAlertMessage('Usuario registrado con éxito');
      setTimeout(() => navigate('/'), 2000); // Redirige al usuario a la página principal después de 2 segundos

    } catch (error) {
      console.error('Error registrando el usuario:', error);
      setAlertSeverity('error');
      setAlertMessage('Error registrando el usuario');
    }
  };

  return (
    <ThemeProvider theme={theme}>
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
            Elige una contraseña segura
          </Typography>
          <Typography variant="subtitle1" gutterBottom align="center">
            ¡Tú tienes el control!
          </Typography>
          {alertMessage && (
            <Stack spacing={2} sx={{ marginBottom: '20px' }}>
              <Alert severity={alertSeverity} onClose={() => setAlertMessage('')}>{alertMessage}</Alert>
            </Stack>
          )}
          <form onSubmit={handleSubmit}>
            <StyledTextField
              label="Contraseña"
              variant="outlined"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              margin="normal"
              required
              helperText="La contraseña debe tener al menos 8 caracteres"
            />
            <PasswordStrengthBar variant="determinate" value={passwordStrength} />
            <StyledTextField
              label="Confirmar Contraseña"
              variant="outlined"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
              margin="normal"
              required
            />
            <StyledButton type="submit" fullWidth>
              Registrar
            </StyledButton>
          </form>
        </FormWrapper>
      </FormContainer>
    </ThemeProvider>
  );
};

export default RegisterPassword;