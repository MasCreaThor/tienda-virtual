// src/components/Card.js
import React from 'react';

const Card = ({ title, value, percentage }) => {
  return (
    <div className="col-md-3">
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <h5 className="card-title">{title}</h5>
          <p className="card-text">{value}</p>
          <p className="card-text"><small className="text-muted">{percentage}</small></p>
        </div>
      </div>
    </div>
  );
};

export default Card;
