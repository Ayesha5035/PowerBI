// src/components/DataConnection/ExcelUploader.jsx
import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import './ExcelUploader.css';

const ExcelUploader = ({ 
  children,
  onUploadSuccess,    // Now expects to save to database
  acceptedFormats = '.xlsx,.xls,.csv'
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

 
// Update the parseFile function to handle large files efficiently

const parseFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        // Use sheetjs with cellDates option for better performance
        const workbook = XLSX.read(data, { 
          type: 'array',
          cellDates: false,  // Don't parse dates for faster loading
          cellNF: false,     // Don't parse number formats
          cellText: false    // Don't store text
        });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setSelectedFile(file);
    setFileInfo({
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type
    });
    setStatus(null);
    setMessage('');
  };

  const openFilePicker = () => {
    fileInputRef.current.click();
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    setStatus('loading');
    setMessage('Processing file...');
    
    try {
      // Parse the file
      const parsedData = await parseFile(selectedFile);
      
      if (!parsedData || parsedData.length === 0) {
        throw new Error('No data found in file');
      }
      
      console.log(`📊 ${selectedFile.name} parsed:`, {
        rows: parsedData.length,
        columns: Object.keys(parsedData[0] || {}),
        sample: parsedData[0]
      });
      
      // Generate a unique file name
      const fileName = `excel_${selectedFile.name.replace(/\.[^/.]+$/, '')}_${Date.now()}.json`;
      
      // Call parent callback with parsed data to save to database
      if (onUploadSuccess) {
        await onUploadSuccess(parsedData, fileName);
      }
      
      setStatus('success');
      setMessage(`✓ "${selectedFile.name}" uploaded successfully (${parsedData.length} rows)`);
      
      // Reset after 3 seconds
      setTimeout(() => {
        setSelectedFile(null);
        setFileInfo(null);
        setStatus(null);
        setMessage('');
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }, 3000);
      
    } catch (error) {
      console.error('Upload error:', error);
      setStatus('error');
      setMessage('✗ Failed to parse file: ' + error.message);
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setFileInfo(null);
    setStatus(null);
    setMessage('');
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="excel-uploader">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept={acceptedFormats}
        className="upload-input"
      />
      
      <div onClick={openFilePicker} style={{ cursor: 'pointer' }}>
        {children}
      </div>
      
      {fileInfo && !status && !isUploading && (
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
              Upload to Database
            </button>
          </div>
        </div>
      )}
      
      {status === 'loading' && (
        <div className="upload-status loading">
          <div className="spinner"></div>
          <span>{message}</span>
        </div>
      )}
      
      {status === 'success' && (
        <div className="upload-status success">
          <span>✅</span>
          <span>{message}</span>
        </div>
      )}
      
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