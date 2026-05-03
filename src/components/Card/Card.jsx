// src/components/Card/Card.jsx
import React from "react";
import "./Card.css";

function Card({ title, description, icon, buttonText, onButtonClick }) {
  return (
    <div className="card">
      <div className="card-icon">{icon}</div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      <button onClick={onButtonClick}>
        {buttonText || "Open →"}
      </button>
    </div>
  );
}

export default Card;