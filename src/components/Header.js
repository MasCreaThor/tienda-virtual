// src/components/Header.js
import React from 'react';

const Header = () => {
  return (
    <header className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pb-2 mb-3 border-bottom">
      <h1 className="h2">Dashboard</h1>
      <div className="btn-toolbar mb-2 mb-md-0">
        <div className="btn-group me-2">
          <button type="button" className="btn btn-sm btn-outline-secondary">Compartir</button>
          <button type="button" className="btn btn-sm btn-outline-secondary">Exportar</button>
        </div>
        <button type="button" className="btn btn-sm btn-outline-secondary dropdown-toggle">
          <span data-feather="calendar"></span>
          Esta semana
        </button>
      </div>
    </header>
  );
};

export default Header;
