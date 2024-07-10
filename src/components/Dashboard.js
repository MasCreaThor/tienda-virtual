import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Card from './Card';

const Dashboard = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Aquí puedes verificar si el usuario está autenticado
    const userAuthenticated = localStorage.getItem('user_authenticated');
    if (userAuthenticated) {
      setIsAuthenticated(true);
    } else {
      // Si el usuario no está autenticado, redirige al componente de inicio de sesión
      navigate('/login-admin');
    }
  }, [navigate]);

  return (
    isAuthenticated && (
      <div>
        <Header />
        <div className="row">
          <Card title="Ventas" value="$1,000" percentage="70%" />
          <Card title="Pedidos" value="3000" percentage="49%" />
          <Card title="Ganancia" value="$678" percentage="38%" />
          <Card title="Visitas" value="2345" percentage="55%" />
        </div>
      </div>
    )
  );
};

export default Dashboard;
