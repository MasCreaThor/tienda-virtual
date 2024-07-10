// src/components/Sidebar.js
import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  useTheme,
  useMediaQuery,
  AppBar,
  Toolbar,
  Box,
  CssBaseline,
  Divider
} from '@mui/material';
import { styled } from '@mui/system';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  ShoppingCart as ShoppingCartIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  LocalShipping as LocalShippingIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';

const drawerWidth = 240;
const closedDrawerWidth = 48;

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

const Sidebar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [open, setOpen] = useState(!isMobile);
  const location = useLocation();
  const [currentTitle, setCurrentTitle] = useState('');

  const toggleDrawer = () => {
    setOpen(!open);
  };

  useEffect(() => {
    const routeNameMap = {
      '/admin/dashboard': 'Dashboard',
      '/admin/pedidos': 'Pedidos',
      '/admin/clientes': 'Clientes',
      '/admin/productos': 'Productos',
      '/admin/categorias': 'Categorías',
      '/admin/proveedores': 'Proveedores',
      '/admin/configuracion': 'Configuración',
    };

    setCurrentTitle(routeNameMap[location.pathname] || '');
  }, [location.pathname]);

  useEffect(() => {
    setOpen(!isMobile);
  }, [isMobile]);

  const menuItems = [
    { text: 'Dashboard', icon: <HomeIcon />, path: '/admin/dashboard' },
    { text: 'Pedidos', icon: <ShoppingCartIcon />, path: '/admin/pedidos' },
    { text: 'Clientes', icon: <PeopleIcon />, path: '/admin/clientes' },
    { text: 'Productos', icon: <InventoryIcon />, path: '/admin/productos' },
    { text: 'Categorías', icon: <CategoryIcon />, path: '/admin/categorias' },
    { text: 'Proveedores', icon: <LocalShippingIcon />, path: '/admin/proveedores' },
    { text: 'Configuración', icon: <SettingsIcon />, path: '/admin/configuracion' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${isMobile ? 0 : (open ? drawerWidth : closedDrawerWidth)}px)` },
          ml: { sm: isMobile ? 0 : (open ? drawerWidth : closedDrawerWidth) },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={toggleDrawer}
            edge="start"
            sx={{ mr: 2, ...(open && !isMobile && { display: 'none' }) }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            {currentTitle}
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? open : true}
        onClose={isMobile ? toggleDrawer : undefined}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          width: isMobile ? drawerWidth : (open ? drawerWidth : closedDrawerWidth),
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: isMobile ? drawerWidth : (open ? drawerWidth : closedDrawerWidth),
            boxSizing: 'border-box',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
            borderRight: open ? undefined : 'none',
          },
        }}
      >
        <DrawerHeader>
          <IconButton onClick={toggleDrawer}>
            {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
              onClick={isMobile ? toggleDrawer : undefined}
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: open ? 2.5 : 1,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                sx={{ 
                  opacity: open ? 1 : 0,
                  display: open ? 'block' : 'none'
                }} 
              />
            </ListItem>
          ))}
        </List>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { 
            xs: '100%',
            sm: `calc(100% - ${isMobile ? 0 : (open ? drawerWidth : closedDrawerWidth)}px)` 
          },
          marginLeft: { 
            xs: 0,
            sm: isMobile ? 0 : (open ? `${drawerWidth}px` : `${closedDrawerWidth}px`) 
          },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <DrawerHeader />
        <Outlet />
      </Box>
    </Box>
  );
};

export default Sidebar;