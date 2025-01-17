// src/components/Navbar.js
import React, { useState, useEffect, useContext } from 'react';
import { AppBar, Toolbar, Typography, IconButton, InputBase, Box, Button, Avatar, Menu, MenuItem, BottomNavigation, BottomNavigationAction, useMediaQuery, useTheme, Drawer, List, ListItem, ListItemText } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import HomeIcon from '@mui/icons-material/Home';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getDatabase, ref, get } from 'firebase/database';
import { signOut } from 'firebase/auth';
import { auth } from './config/firebaseConfig';
import { AuthContext } from './AuthContext';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(90,116,201,0.8), rgba(140,99,192,0.8))',
  backdropFilter: 'blur(10px)',
  boxShadow: 'none',
  borderBottom: '1px solid rgba(255,255,255,0.1)',
}));

const SearchForm = styled('form')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: theme.spacing(3),
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
  [theme.breakpoints.up('md')]: {
    width: '50%',
  },
  display: 'flex',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 2),
    transition: theme.transitions.create('width'),
    width: '100%',
  },
}));

const SearchButton = styled(IconButton)(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  right: 0,
  top: 0,
  color: 'inherit',
}));

const StyledMenu = styled(Menu)(({ theme }) => ({
  '& .MuiPaper-root': {
    background: 'linear-gradient(135deg, rgba(90,116,201,0.9), rgba(140,99,192,0.9))',
    backdropFilter: 'blur(10px)',
    borderRadius: theme.shape.borderRadius,
    marginTop: theme.spacing(1),
    minWidth: 180,
    boxShadow: 'rgb(255, 255, 255, 0.2) 0px 0px 15px, rgb(255, 255, 255, 0.15) 0px 0px 3px 1px',
  },
}));

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  color: theme.palette.common.white,
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
}));

const Navbar = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [productos, setProductos] = useState({});
  const [categorias, setCategorias] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useContext(AuthContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchData = async () => {
      const db = getDatabase();
      const productosRef = ref(db, 'productos');
      const categoriasRef = ref(db, 'categorias');

      try {
        const [productosSnapshot, categoriasSnapshot] = await Promise.all([
          get(productosRef),
          get(categoriasRef)
        ]);

        setProductos(productosSnapshot.val() || {});
        setCategorias(categoriasSnapshot.val() || {});
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    const searchTermLower = searchTerm.toLowerCase();

    let resultados = [];

    // Búsqueda por nombre de producto
    Object.entries(productos).forEach(([id, producto]) => {
      if (producto.nombre.toLowerCase().includes(searchTermLower)) {
        resultados.push({ id, ...producto, tipo: 'producto' });
      }
    });

    // Búsqueda por categoría
    Object.entries(categorias).forEach(([id, categoria]) => {
      if (categoria.nombre.toLowerCase().includes(searchTermLower)) {
        // Añadir todos los productos de esta categoría
        Object.entries(productos).forEach(([prodId, producto]) => {
          if (producto.categoria === id) {
            resultados.push({ id: prodId, ...producto, tipo: 'producto', categoriaNombre: categoria.nombre });
          }
        });
      }
    });

    // Eliminar duplicados
    resultados = Array.from(new Set(resultados.map(JSON.stringify))).map(JSON.parse);

    console.log('Resultados encontrados:', resultados);

    // Navegar a la página de resultados
    navigate('/search-results', { state: { resultados } });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleMenuOpen = (event) => {
    if (isMobile) {
      setMobileMenuOpen(true);
    } else {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMobileMenuOpen(false);
  };

  const handleSignOut = () => {
    signOut(auth).then(() => {
      setUser(null);
      navigate('/');
    }).catch((error) => {
      console.error('Error al cerrar sesión:', error);
    });
    handleMenuClose();
  };

  const mobileMenuItems = [
    { text: 'Editar perfil', onClick: () => { navigate('/edit-profile'); handleMenuClose(); } },
    { text: 'Cerrar sesión', onClick: handleSignOut },
  ];

  return (
    <>
      <StyledAppBar position="fixed" sx={{ top: 0, bottom: 'auto' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div" sx={{ flexShrink: 0 }}>
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>Royal Shop</Link>
          </Typography>
          <SearchForm onSubmit={handleSearch}>
            <StyledInputBase
              placeholder="Buscar"
              inputProps={{ 'aria-label': 'search' }}
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <SearchButton type="submit" aria-label="search">
              <SearchIcon />
            </SearchButton>
          </SearchForm>
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button color="inherit" component={Link} to="/" sx={{ color: 'white' }}>Inicio</Button>
              {user && (
                <>
                  <Button color="inherit" component={Link} to="/mis-compras" sx={{ color: 'white' }}>Mis Compras</Button>
                  <IconButton color="inherit" component={Link} to="/cart" sx={{ color: 'white' }}>
                    <ShoppingCartIcon />
                  </IconButton>
                  <IconButton
                    size="large"
                    edge="end"
                    aria-label="account of current user"
                    aria-controls="menu-appbar"
                    aria-haspopup="true"
                    onClick={handleMenuOpen}
                    color="inherit"
                  >
                    <Avatar 
                      alt={user.displayName || 'Usuario'} 
                      src={user.photoURL || '/default-avatar.jpg'} 
                    />
                  </IconButton>
                  <StyledMenu
                    id="menu-appbar"
                    anchorEl={anchorEl}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    keepMounted
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                  >
                    <StyledMenuItem onClick={() => { navigate('/edit-profile'); handleMenuClose(); }}>
                      Editar perfil
                    </StyledMenuItem>
                    <StyledMenuItem onClick={handleSignOut}>
                      Cerrar sesión
                    </StyledMenuItem>
                  </StyledMenu>
                </>
              )}
              {!user && (
                <>
                  <Button color="inherit" component={Link} to="/login" sx={{ color: 'white' }}>Ingresar</Button>
                  <Button color="inherit" component={Link} to="/register" sx={{ color: 'white' }}>Registrarse</Button>
                </>
              )}
            </Box>
          )}
        </Toolbar>
      </StyledAppBar>
      {!isMobile && <Toolbar />}
      {isMobile && (
        <>
          <BottomNavigation
            value={location.pathname}
            onChange={(event, newValue) => {
              navigate(newValue);
            }}
            showLabels
            sx={{
              width: '100%',
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
              height: '56px',
              background: 'linear-gradient(135deg, rgba(90,116,201,0.8), rgba(140,99,192,0.8))',
              backdropFilter: 'blur(10px)',
            }}
          >
            <BottomNavigationAction label="Inicio" value="/" icon={<HomeIcon />} sx={{ color: 'white' }} />
            {user ? (
              <>
                <BottomNavigationAction label="Mis Compras" component={Link} to="/mis-compras" icon={<ReceiptIcon />} sx={{ color: 'white' }} />
                <BottomNavigationAction label="Carrito" component={Link} to="/cart" icon={<ShoppingCartIcon />} sx={{ color: 'white' }} />
                <BottomNavigationAction
                  label="Perfil"
                  icon={<Avatar alt={user.displayName || 'Usuario'} src={user.photoURL || '/default-avatar.jpg'} sx={{ width: 24, height: 24 }} />}
                  onClick={handleMenuOpen}
                />
              </>
            ) : (
              <>
                <BottomNavigationAction label="Ingresar" component={Link} to="/login" icon={<LoginIcon />} sx={{ color: 'white' }} />
                <BottomNavigationAction label="Registrarse" component={Link} to="/register" icon={<PersonAddIcon />} sx={{ color: 'white' }} />
              </>
            )}
          </BottomNavigation>
          <Box sx={{ height: '56px' }} />
          <Drawer
            anchor="bottom"
            open={mobileMenuOpen}
            onClose={handleMenuClose}
          >
            <List>
              {mobileMenuItems.map((item, index) => (
                <ListItem button key={index} onClick={item.onClick}>
                  <ListItemText primary={item.text} />
                </ListItem>
              ))}
            </List>
          </Drawer>
        </>
      )}
    </>
  );
};

export default Navbar;