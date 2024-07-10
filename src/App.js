// src/App.js
import React, { useContext, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { styled } from '@mui/system';
import { AuthProvider, AuthContext } from './components/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Register from './components/Register';
import Login from './components/Login';
import Home from './components/Home';
import LoginAdmin from './components/LoginAdmin';
import Dashboard from './components/Dashboard';
import Productos from './components/Productos';
import Categorias from './components/Categorias';
import Proveedores from './components/Proveedores';
import Pedidos from './components/Pedidos';
import ProductDetail from './components/ProductDetail';
import Cart from './components/Cart';
import MisCompras from './components/MisCompras';
import SuccessScreen from './components/SuccessScreen';
import SearchResults from './components/SearchResults';
import CategoriaProductos from './components/CategoriaProductos';
import Clientes from './components/Clientes';
import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#a777e3',
    },
  },
});

const PageContainer = styled('div')({
  minHeight: '100vh',
  width: '100',
  position: 'relative',
  overflow: 'hidden',
  background: 'linear-gradient(135deg, #e6f0ff, #f0e6ff, #ffe6f0)',
});

const WaveContainer = styled('div')({
  position: 'absolute',
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
});

const Wave = styled('div')(({ index }) => ({
  position: 'absolute',
  left: '-50%',
  width: '200%',
  height: '200%',
  background: `linear-gradient(135deg, #6e8efb${index * 20}, #a777e3${index * 20})`,
  opacity: 0.5 - index * 0.1,
  borderRadius: '48%',
  animation: `wave${index + 1} ${30 + index * 10}s infinite linear`,
  '@keyframes wave1': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' },
  },
  '@keyframes wave2': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(-360deg)' },
  },
  '@keyframes wave3': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' },
  },
}));

const ContentWrapper = styled('div')({
  position: 'relative',
  zIndex: 1,
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
});

function App() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (event) => {
      const { clientX, clientY } = event;
      const { left, top, width, height } = container.getBoundingClientRect();
      const x = (clientX - left) / width - 0.5;
      const y = (clientY - top) / height - 0.5;

      const waves = container.querySelectorAll('.wave');
      waves.forEach((wave, index) => {
        const factor = (index + 1) * 10;
        wave.style.transform = `translate(${x * factor}px, ${y * factor}px) rotate(${index % 2 === 0 ? '' : '-'}${Date.now() / (100 + index * 50)}deg)`;
      });
    };

    container.addEventListener('mousemove', handleMouseMove);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <PageContainer ref={containerRef}>
            <WaveContainer>
              <Wave className="wave" index={0} style={{top: '50%'}} />
              <Wave className="wave" index={1} style={{top: '48%'}} />
              <Wave className="wave" index={2} style={{top: '52%'}} />
            </WaveContainer>
            <ContentWrapper>
              <AppContent />
            </ContentWrapper>
          </PageContainer>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

const AppContent = () => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return <div>Cargando...</div>;
  }

  const hideNavbarPaths = [
    '/login',
    '/register',
    '/login-admin',
    '/admin',
    '/admin/dashboard',
    '/admin/productos',
    '/admin/categorias',
    '/admin/proveedores',
    '/admin/pedidos'
  ];

  const shouldShowNavbar = !hideNavbarPaths.some(path =>
    location.pathname.startsWith(path)
  );

  return (
    <>
      {shouldShowNavbar && <Navbar user={user} />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login-admin" element={<LoginAdmin />} />
        <Route path="/mis-compras" element={<MisCompras />} />
        <Route path="/search-results" element={<SearchResults />} />
        <Route path="/categoria/:categoriaId" element={<CategoriaProductos />} />
        <Route path="/productos/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/success" element={<SuccessScreen />} />

        <Route path="/admin" element={<Sidebar />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="productos" element={<Productos />} />
          <Route path="categorias" element={<Categorias />} />
          <Route path="proveedores" element={<Proveedores />} />
          <Route path="pedidos" element={<Pedidos />} />
          <Route path="clientes" element={<Clientes />} />
        </Route>
      </Routes>
    </>
  );
};

export default App;