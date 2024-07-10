import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from './config/firebaseConfig';
import { TextField, Button, Typography, Alert, Stack, Link as MuiLink, ThemeProvider, createTheme } from '@mui/material';
import { styled } from '@mui/system';
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

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('error');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setAlertSeverity('success');
      setAlertMessage('Inicio de sesión exitoso');
      setTimeout(() => navigate('/'), 2000); // Redirige al usuario a la página principal después de 2 segundos
    } catch (error) {
      console.error('Error iniciando sesión:', error);
      setAlertSeverity('error');
      setAlertMessage('Error iniciando sesión');
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
          <Typography component="h1" variant="h4" align="center" style={{ color: '#6e8efb', marginBottom: '20px' }}>
            Iniciar Sesión
          </Typography>
          <form onSubmit={handleSubmit}>
            {alertMessage && (
              <Stack spacing={2} sx={{ marginBottom: '20px' }}>
                <Alert severity={alertSeverity} onClose={() => setAlertMessage('')}>{alertMessage}</Alert>
              </Stack>
            )}
            <StyledTextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Correo Electrónico"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <StyledTextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Contraseña"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <StyledButton
              type="submit"
              fullWidth
            >
              Iniciar Sesión
            </StyledButton>
            <Typography variant="body2" align="center" sx={{ mt: 2 }}>
              ¿No tienes una cuenta? <MuiLink component={Link} to="/register" style={{ color: '#6e8efb' }}>Regístrate aquí</MuiLink>
            </Typography>
          </form>
        </FormContainer>
      </PageContainer>
    </ThemeProvider>
  );
};

export default Login;