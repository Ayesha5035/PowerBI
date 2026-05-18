import React, { useState, useEffect, useRef } from "react";
import { FaSearch, FaBell, FaEnvelope, FaSignOutAlt, FaTimes, FaFileAlt, FaHome, FaChartBar, FaStar, FaDatabase, FaArrowRight } from "react-icons/fa";
import "./Navbar.css";

function Navbar({ sidebarOpen, onNavigateToDataConnection, onNavigateToWorkspace, onNavigateToReportBuilder, onNavigateToFavourites }) {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [userName, setUserName] = useState("User");
  const [userInitials, setUserInitials] = useState("U");
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [navigationResults, setNavigationResults] = useState([]);
  const [fileResults, setFileResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);

  // Navigation options for search
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FaHome, page: 'Home', action: 'dashboard' },
    { id: 'new-report', label: 'New Report', icon: FaFileAlt, page: 'Data Connection', action: 'dataConnection' },
    { id: 'data-connection', label: 'Data Connection', icon: FaDatabase, page: 'Data Connection', action: 'dataConnection' },
    { id: 'workspace', label: 'My Workspace', icon: FaChartBar, page: 'Workspace', action: 'workspace' },
    { id: 'report-builder', label: 'Report Builder', icon: FaFileAlt, page: 'Report Builder', action: 'reportBuilder' },
    { id: 'favourites', label: 'Favourites', icon: FaStar, page: 'Favourites', action: 'favourites' },
  ];

  // Generate initials from name
  const generateInitials = (name) => {
    if (!name) return "U";
    
    const trimmedName = name.trim();
    
    // If has space (first and last name)
    if (trimmedName.includes(' ')) {
      const parts = trimmedName.split(' ');
      const first = parts[0]?.charAt(0)?.toUpperCase() || '';
      const last = parts[parts.length - 1]?.charAt(0)?.toUpperCase() || '';
      return first + last;
    }
    
    // Single word - take first 2 letters
    if (trimmedName.length >= 2) {
      return trimmedName.charAt(0).toUpperCase() + trimmedName.charAt(1).toLowerCase();
    }
    
    // Single letter
    return trimmedName.charAt(0).toUpperCase();
  };

  // Load user from localStorage
  useEffect(() => {
    console.log('=== Loading User for Navbar ===');
    
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    console.log('Token exists:', !!storedToken);
    console.log('User stored:', storedUser);
    
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        console.log('Parsed user:', user);
        
        // Get name from various possible field names
        const name = user.name || user.userName || user.fullName || user.displayName || 'User';
        
        setUserName(name);
        setUserInitials(generateInitials(name));
        
        console.log('✓ Name:', name);
        console.log('✓ Initials:', generateInitials(name));
      } catch (e) {
        console.error('Parse error:', e);
        setUserName('User');
        setUserInitials('U');
      }
    } else if (storedToken === 'guest_token') {
      // Guest user
      setUserName('Guest');
      setUserInitials('G');
    } else {
      // No user found
      setUserName('User');
      setUserInitials('U');
    }
  }, []);

  // Get saved files/reports
  const getSavedFiles = () => {
    const files = [];
    
    const recentReports = localStorage.getItem("recentReports");
    if (recentReports) {
      try {
        const reports = JSON.parse(recentReports);
        reports.forEach((report, idx) => {
          files.push({
            id: `report_${idx}`,
            label: report.name || 'Untitled Report',
            type: report.type || 'file',
            icon: report.type === 'excel' ? '📊' : report.type === 'csv' ? '📄' : report.type === 'sql' ? '🗄️' : '📁',
            meta: `${report.rows || 0} rows`,
            date: report.date ? new Date(report.date).toLocaleDateString() : ''
          });
        });
      } catch (e) {}
    }
    
    const savedDatasets = localStorage.getItem("savedDatasets");
    if (savedDatasets) {
      try {
        const datasets = JSON.parse(savedDatasets);
        datasets.forEach((ds, idx) => {
          files.push({
            id: `dataset_${idx}`,
            label: ds.fileName || ds.name || 'Dataset',
            type: 'dataset',
            icon: '📊',
            meta: `${ds.rowCount || ds.rows || 0} rows`,
            date: ds.importedAt || ''
          });
        });
      } catch (e) {}
    }
    
    return files;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search logic
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      
      const navFiltered = navigationItems.filter(item => 
        item.label.toLowerCase().includes(query) ||
        item.page.toLowerCase().includes(query)
      );
      
      const savedFiles = getSavedFiles();
      const filesFiltered = savedFiles.filter(file => 
        file.label.toLowerCase().includes(query)
      );
      
      setNavigationResults(navFiltered);
      setFileResults(filesFiltered);
      setShowResults(true);
      setSelectedIndex(-1);
    } else {
      setNavigationResults([]);
      setFileResults([]);
      setShowResults(false);
      setSelectedIndex(-1);
    }
  }, [searchQuery]);

  // Highlight matching text
  const highlightMatch = (text, query) => {
    if (!query || !text) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <strong key={i} style={{ backgroundColor: '#ffd700', color: '#000', padding: '0 3px', borderRadius: '3px' }}>{part}</strong>
        : part
    );
  };

  const handleNavigationClick = (item) => {
    switch (item.action) {
      case 'dashboard':
        window.location.href = '/dashboard';
        break;
      case 'dataConnection':
        if (onNavigateToDataConnection) onNavigateToDataConnection();
        break;
      case 'workspace':
        if (onNavigateToWorkspace) onNavigateToWorkspace();
        break;
      case 'reportBuilder':
        if (onNavigateToReportBuilder) onNavigateToReportBuilder();
        break;
      case 'favourites':
        if (onNavigateToFavourites) onNavigateToFavourites();
        break;
      default:
        window.location.href = '/dashboard';
    }
    
    setSearchQuery("");
    setShowResults(false);
  };

  const handleFileClick = (file) => {
    alert(`Opening: ${file.label}\nType: ${file.type}\nRows: ${file.meta}`);
    setSearchQuery("");
    setShowResults(false);
  };

  const handleKeyDown = (e) => {
    const totalResults = navigationResults.length + fileResults.length;
    
    if (e.key === 'Escape') {
      setSearchQuery("");
      setShowResults(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => prev < totalResults - 1 ? prev + 1 : prev);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      if (selectedIndex < navigationResults.length) {
        handleNavigationClick(navigationResults[selectedIndex]);
      } else {
        handleFileClick(fileResults[selectedIndex - navigationResults.length]);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // Avatar URL based on user initials
  const avatarUrl = `https://ui-avatars.com/api/?background=667eea&color=ffffff&name=${encodeURIComponent(userInitials)}&bold=true&length=2&size=128`;

  return (
    <>
      <div className="navbar" style={{ marginLeft: sidebarOpen ? "260px" : "80px" }}>
        <div></div>
        
        {/* Search Bar */}
        <div className="search-container" ref={searchRef}>
          <div className="search-bar">
            <FaSearch />
            <input 
              type="text" 
              placeholder="Search pages, reports, files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery && setShowResults(true)}
              onKeyDown={handleKeyDown}
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => { setSearchQuery(""); setShowResults(false); }}>
                <FaTimes />
              </button>
            )}
          </div>
          
          {showResults && (
            <div className="search-results-dropdown">
              {navigationResults.length > 0 || fileResults.length > 0 ? (
                <>
                  <div className="search-results-header">
                    🔍 Found {navigationResults.length + fileResults.length} result{(navigationResults.length + fileResults.length) !== 1 ? 's' : ''} for "{searchQuery}"
                  </div>
                  
                  <div className="search-results-list">
                    {navigationResults.length > 0 && (
                      <>
                        <div className="search-section-title">📍 Pages</div>
                        {navigationResults.map((item, index) => {
                          const IconComponent = item.icon;
                          return (
                            <div 
                              key={item.id} 
                              className={`search-result-item ${selectedIndex === index ? 'selected' : ''}`}
                              onClick={() => handleNavigationClick(item)}
                              onMouseEnter={() => setSelectedIndex(index)}
                            >
                              <div className="search-result-left">
                                <IconComponent className="search-result-icon" />
                                <div className="search-result-text">
                                  <span className="search-result-label">
                                    {highlightMatch(item.label, searchQuery)}
                                  </span>
                                  <span className="search-result-page">Go to: {item.page}</span>
                                </div>
                              </div>
                              <div className="search-result-action">
                                <span>Go</span>
                                <FaArrowRight />
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                    
                    {fileResults.length > 0 && (
                      <>
                        <div className="search-section-title">📄 Your Files</div>
                        {fileResults.map((file, index) => {
                          const navCount = navigationResults.length;
                          return (
                            <div 
                              key={file.id} 
                              className={`search-result-item ${selectedIndex === navCount + index ? 'selected' : ''}`}
                              onClick={() => handleFileClick(file)}
                              onMouseEnter={() => setSelectedIndex(navCount + index)}
                            >
                              <div className="search-result-left">
                                <span className="file-icon">{file.icon}</span>
                                <div className="search-result-text">
                                  <span className="search-result-label">
                                    {highlightMatch(file.label, searchQuery)}
                                  </span>
                                  <span className="search-result-page">
                                    {file.meta} {file.date && `• ${file.date}`}
                                  </span>
                                </div>
                              </div>
                              <div className="search-result-action file-action">
                                <span>Open</span>
                                <FaArrowRight />
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                  
                  <div className="search-results-footer">
                    <span>⌨️ Use ↑↓ arrows • Enter to select • Esc to close</span>
                  </div>
                </>
              ) : (
                <div className="search-no-results">
                  <div className="no-results-icon">🔍</div>
                  <p>No results found for "{searchQuery}"</p>
                  <span>Try searching for: Dashboard, Workspace, Reports, or your filenames</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="user-info">
        
          <button className="logout-icon-btn" onClick={() => setShowLogoutDialog(true)} title="Logout">
            <FaSignOutAlt style={{ fontSize: "18px", color: "white" }} />
          </button>
          
          <img src={avatarUrl} alt="Profile" className="profile-img" title={userName} />
        </div>
      </div>

      {showLogoutDialog && (
        <div className="logout-dialog-overlay" onClick={() => setShowLogoutDialog(false)}>
          <div className="logout-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="logout-dialog-header">
              <h3>Confirm Logout</h3>
              <button className="logout-dialog-close" onClick={() => setShowLogoutDialog(false)}>×</button>
            </div>
            <div className="logout-dialog-body">
              <p>Are you sure you want to logout?</p>
              <p className="logout-dialog-warning">You will need to login again to access your account.</p>
            </div>
            <div className="logout-dialog-footer">
              <button className="logout-dialog-cancel" onClick={() => setShowLogoutDialog(false)}>Cancel</button>
              <button className="logout-dialog-confirm" onClick={handleLogout}>Yes, Logout</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;