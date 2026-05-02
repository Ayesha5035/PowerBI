// src/components/DataConnection/ExcelUploader.jsx
import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import './ExcelUploader.css';

// This component wraps the existing card and adds file upload functionality
const ExcelUploader = ({ 
  children,           // The existing card content (icon, title, description)
  onUploadSuccess,    // Callback when upload is complete
  acceptedFormats = '.xlsx,.xls,.csv'  // File formats accepted
}) => {
  // State variables
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [status, setStatus] = useState(null); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('');
  
  // Reference to hidden file input
  const fileInputRef = useRef(null);

  // Format file size from bytes to readable format
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Parse Excel/CSV file to JSON
  const parseFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  // Handle file selection from file picker
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Store file info
    setSelectedFile(file);
    setFileInfo({
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type
    });
    setStatus(null);
    setMessage('');
  };

  // Trigger the file picker dialog
  const openFilePicker = () => {
    fileInputRef.current.click();
  };

  // Upload the selected file
  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setStatus('loading');
    setMessage('Processing file...');
    
    try {
      // Parse the file
      const parsedData = await parseFile(selectedFile);
      
      // Log for debugging
      console.log(`📊 ${selectedFile.name} parsed:`, {
        rows: parsedData.length,
        columns: Object.keys(parsedData[0] || {}),
        sample: parsedData[0]
      });
      
      // Simulate network delay (remove in production)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Call parent callback with parsed data
      if (onUploadSuccess) {
        onUploadSuccess(parsedData, selectedFile.name);
      }
      
      setStatus('success');
      setMessage(`✓ "${selectedFile.name}" uploaded successfully (${parsedData.length} rows)`);
      
      // Reset after 3 seconds
      setTimeout(() => {
        setSelectedFile(null);
        setFileInfo(null);
        setStatus(null);
        setMessage('');
        // Clear input so same file can be selected again
        if (fileInputRef.current) fileInputRef.current.value = '';
      }, 3000);
      
    } catch (error) {
      console.error('Upload error:', error);
      setStatus('error');
      setMessage('✗ Failed to parse file. Please check the format.');
    }
  };

  // Cancel selected file
  const handleCancel = () => {
    setSelectedFile(null);
    setFileInfo(null);
    setStatus(null);
    setMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="excel-uploader">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept={acceptedFormats}
        className="upload-input"
      />
      
      {/* Clickable card - triggers file picker */}
      <div onClick={openFilePicker}>
        {children}
      </div>
      
      {/* Show selected file info */}
      {fileInfo && !status && (
        <div className="selected-file-preview">
          <div className="file-info">
            <span>📄</span>
            <span className="file-name">{fileInfo.name}</span>
            <span className="file-size">({fileInfo.size})</span>
          </div>
          <div className="file-actions">
            <button className="cancel-action-btn" onClick={handleCancel}>
              Cancel
            </button>
            <button className="upload-action-btn" onClick={handleUpload}>
              Upload
            </button>
          </div>
        </div>
      )}
      
      {/* Show loading status */}
      {status === 'loading' && (
        <div className="upload-status loading">
          <div className="spinner"></div>
          <span>{message}</span>
        </div>
      )}
      
      {/* Show success status */}
      {status === 'success' && (
        <div className="upload-status success">
          <span>✅</span>
          <span>{message}</span>
        </div>
      )}
      
      {/* Show error status */}
      {status === 'error' && (
        <div className="upload-status error">
          <span>❌</span>
          <span>{message}</span>
        </div>
      )}
    </div>
  );
};

export default ExcelUploader;