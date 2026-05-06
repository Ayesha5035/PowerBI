// src/components/Card/Card.jsx
import React from "react";
import "./Card.css";

function Card({ title, description, icon, buttonText, onButtonClick, onClick }) {
  return (
    <div className="card" onClick={onClick}>
      <div className="card-icon">{icon}</div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      <button onClick={(e) => {
        e.stopPropagation(); // Prevents card click when button is clicked
        if (onButtonClick) onButtonClick();
      }}>
        {buttonText || "Open →"}
      </button>
    </div>
  );
}

export default Card;