// src/components/DataConnection/DatasetCard.jsx
import React from 'react';
import { FiDatabase, FiTrash2, FiEye, FiEdit } from 'react-icons/fi';
import './DatasetCard.css';

const DatasetCard = ({ dataset, onView, onEdit, onDelete, isSelected }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className={`dataset-card ${isSelected ? 'selected' : ''}`}>
      <div className="dataset-card-icon">
        <FiDatabase size={24} />
      </div>
      <div className="dataset-card-info">
        <div className="dataset-card-name">{dataset.file_name}</div>
        <div className="dataset-card-meta">
          <span className="dataset-card-rows">{dataset.row_count.toLocaleString()} rows</span>
          <span className="dataset-card-source">{dataset.source || 'SQL Server'}</span>
          <span className="dataset-card-date">{formatDate(dataset.imported_at)}</span>
        </div>
      </div>
      <div className="dataset-card-actions">
        <button className="dataset-btn view-btn" onClick={() => onView(dataset)}>
          <FiEye size={16} /> View
        </button>
        <button className="dataset-btn edit-btn" onClick={() => onEdit(dataset)}>
          <FiEdit size={16} /> Edit
        </button>
        <button className="dataset-btn delete-btn" onClick={() => onDelete(dataset)}>
          <FiTrash2 size={16} /> Delete
        </button>
      </div>
    </div>
  );
};

export default DatasetCard;