// src/components/DataConnection/DataPreview.jsx
import React, { useState } from 'react';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import ConfirmationModal from '../Common/ConfirmationModal';
import './DataPreview.css';

const DataPreview = ({ data, fileName, onDelete, onDiscard, onEdit }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const headers = data && data.length > 0 ? Object.keys(data[0]) : [];
  const previewRows = data ? data.slice(0, 5) : [];
  const totalRows = data ? data.length : 0;
  const hasMoreRows = totalRows > 5;
  
  const formatCellValue = (value) => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'boolean') return value ? '✓' : '✗';
    return String(value);
  };
  
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };
  
  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false);
    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete();
        toast.success(`"${fileName}" deleted successfully!`);
      }
    } catch (error) {
      toast.error('Failed to delete data');
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleDiscard = () => {
    if (onDiscard) {
      onDiscard();
      toast.info('Data discarded from view');
    }
  };
  
  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    }
  };
  
  return (
    <>
      <div className="data-preview-container">
        <div className="preview-header">
          <div className="preview-title">
            📊 Data Preview
            <span className="preview-badge">{totalRows} rows</span>
          </div>
          <div className="preview-actions">
            <button className="preview-action-btn edit-btn" onClick={handleEdit}>
              <FiEdit size={14} /> Edit Data
            </button>
            <button className="preview-action-btn discard-btn" onClick={handleDiscard}>
              Discard
            </button>
            <button 
              className="preview-action-btn delete-btn" 
              onClick={handleDeleteClick}
              disabled={isDeleting}
            >
              <FiTrash2 size={14} /> {isDeleting ? 'Deleting...' : 'Delete Permanently'}
            </button>
          </div>
        </div>
        
        <div className="file-info-bar">
          <div className="file-info-details">
            <span className="file-badge">📄 {fileName}</span>
            <span className="file-badge">📊 {totalRows.toLocaleString()} records</span>
            <span className="file-badge">📋 {headers.length} columns</span>
          </div>
        </div>
        
        <div className="table-container">
          <table className="data-preview-table">
            <thead>
              <tr>
                {headers.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, idx) => (
                <tr key={idx}>
                  {headers.map((header) => (
                    <td key={header}>{formatCellValue(row[header])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          
          {hasMoreRows && (
            <div className="empty-state" style={{ padding: '16px', borderTop: '1px solid #e2e8f0' }}>
              <div className="empty-state-desc">
                Showing first 5 of {totalRows.toLocaleString()} rows
              </div>
            </div>
          )}
        </div>
      </div>
      
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Data Permanently"
        message={`Are you sure you want to delete "${fileName}"?\n\nThis will permanently remove ${totalRows} row${totalRows !== 1 ? 's' : ''} from the database.\n\nThis action cannot be undone!`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </>
  );
};

export default DataPreview;