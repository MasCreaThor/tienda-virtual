import React, { useState, useEffect } from 'react';
import { ref, onValue, push, update, remove, get } from 'firebase/database';
import { uploadBytes, getDownloadURL, ref as storageRef, deleteObject } from 'firebase/storage';
import { db, storage } from './config/firebaseConfig';
import { 
  Tabs, Tab, Box, TextField, Button, Table, TableBody, TableCell, TableHead, TableRow, 
  Paper, IconButton, Snackbar, Alert, TableContainer, InputAdornment, Container
} from '@mui/material';
import { styled } from '@mui/system';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import './assets/Categorias.css';

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

const CategoryImage = styled('img')({
  width: '100px',
  height: '100px',
  objectFit: 'cover',
});

const Categorias = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [imagen, setImagen] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [searchTerm, setSearchTerm] = useState('');
  useEffect(() => {
    const categoriasRef = ref(db, 'categorias');
    onValue(categoriasRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setCategorias(Object.entries(data).map(([key, value]) => ({ id: key, ...value })));
      }
    });
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleImageUpload = async (file) => {
    const storageRefInstance = storageRef(storage, `categorias/${file.name}`);
    await uploadBytes(storageRefInstance, file);
    const imageUrl = await getDownloadURL(storageRefInstance);
    return imageUrl;
  };

  const deleteOldImage = async (categoryId) => {
    const categoryRef = ref(db, `categorias/${categoryId}`);
    const snapshot = await get(categoryRef);
    const category = snapshot.val();
    if (category && category.imagen) {
      const oldImageRef = storageRef(storage, category.imagen);
      try {
        await deleteObject(oldImageRef);
      } catch (error) {
        console.error("Error deleting old image:", error);
      }
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!nombre || !descripcion || (editingCategoryId === null && !imagen)) {
      setSnackbar({ open: true, message: 'Por favor completa todos los campos', severity: 'error' });
      return;
    }

    let imageUrl = '';
    if (imagen) {
      if (editingCategoryId) {
        await deleteOldImage(editingCategoryId);
      }
      imageUrl = await handleImageUpload(imagen);
    }

    const newCategory = {
      nombre,
      descripcion,
      ...(imagen && { imagen: imageUrl }),
    };

    const categoriasRef = ref(db, 'categorias');
    if (editingCategoryId) {
      const categoryRef = ref(db, `categorias/${editingCategoryId}`);
      await update(categoryRef, newCategory);
      setEditingCategoryId(null);
      setSnackbar({ open: true, message: 'Categoría actualizada con éxito', severity: 'success' });
    } else {
      await push(categoriasRef, newCategory);
      setSnackbar({ open: true, message: 'Categoría registrada con éxito', severity: 'success' });
    }

    setNombre('');
    setDescripcion('');
    setImagen(null);
  };

  const handleEditCategory = (category) => {
    setNombre(category.nombre);
    setDescripcion(category.descripcion);
    setImagen(null);
    setEditingCategoryId(category.id);
    setActiveTab(0);
  };

  const handleDeleteCategory = async (categoryId) => {
    await deleteOldImage(categoryId);
    const categoryRef = ref(db, `categorias/${categoryId}`);
    await remove(categoryRef);
    setSnackbar({ open: true, message: 'Categoría eliminada con éxito', severity: 'success' });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };
  const filteredCategorias = categorias.filter(categoria =>
    categoria.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return (
    <Container maxWidth="lg">
      <Box sx={{ width: '100%', typography: 'body1', mt: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Registrar Categoría" />
          <Tab label="Ver Categorías" />
        </Tabs>
        {activeTab === 0 && (
          <FormWrapper>
          <form onSubmit={handleFormSubmit}>
            <TextField
              label="Nombre de categoría"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Descripción de categoría"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              fullWidth
              multiline
              rows={4}
              margin="normal"
            />
            <Button
              variant="contained"
              component="label"
              sx={{ marginBottom: 2 }}
            >
              Subir Imagen
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => setImagen(e.target.files[0])}
              />
            </Button>
            <Button type="submit" variant="contained" color="primary" fullWidth>
              {editingCategoryId ? 'Actualizar' : 'Registrar'}
            </Button>
          </form>
          </FormWrapper>
        )}
        {activeTab === 1 && (
          <>
            <Box sx={{ mb: 2, mt: 2 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Buscar categoría..."
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
              <Table stickyHeader aria-label="tabla de categorías">
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Imagen</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCategorias.map((categoria) => (
                    <TableRow key={categoria.id}>
                      <TableCell>{categoria.nombre}</TableCell>
                      <TableCell>{categoria.descripcion}</TableCell>
                      <TableCell>
                        <CategoryImage src={categoria.imagen} alt={categoria.nombre} />
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleEditCategory(categoria)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDeleteCategory(categoria.id)}>
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

export default Categorias;