import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDatabase, ref, get, child } from 'firebase/database';
import { db } from './config/firebaseConfig'; // Importa la instancia de la base de datos desde firebaseConfig
import 'bootstrap/dist/css/bootstrap.min.css'; // Importa los estilos de Bootstrap

const LoginAdmin = () => {
  const [correo, setCorreo] = useState('');
  const [contraseña, setContraseña] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    const dbRef = ref(db); // Referencia a la raíz de la base de datos
    try {
      const snapshot = await get(child(dbRef, 'administradores/Yadir')); // Obtener los datos del administrador
      if (snapshot.exists()) {
        const adminData = snapshot.val();
        // Validar las credenciales del administrador
        if (correo === adminData.correo && contraseña === adminData.contraseña) {
          // Si las credenciales son correctas, establecer indicador de autenticación en localStorage
          localStorage.setItem('user_authenticated', 'true');
          // Redirigir al componente Dashboard
          navigate('/admin/dashboard');
        } else {
          alert('Credenciales incorrectas. Por favor, inténtalo de nuevo.');
        }
      } else {
        alert('No se encontró el administrador en la base de datos.');
      }
    } catch (error) {
      console.error('Error al obtener el documento:', error);
      alert('Ocurrió un error al iniciar sesión. Por favor, inténtalo de nuevo más tarde.');
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-lg p-5">
            <h2 className="text-center mb-4">Iniciar sesión como administrador</h2>
            <form onSubmit={handleLogin}>
              <div className="mb-3">
                <label htmlFor="correo" className="form-label text-start">Correo electrónico:</label>
                <input
                  type="email"
                  className="form-control"
                  id="correo"
                  placeholder="Ingrese su correo electrónico"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="contraseña" className="form-label text-start">Contraseña:</label>
                <input
                  type="password"
                  className="form-control"
                  id="contraseña"
                  placeholder="Ingrese su contraseña"
                  value={contraseña}
                  onChange={(e) => setContraseña(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-lg w-100">Iniciar sesión</button>
            </form>
            <div className="text-center mt-3">
              <small><a href="/">¿Olvidaste tu contraseña?</a></small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginAdmin;
