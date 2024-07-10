// Whatsapp.js
import React from 'react';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import './assets/Whatsapp.css';

const Whatsapp = () => {
  const handleClick = () => {
    window.open('https://wa.me/573184750620', '_blank'); // Reemplaza el número con el tuyo
  };

  return (
    <div className="whatsapp-button" onClick={handleClick}>
      <WhatsAppIcon style={{ color: 'white' }} />
    </div>
  );
};

export default Whatsapp;
