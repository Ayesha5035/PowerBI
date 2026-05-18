// src/components/DataConnection/ManualEntry.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiClipboard, 
  FiPlus, 
  FiTrash2, 
  FiRotateCcw,
  FiRotateCw,
  FiEdit, 
  FiSave, 
  FiX,
  FiCopy,
  FiDatabase
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import './ManualEntry.css';

const ManualEntry = ({ onSave, onClose, initialData = null, initialFileName = null, isEditing = false }) => {
  // State for columns and rows
  const [columns, setColumns] = useState(initialData && initialData.length > 0 ? Object.keys(initialData[0]) : ['Column1', 'Column2', 'Column3']);
  const [newColumnName, setNewColumnName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Paste state
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [pasteData, setPasteData] = useState('');
  
  // Convert initialData to rows format if editing
  const getInitialRows = () => {
    if (initialData && initialData.length > 0) {
      return initialData.map((row, idx) => ({
        id: Date.now() + idx,
        data: columns.map(col => row[col] !== undefined && row[col] !== null ? String(row[col]) : '')
      }));
    }
    return [{ id: Date.now(), data: Array(columns.length).fill('') }];
  };
  
  const [rows, setRows] = useState(getInitialRows());
  const [fileName, setFileName] = useState(initialFileName || `manual_data_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`);
  const [isEditMode, setIsEditMode] = useState(!!initialData && !!initialFileName);
  
  // History for undo/redo
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Save state to history
  const saveToHistory = useCallback((newColumns, newRows) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({
      columns: [...newColumns],
      rows: JSON.parse(JSON.stringify(newRows))
    });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);
  
  // Undo function
  const undo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setColumns(prevState.columns);
      setRows(prevState.rows);
      setHistoryIndex(historyIndex - 1);
      toast.info('Undo successful');
    } else {
      toast.error('Nothing to undo');
    }
  };
  
  // Redo function
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setColumns(nextState.columns);
      setRows(nextState.rows);
      setHistoryIndex(historyIndex + 1);
      toast.info('Redo successful');
    } else {
      toast.error('Nothing to redo');
    }
  };
  
  // Keyboard shortcuts (Ctrl+Z, Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
      } else if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);
  
  // Save initial state to history
  useEffect(() => {
    if (history.length === 0) {
      saveToHistory(columns, rows);
    }
  }, []);
  
  // Add new column
  const addColumn = () => {
    if (newColumnName.trim()) {
      if (columns.includes(newColumnName.trim())) {
        toast.error('Column name already exists');
        return;
      }
      const newColumns = [...columns, newColumnName.trim()];
      const newRows = rows.map(row => ({
        ...row,
        data: [...row.data, '']
      }));
      setColumns(newColumns);
      setRows(newRows);
      saveToHistory(newColumns, newRows);
      setNewColumnName('');
      toast.success(`Column "${newColumnName}" added`);
    } else {
      toast.error('Please enter a column name');
    }
  };
  
  // Remove column
  const removeColumn = (index) => {
    const columnName = columns[index];
    const newColumns = columns.filter((_, i) => i !== index);
    const newRows = rows.map(row => ({
      ...row,
      data: row.data.filter((_, i) => i !== index)
    }));
    setColumns(newColumns);
    setRows(newRows);
    saveToHistory(newColumns, newRows);
    toast.success(`Column "${columnName}" removed`);
  };
  
  // Add new row
  const addRow = () => {
    const newRows = [...rows, { id: Date.now(), data: Array(columns.length).fill('') }];
    setRows(newRows);
    saveToHistory(columns, newRows);
    toast.success('Row added');
  };
  
  // Remove row
  const removeRow = (id) => {
    if (rows.length > 1) {
      const newRows = rows.filter(row => row.id !== id);
      setRows(newRows);
      saveToHistory(columns, newRows);
      toast.success('Row deleted');
    } else {
      toast.error('Cannot delete the last row');
    }
  };
  
  // Update cell value
  const updateCell = (rowId, colIndex, value) => {
    const newRows = rows.map(row => 
      row.id === rowId 
        ? { ...row, data: row.data.map((v, i) => i === colIndex ? value : v) }
        : row
    );
    setRows(newRows);
    saveToHistory(columns, newRows);
  };
  
  // ========== PASTE FUNCTIONALITY ==========
  
  // Handle paste from clipboard directly
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        toast.error('No data found in clipboard. Please copy data from Excel or Google Sheets first.');
        return;
      }
      
      const parsedRows = text.split('\n').filter(row => row.trim());
      if (parsedRows.length === 0) {
        toast.error('No valid data found');
        return;
      }
      
      // Parse data (tab or comma separated)
      const parsedData = parsedRows.map(row => {
        if (row.includes('\t')) {
          return row.split('\t').map(cell => cell.trim());
        } else {
          return row.split(',').map(cell => cell.trim());
        }
      });
      
      const newColumns = parsedData[0];
      const dataRows = parsedData.slice(1);
      
      const newRows = dataRows.map((row, idx) => {
        const rowData = newColumns.map((_, colIdx) => row[colIdx] || '');
        return {
          id: Date.now() + idx,
          data: rowData
        };
      });
      
      if (newRows.length === 0) {
        newRows.push({ id: Date.now(), data: Array(newColumns.length).fill('') });
      }
      
      setColumns(newColumns);
      setRows(newRows);
      saveToHistory(newColumns, newRows);
      setShowPasteArea(false);
      setPasteData('');
      
      toast.success(`Successfully pasted ${newRows.length} rows with ${newColumns.length} columns!`);
    } catch (err) {
      console.error('Paste error:', err);
      toast.error('Unable to read clipboard. Please use the text area to paste manually.');
    }
  };
  
  // Handle manual paste in text area
  const handleManualPaste = () => {
    if (!pasteData.trim()) {
      toast.error('Please paste your data in the text area');
      return;
    }
    
    const parsedRows = pasteData.split('\n').filter(row => row.trim());
    if (parsedRows.length === 0) {
      toast.error('No valid data found');
      return;
    }
    
    const parsedData = parsedRows.map(row => {
      if (row.includes('\t')) {
        return row.split('\t').map(cell => cell.trim());
      } else {
        return row.split(',').map(cell => cell.trim());
      }
    });
    
    const newColumns = parsedData[0];
    const dataRows = parsedData.slice(1);
    
    const newRows = dataRows.map((row, idx) => {
      const rowData = newColumns.map((_, colIdx) => row[colIdx] || '');
      return {
        id: Date.now() + idx,
        data: rowData
      };
    });
    
    if (newRows.length === 0) {
      newRows.push({ id: Date.now(), data: Array(newColumns.length).fill('') });
    }
    
    setColumns(newColumns);
    setRows(newRows);
    saveToHistory(newColumns, newRows);
    setShowPasteArea(false);
    setPasteData('');
    
    toast.success(`Successfully pasted ${newRows.length} rows with ${newColumns.length} columns!`);
  };
  
  // Convert to JSON and save to database
  const handleSave = async () => {
    // Filter out empty rows
    const filteredData = rows.filter(row => 
      row.data.some(cell => cell !== null && cell !== undefined && cell !== '')
    );
    
    if (filteredData.length === 0) {
      toast.error('No data to save');
      return;
    }
    
    const data = filteredData.map(row => {
      const obj = {};
      columns.forEach((col, idx) => {
        obj[col] = row.data[idx] || '';
      });
      return obj;
    });
    
    setIsSaving(true);
    try {
      // Call parent onSave which should save to database
      await onSave(data, fileName);
      toast.success(`Successfully saved ${data.length} rows!`);
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save data: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Clear all data
  const clearAll = () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      const newRows = [{ id: Date.now(), data: Array(columns.length).fill('') }];
      setRows(newRows);
      saveToHistory(columns, newRows);
      toast.info('All data cleared');
    }
  };

  return (
    <div className="manual-modal-overlay" onClick={onClose}>
      <div className="manual-modal" onClick={(e) => e.stopPropagation()}>
        <div className="manual-modal-header">
          <h2>
            <FiClipboard size={22} /> {isEditMode ? 'Edit Data' : 'Manual Data Entry'}
          </h2>
          <button className="close-modal" onClick={onClose}>×</button>
        </div>
        
        <div className="manual-modal-body">
          {/* File Name Section */}
          <div className="filename-section">
            <label>File Name:</label>
            <div className="filename-input-group">
              <input
                type="text"
                className="filename-input"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Enter file name"
              />
              <span className="file-extension">.json</span>
            </div>
            <small className="form-hint">You can rename the file before saving</small>
          </div>
          
          {/* Toolbar with Undo/Redo and Paste */}
          <div className="toolbar">
            <button className="toolbar-btn" onClick={undo} disabled={historyIndex <= 0} title="Undo (Ctrl+Z)">
              <FiRotateCcw size={16} /> Undo
            </button>
            <button className="toolbar-btn" onClick={redo} disabled={historyIndex >= history.length - 1} title="Redo (Ctrl+Y)">
              <FiRotateCw size={16} /> Redo
            </button>
            <button className="toolbar-btn" onClick={() => setShowPasteArea(!showPasteArea)} title="Paste from Excel/Google Sheets">
              <FiCopy size={16} /> Paste Data
            </button>
            <button className="toolbar-btn" onClick={clearAll} title="Clear all data">
              Clear All
            </button>
          </div>
          
          {/* Paste Area */}
          {showPasteArea && (
            <div className="paste-area">
              <div className="paste-header">
                <span>📋 Paste from Excel/Google Sheets</span>
                <button className="close-paste" onClick={() => setShowPasteArea(false)}>×</button>
              </div>
              <textarea
                className="paste-textarea"
                rows={6}
                placeholder="Paste your data here...&#10;&#10;Example:&#10;Name,Age,City&#10;John,25,New York&#10;Jane,30,Los Angeles"
                value={pasteData}
                onChange={(e) => setPasteData(e.target.value)}
              />
              <div className="paste-actions">
                <button className="paste-cancel-btn" onClick={() => setShowPasteArea(false)}>Cancel</button>
                <button className="paste-import-btn" onClick={handleManualPaste}>
                  <FiCopy size={14} /> Import Pasted Data
                </button>
              </div>
              <div className="paste-tips">
                💡 <strong>Tip:</strong> Copy from Excel or Google Sheets, then paste here. The system will auto-detect columns and rows.
              </div>
            </div>
          )}
          
          {/* Column Builder */}
          <div className="column-builder">
            <h3>📋 Define Columns</h3>
            <div className="column-input-group">
              <input
                type="text"
                className="column-input"
                placeholder="New column name"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addColumn()}
              />
              <button className="add-column-btn" onClick={addColumn}>
                <FiPlus size={16} /> Add Column
              </button>
            </div>
            <div className="columns-list">
              {columns.map((col, idx) => (
                <span key={idx} className="column-tag">
                  {col}
                  <button className="remove-column" onClick={() => removeColumn(idx)}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
          
          {/* Data Entry Table */}
          <div className="data-entry-section">
            <div className="table-container" style={{ overflowX: 'auto' }}>
              <table className="data-entry-table">
                <thead>
                  <tr>
                    {columns.map((col, idx) => (
                      <th key={idx}>{col}</th>
                    ))}
                    <th style={{ width: 60 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      {columns.map((_, colIdx) => (
                        <td key={colIdx}>
                          <input
                            type="text"
                            value={row.data[colIdx] || ''}
                            onChange={(e) => updateCell(row.id, colIdx, e.target.value)}
                            placeholder={`Enter ${columns[colIdx]}`}
                          />
                        </td>
                      ))}
                      <td className="row-actions">
                        <button 
                          className="delete-row-btn" 
                          onClick={() => removeRow(row.id)}
                          title="Delete row"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <button className="add-row-btn" onClick={addRow}>
              <FiPlus size={14} /> Add Row
            </button>
          </div>
          
          {/* Info Note */}
          <div className="info-note">
            💡 <strong>Tip:</strong> Use <kbd>Ctrl+Z</kbd> to undo and <kbd>Ctrl+Y</kbd> to redo changes
          </div>
        </div>
        
        <div className="manual-modal-footer">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button className="connect-btn" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : (isEditMode ? 'Update Data' : 'Import Data')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualEntry;