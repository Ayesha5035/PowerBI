// src/components/DataConnection/DataPreview.jsx
import React, { useState } from 'react';
import { FiEdit } from 'react-icons/fi';
import './DataPreview.css';

const DataPreview = ({ data, fileName, onSave, onDiscard, onEdit }) => {
  const [isSaving, setIsSaving] = useState(false);
  
  // Get column headers from first row
  const headers = data && data.length > 0 ? Object.keys(data[0]) : [];
  
  // Show only first 15 rows as preview
  const previewRows = data ? data.slice(0, 15) : [];
  const totalRows = data ? data.length : 0;
  const hasMoreRows = totalRows > 15;
  
  // Format cell value for display
  const formatCellValue = (value) => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'boolean') return value ? '✓' : '✗';
    return String(value);
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    if (onSave) {
      await onSave(data, fileName);
    }
    setIsSaving(false);
  };
  
  const handleDiscard = () => {
    if (onDiscard) {
      onDiscard();
    }
  };
  
  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    }
  };
  
  return (
    <div className="data-preview-container">
      {/* Header */}
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
          <button className="preview-action-btn save-btn" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save to Database'}
          </button>
        </div>
      </div>
      
      {/* File Info */}
      <div className="file-info-bar">
        <div className="file-info-details">
          <span className="file-badge">📄 {fileName}</span>
          <span className="file-badge">📊 {totalRows.toLocaleString()} records</span>
          <span className="file-badge">📋 {headers.length} columns</span>
        </div>
      </div>
      
      {/* Data Table - CORRECTED SYNTAX */}
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
        
        {/* Show message if more rows exist */}
        {hasMoreRows && (
          <div className="empty-state" style={{ padding: '16px', borderTop: '1px solid #e2e8f0' }}>
            <div className="empty-state-desc">
              Showing first 15 of {totalRows.toLocaleString()} rows
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataPreview;