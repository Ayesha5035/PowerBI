import React from "react";
import "./Card.css";

function Card({ title, description, icon }) {
  return (
    <div className="card">
      <div className="card-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      <button>Open Workspace →</button>
    </div>
  );
}

export default Card;