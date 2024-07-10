import React, { useState, useEffect } from 'react';
import { ref, onValue, push, update, remove, get } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './config/firebaseConfig';
import { 
  Tabs, Tab, Box, TextField, Button, Table, TableBody, TableCell, TableHead, TableRow, Paper, 
  IconButton, MenuItem, Select, InputLabel, FormControl, Typography, Chip, Snackbar, Alert,
  Grid, Container, useMediaQuery, TableContainer, InputAdornment
} from '@mui/material';
import { styled, useTheme } from '@mui/system';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import './assets/Productos.css';

const FormWrapper = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  maxHeight: '70vh',
  '& .MuiTableCell-root': {
    padding: theme.spacing(1),
  },
  '& .MuiTableCell-head': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    fontWeight: 'bold',
  },
  '& .MuiTableRow-root:nth-of-type(even)': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const ProductImage = styled('img')({
  width: '50px',
  height: '50px',
  objectFit: 'cover',
  marginRight: '10px',
});

const Productos = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [stock, setStock] = useState('');
  const [categoria, setCategoria] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [imagenes, setImagenes] = useState([]);
  const [tipoProducto, setTipoProducto] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [editingProductoId, setEditingProductoId] = useState(null);
  const [tallas, setTallas] = useState('');
  const [colores, setColores] = useState([{ nombre: '', imagen: null }]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [searchTerm, setSearchTerm] = useState('');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const categoriasRef = ref(db, 'categorias');
    onValue(categoriasRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setCategorias(Object.entries(data).map(([key, value]) => ({ id: key, ...value })));
      }
    });

    const proveedoresRef = ref(db, 'proveedores');
    onValue(proveedoresRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setProveedores(Object.entries(data).map(([key, value]) => ({ id: key, ...value })));
      }
    });

    const productosRef = ref(db, 'productos');
    onValue(productosRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setProductos(Object.entries(data).map(([key, value]) => ({ id: key, ...value })));
      }
    });
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    const promises = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const imageRef = storageRef(storage, `imagenes/${file.name}`);
      promises.push(uploadBytes(imageRef, file).then(() => getDownloadURL(imageRef)));
    }
    const urls = await Promise.all(promises);
    setImagenes((prevImages) => [...prevImages, ...urls]);
  };

  const handleColorImageUpload = async (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const imageRef = storageRef(storage, `colores/${file.name}`);
      await uploadBytes(imageRef, file);
      const url = await getDownloadURL(imageRef);
      setColores(prevColores => {
        const newColores = [...prevColores];
        newColores[index].imagen = url;
        return newColores;
      });
    }
  };

  const deleteOldImages = async (productoId, newImagenes) => {
    const productoRef = ref(db, `productos/${productoId}`);
    const snapshot = await get(productoRef);
    const producto = snapshot.val();
    if (producto && producto.imagenes) {
      for (let imagenUrl of producto.imagenes) {
        if (!newImagenes.includes(imagenUrl)) {
          const oldImageRef = storageRef(storage, imagenUrl);
          try {
            await deleteObject(oldImageRef);
          } catch (error) {
            console.error("Error deleting old image:", error);
          }
        }
      }
    }
  };

  const deleteOldColorImages = async (productoId, newColores) => {
    const productoRef = ref(db, `productos/${productoId}`);
    const snapshot = await get(productoRef);
    const producto = snapshot.val();
    if (producto && producto.colores) {
      for (let color of producto.colores) {
        if (color.imagen && !newColores.some(c => c.imagen === color.imagen)) {
          const oldImageRef = storageRef(storage, color.imagen);
          try {
            await deleteObject(oldImageRef);
          } catch (error) {
            console.error("Error deleting old color image:", error);
          }
        }
      }
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!nombre || !descripcion || !precio || !stock || !categoria || !proveedor || !tipoProducto) {
      setSnackbar({ open: true, message: 'Por favor completa todos los campos obligatorios', severity: 'error' });
      return;
    }

    let tallasArray = [];
    let coloresArray = [];

    if (tipoProducto === 'solo talla' || tipoProducto === 'talla y color') {
      tallasArray = tallas.split(',').map(talla => talla.trim());
    }

    if (tipoProducto === 'talla y color') {
      coloresArray = colores.filter(color => color.nombre && color.imagen);
    }

    const newProducto = {
      nombre,
      descripcion,
      precio,
      stock,
      categoria,
      proveedor,
      imagenes,
      tipoProducto,
      ...(tipoProducto === 'solo talla' || tipoProducto === 'talla y color' ? { tallas: tallasArray } : {}),
      ...(tipoProducto === 'talla y color' ? { colores: coloresArray } : {}),
    };

    const productosRef = ref(db, 'productos');
    if (editingProductoId) {
      const productoRef = ref(db, `productos/${editingProductoId}`);
      const snapshot = await get(productoRef);
      const oldProducto = snapshot.val();
      
      // Mantener las imágenes existentes si no se subieron nuevas
      if (imagenes.length === 0 && oldProducto.imagenes) {
        newProducto.imagenes = oldProducto.imagenes;
      } else {
        await deleteOldImages(editingProductoId, newProducto.imagenes);
      }

      // Mantener los colores existentes si no se modificaron
      if (tipoProducto === 'talla y color' && coloresArray.length === 0 && oldProducto.colores) {
        newProducto.colores = oldProducto.colores;
      } else if (tipoProducto === 'talla y color') {
        await deleteOldColorImages(editingProductoId, coloresArray);
      }

      await update(productoRef, newProducto);
      setEditingProductoId(null);
      setSnackbar({ open: true, message: 'Producto actualizado con éxito', severity: 'success' });
    } else {
      await push(productosRef, newProducto);
      setSnackbar({ open: true, message: 'Producto registrado con éxito', severity: 'success' });
    }

    resetForm();
  };

  const resetForm = () => {
    setNombre('');
    setDescripcion('');
    setPrecio('');
    setStock('');
    setCategoria('');
    setProveedor('');
    setImagenes([]);
    setTipoProducto('');
    setTallas('');
    setColores([{ nombre: '', imagen: null }]);
  };

  const handleEditProducto = (producto) => {
    setNombre(producto.nombre);
    setDescripcion(producto.descripcion);
    setPrecio(producto.precio);
    setStock(producto.stock);
    setCategoria(producto.categoria);
    setProveedor(producto.proveedor);
    setImagenes(producto.imagenes || []);
    setTipoProducto(producto.tipoProducto);
    setTallas(producto.tallas ? producto.tallas.join(', ') : '');
    setColores(producto.colores || [{ nombre: '', imagen: null }]);
    setEditingProductoId(producto.id);
    setActiveTab(0);
  };

  const handleDeleteProducto = async (productoId) => {
    await deleteOldImages(productoId, []);
    await deleteOldColorImages(productoId, []);
    const productoRef = ref(db, `productos/${productoId}`);
    await remove(productoRef);
    setSnackbar({ open: true, message: 'Producto eliminado con éxito', severity: 'success' });
  };

  const handleAddColor = () => {
    setColores([...colores, { nombre: '', imagen: null }]);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  const filteredProductos = productos.filter(producto =>
    producto.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ width: '100%', typography: 'body1', mt: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Registrar Producto" />
          <Tab label="Ver Productos" />
        </Tabs>
        {activeTab === 0 && (
          <FormWrapper>
            <form onSubmit={handleFormSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Nombre de producto"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Descripción"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Precio"
                    type="number"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Stock"
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Categoría</InputLabel>
                    <Select
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value)}
                    >
                      {categorias.map((cat) => (
                        <MenuItem key={cat.id} value={cat.id}>{cat.nombre}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Proveedor</InputLabel>
                    <Select
                      value={proveedor}
                      onChange={(e) => setProveedor(e.target.value)}
                    >
                      {proveedores.map((prov) => (
                        <MenuItem key={prov.id} value={prov.id}>{prov.nombre}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    component="label"
                    startIcon={<UploadFileIcon />}
                    fullWidth
                  >
                    Subir Imágenes
                    <input
                      type="file"
                      hidden
                      multiple
                      onChange={handleImageUpload}
                    />
                  </Button>
                </Grid>
                {imagenes.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle1">Imágenes cargadas:</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {imagenes.map((url, index) => (
                        <Chip 
                          key={index} 
                          label={`Imagen ${index + 1}`} 
                          onDelete={() => {
                            setImagenes(imagenes.filter((_, i) => i !== index));
                          }} 
                        />
                      ))}
                    </Box>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Tipo de Producto</InputLabel>
                    <Select
                      value={tipoProducto}
                      onChange={(e) => setTipoProducto(e.target.value)}
                      >
                      <MenuItem value="sin talla y color">Sin talla y color</MenuItem>
                      <MenuItem value="solo talla">Solo talla</MenuItem>
                      <MenuItem value="talla y color">Talla y color</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {(tipoProducto === 'solo talla' || tipoProducto === 'talla y color') && (
                  <Grid item xs={12}>
                    <TextField
                      label="Tallas (separadas por comas)"
                      value={tallas}
                      onChange={(e) => setTallas(e.target.value)}
                      fullWidth
                      required
                      helperText="Ingrese las tallas separadas por comas, por ejemplo: S, M, L, XL"
                    />
                  </Grid>
                )}
                {tipoProducto === 'talla y color' && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle1">Colores:</Typography>
                    {colores.map((color, index) => (
                      <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <TextField
                          label={`Color ${index + 1}`}
                          value={color.nombre}
                          onChange={(e) => {
                            const newColores = [...colores];
                            newColores[index].nombre = e.target.value;
                            setColores(newColores);
                          }}
                          required
                        />
                        <Button
                          variant="contained"
                          component="label"
                          startIcon={<UploadFileIcon />}
                        >
                          Subir Imagen
                          <input
                            type="file"
                            hidden
                            onChange={(e) => handleColorImageUpload(e, index)}
                          />
                        </Button>
                        {color.imagen && <Chip label="Imagen cargada" />}
                      </Box>
                    ))}
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={handleAddColor}
                    >
                      Añadir Color
                    </Button>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Button type="submit" variant="contained" color="primary" fullWidth>
                    {editingProductoId ? 'Actualizar' : 'Registrar'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </FormWrapper>
        )}
        {activeTab === 1 && (
          <>
            <Box sx={{ mb: 2, mt: 2 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Buscar producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            <StyledTableContainer component={Paper}>
              <Table stickyHeader aria-label="tabla de productos">
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Precio</TableCell>
                    <TableCell>Stock</TableCell>
                    <TableCell>Categoría</TableCell>
                    <TableCell>Proveedor</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Tallas</TableCell>
                    <TableCell>Colores</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProductos.map((producto) => (
                    <TableRow key={producto.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {producto.imagenes && producto.imagenes.length > 0 && (
                            <ProductImage src={producto.imagenes[0]} alt={producto.nombre} />
                          )}
                          {producto.nombre}
                        </Box>
                      </TableCell>
                      <TableCell>{producto.descripcion}</TableCell>
                      <TableCell>{producto.precio}</TableCell>
                      <TableCell>{producto.stock}</TableCell>
                      <TableCell>{categorias.find((cat) => cat.id === producto.categoria)?.nombre}</TableCell>
                      <TableCell>{proveedores.find((prov) => prov.id === producto.proveedor)?.nombre}</TableCell>
                      <TableCell>{producto.tipoProducto}</TableCell>
                      <TableCell>{producto.tallas?.join(', ')}</TableCell>
                      <TableCell>{producto.colores?.map(c => c.nombre).join(', ')}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleEditProducto(producto)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDeleteProducto(producto.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </StyledTableContainer>
          </>
        )}
        <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default Productos;