// src/components/Common/ConfirmationModal.jsx
import React from 'react';
import { FiAlertTriangle, FiX } from 'react-icons/fi';
import './ConfirmationModal.css';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', cancelText = 'Cancel', type = 'danger' }) => {
  if (!isOpen) return null;

  return (
    <div className="confirmation-modal-overlay" onClick={onClose}>
      <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
        <button className="confirmation-modal-close" onClick={onClose}>
          <FiX />
        </button>
        
        <div className={`confirmation-modal-icon ${type}`}>
          <FiAlertTriangle />
        </div>
        
        <h3 className="confirmation-modal-title">{title}</h3>
        <p className="confirmation-modal-message">{message}</p>
        
        <div className="confirmation-modal-actions">
          <button className="confirmation-btn cancel" onClick={onClose}>
            {cancelText}
          </button>
          <button className={`confirmation-btn confirm ${type}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;