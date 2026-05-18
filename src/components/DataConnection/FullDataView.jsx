// src/components/DataConnection/FullDataView.jsx - Add edit button and onEdit prop
import React, { useState } from 'react';
import { FiX, FiChevronLeft, FiChevronRight, FiEdit } from 'react-icons/fi';
import './FullDataView.css';

const FullDataView = ({ data, fileName, onClose, onEdit, dataset }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;
  
  if (!data || data.length === 0) return null;
  
  const headers = Object.keys(data[0]);
  const totalRows = data.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentData = data.slice(startIndex, endIndex);
  
  const formatCellValue = (value) => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'object') return JSON.stringify(value).slice(0, 100);
    if (typeof value === 'boolean') return value ? '✓' : '✗';
    return String(value);
  };
  
  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };
  
  const handleEdit = () => {
    if (onEdit && dataset) {
      onEdit(dataset);
      onClose();
    }
  };
  
  return (
    <div className="full-data-overlay" onClick={onClose}>
      <div className="full-data-modal" onClick={(e) => e.stopPropagation()}>
        <div className="full-data-header">
          <h3>📊 {fileName}</h3>
          <div className="full-data-header-actions">
            {onEdit && (
              <button className="full-data-edit-btn" onClick={handleEdit}>
                <FiEdit size={16} /> Edit Data
              </button>
            )}
            <button className="full-data-close" onClick={onClose}>
              <FiX size={20} />
            </button>
          </div>
        </div>
        
        <div className="full-data-stats">
          <span>Total Rows: {totalRows.toLocaleString()}</span>
          <span>Total Columns: {headers.length}</span>
        </div>
        
        <div className="full-data-table-container">
          <table className="full-data-table">
            <thead>
              <tr>
                <th className="row-number-col">#</th>
                {headers.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentData.map((row, idx) => (
                <tr key={startIndex + idx}>
                  <td className="row-number">{startIndex + idx + 1}</td>
                  {headers.map((header) => (
                    <td key={header}>{formatCellValue(row[header])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="full-data-pagination">
            <button 
              onClick={() => goToPage(1)} 
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              First
            </button>
            <button 
              onClick={() => goToPage(currentPage - 1)} 
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              <FiChevronLeft /> Prev
            </button>
            <span className="pagination-info">
              Page {currentPage} of {totalPages}
            </span>
            <button 
              onClick={() => goToPage(currentPage + 1)} 
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              Next <FiChevronRight />
            </button>
            <button 
              onClick={() => goToPage(totalPages)} 
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              Last
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FullDataView;