import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from './config/firebaseConfig';
import { ref, get } from 'firebase/database';
import { Link } from 'react-router-dom';
import { Modal, Button } from 'react-bootstrap';
import Banner from './Banner';
import MostrarProductos from './MostrarProductos';
import './assets/Home.css';
import Whatsapp from './Whatsapp';

const Home = () => {
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showLoginMessage, setShowLoginMessage] = useState(true);
  const [productos, setProductos] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 600);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Obtener datos del usuario desde Firebase Realtime Database
        const userRef = ref(db, 'users/' + currentUser.uid);
        get(userRef)
          .then((snapshot) => {
            if (snapshot.exists()) {
              const userData = snapshot.val();
              if (userData && userData.fullName) {
                setUserName(userData.fullName);
              } else {
                setUserName('Usuario');
              }
            } else {
              setUserName('Usuario');
            }
          })
          .catch((error) => {
            console.error('Error obteniendo datos de usuario:', error);
            setUserName('Usuario');
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        setUser(null);
        setUserName('');
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!user && !showWelcome) {
      setShowLoginMessage(true);
    } else {
      setShowLoginMessage(false);
    }
  }, [user, showWelcome]);

  const handleClose = () => setShowLoginMessage(false);

  useEffect(() => {
    const obtenerProductos = async () => {
      try {
        const productosRef = ref(db, 'productos');
        const snapshot = await get(productosRef);
        if (snapshot.exists()) {
          const productosData = snapshot.val();
          const productosArray = Object.values(productosData);
          setProductos(productosArray);
        }
      } catch (error) {
        console.error('Error al obtener productos:', error);
      }
    };

    obtenerProductos();
  }, []);

  if (isLoading) {
    return <p>Cargando...</p>;
  }

  return (
<div style={{ paddingTop: 5 }}>
      <div className="welcome-container" style={{ position: 'relative', zIndex: 1500 }}>
        {showWelcome && user && (
          <div className="welcome-message">
            ¡Hola! {userName}
          </div>
        )}
      </div>
      <Banner />

      <MostrarProductos productos={productos} />

      <Modal show={showLoginMessage} onHide={handleClose}>
        <br></br><br></br>
        <Modal.Header closeButton>
          <Modal.Title>Por favor, inicia sesión</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Por favor, inicia sesión para una mejor experiencia 😉</p>
          <Link to="/login">Iniciar Sesión</Link>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      <Whatsapp />
    </div>
  );
};

export default Home;
