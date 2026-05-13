// src/components/ReportBuilder/ReportBuilder.jsx
import React, { useState } from "react";
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import {
  FiBarChart2, FiTrendingUp, FiPieChart, FiActivity, FiTrash2, FiPlus, FiMove,
  FiChevronRight, FiChevronLeft, FiThermometer, FiWind, FiZap,
  FiPackage, FiAlertCircle, FiCalendar, FiCpu, FiSave, FiDownload
} from 'react-icons/fi';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import "./ReportBuilder.css";

const ReportBuilder = ({ onBackToDashboard }) => {
  const [activeTab, setActiveTab] = useState("reports");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [charts, setCharts] = useState([]);
  const [selectedChartId, setSelectedChartId] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsChartId, setSettingsChartId] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    data: true,
    fields: true,
    visualizations: true,
    filters: true
  });

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const toggleLeftPanel = () => {
    setIsLeftPanelOpen(!isLeftPanelOpen);
  };

  const toggleRightPanel = () => {
    setIsRightPanelOpen(!isRightPanelOpen);
  };

  const hasData = uploadedData && uploadedData.length > 0;

  // Colors for pie chart
  const COLORS = ['#667eea', '#48bb78', '#ed8936', '#dc3545', '#9b59b6', '#01b8aa', '#f39c12', '#1e6f3f'];

  // Build dataFields from uploaded columns
  const dataFields = hasData && uploadedColumns && uploadedColumns.length > 0
    ? uploadedColumns.map((col, idx) => ({
      id: idx,
      name: col,
      type: typeof uploadedData[0]?.[col] === 'number' ? 'number' : 'text',
      icon: <FiBarChart2 size={16} />,
      color: "#667eea"
    }))
    : [];

  const chartTypes = [
    { id: "line", name: "Line Chart", icon: <FiTrendingUp size={24} />, color: "#667eea", description: "Show trends over time" },
    { id: "bar", name: "Bar Chart", icon: <FiBarChart2 size={24} />, color: "#48bb78", description: "Compare categories" },
    { id: "pie", name: "Pie Chart", icon: <FiPieChart size={24} />, color: "#ed8936", description: "Show distribution" },
    { id: "kpi", name: "KPI Card", icon: <FiActivity size={24} />, color: "#01b8aa", description: "Single metric" }
  ];

  const addChart = (chartType) => {
    const numericColumns = dataFields.filter(f => f.type === 'number');
    const defaultYAxis = numericColumns.length > 0 ? numericColumns[0].name : (dataFields[0]?.name || "Value");
    const defaultXAxis = dataFields[0]?.name || "Category";

    const newChart = {
      id: Date.now(),
      type: chartType.id,
      name: chartType.name,
      config: {
        xAxis: defaultXAxis,
        yAxis: defaultYAxis,
        title: `${chartType.name} - ${uploadedFileName || 'Data'}`,
        color: "#667eea",
        showLegend: true,
        showGrid: true,
        showTooltip: true,
        filters: {
          minMax: {},
          dateRange: { start: '', end: '' }
        }
      }
    };
    setCharts([...charts, newChart]);
    setSelectedChartId(newChart.id);
  };

  const removeChart = (chartId) => {
    setCharts(charts.filter(chart => chart.id !== chartId));
    if (selectedChartId === chartId) setSelectedChartId(null);
  };

  const updateChartConfig = (chartId, field, value) => {
    setCharts(charts.map(chart =>
      chart.id === chartId
        ? { ...chart, config: { ...chart.config, [field]: value } }
        : chart
    ));
  };

  const handleXAxisDrop = (chartId, field) => {
    updateChartConfig(chartId, 'xAxis', field.name);
  };

  const handleYAxisDrop = (chartId, field) => {
    if (field.type === 'number') {
      updateChartConfig(chartId, 'yAxis', field.name);
    } else {
      alert(`"${field.name}" is not a numeric field. Please select a numeric field for Y-axis.`);
    }
  };

  const clearXAxis = (chartId) => {
    const defaultXAxis = dataFields[0]?.name || "Category";
    updateChartConfig(chartId, 'xAxis', defaultXAxis);
  };

  const clearYAxis = (chartId) => {
    const numericColumns = dataFields.filter(f => f.type === 'number');
    const defaultYAxis = numericColumns.length > 0 ? numericColumns[0].name : (dataFields[0]?.name || "Value");
    updateChartConfig(chartId, 'yAxis', defaultYAxis);
  };

  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
  };

  const handleNavigateToHome = () => {
    if (onBackToDashboard) {
      onBackToDashboard();
    }
  };

  // Sample data for chart preview (replace with real data later)
  const getSampleChartData = (chartType) => {
    const data = [
      { time: "10:00", temperature: 72, pressure: 4.2, speed: 115, efficiency: 94 },
      { time: "11:00", temperature: 74, pressure: 4.3, speed: 118, efficiency: 95 },
      { time: "12:00", temperature: 73, pressure: 4.1, speed: 120, efficiency: 96 },
      { time: "13:00", temperature: 75, pressure: 4.4, speed: 122, efficiency: 95 },
      { time: "14:00", temperature: 74, pressure: 4.2, speed: 119, efficiency: 94 }
    ];
    return data;
  };

  return (
    <div>
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        onNavigateToDataConnection={() => { }}
        onNavigateToHome={handleNavigateToHome}
      />
      <Navbar sidebarOpen={sidebarOpen} />

      <div className={`reportbuilder-page ${sidebarOpen ? "open" : "closed"}`}>
        {/* Top Navigation Bar */}
        <div className="reportbuilder-topbar">

          <div className="topbar-actions">
            <button className="topbar-action-btn">💾 Save</button>
            <button className="topbar-action-btn">📥 Export</button>
          </div>

          {/* Show data info if uploaded */}
          {hasData && (
            <div className="data-info-bar">
              <span>📊 Using data from: <strong>{uploadedFileName}</strong></span>
              <span>📋 {uploadedData.length} rows, {uploadedColumns?.length} columns</span>
              <span>🎯 Drag fields to drop zones below</span>
            </div>
          )}

          {/* Main Layout */}
          <div className="reportbuilder-container">

            {/* LEFT PANEL */}
            {!isReadingView && isLeftPanelOpen && (
              <div className="reportbuilder-left">
                <div className="panel-section">
                  <div className="panel-header" onClick={() => toggleSection('data')}>
                    <span className="panel-icon">📊</span>
                    <span className="panel-title">Data</span>
                    <span className="panel-chevron">
                      {expandedSections.data ? <FiChevronRight /> : <FiChevronLeft />}
                    </span>
                  </div>
                  {expandedSections.data && (
                    <div className="panel-content">
                      <div className="search-fields">
                        <input
                          type="text"
                          placeholder="🔍 Search fields..."
                          value={searchQuery}
                          onChange={(e) => {
                            const query = e.target.value.toLowerCase();
                            setSearchQuery(query);
                            if (query) {
                              const filtered = dataFields.filter(field =>
                                field.name.toLowerCase().includes(query)
                              );
                              setFilteredFields(filtered);
                            } else {
                              setFilteredFields([]);
                            }
                          }}
                        />
                      </div>

                      {!hasData ? (
                        <div className="no-data-message">
                          <p>⚠️ No data loaded</p>
                          <small>Please upload an Excel/CSV file from the Data Connection page</small>
                        </div>
                      ) : dataFields.length === 0 ? (
                        <div className="no-data-message">
                          <p>⚠️ Loading columns...</p>
                        </div>
                      ) : (
                        <div className="fields-list">
                          {(searchQuery ? filteredFields : dataFields).map(field => (
                            <DraggableField key={field.id} field={field} />
                          ))}
                          {searchQuery && filteredFields.length === 0 && (
                            <div className="no-results">No fields match "{searchQuery}"</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* LEFT PANEL TOGGLE BUTTON */}
            {!isReadingView && (
              <div className="panel-toggle-left">
                <button
                  className="toggle-panel-btn"
                  onClick={toggleLeftPanel}
                  title={isLeftPanelOpen ? "Hide Data Panel" : "Show Data Panel"}
                >
                  {isLeftPanelOpen ? "<<" : ">>"}
                </button>
              </div>
            )}

            {/* CENTER PANEL */}
            <div className={`reportbuilder-center ${!isLeftPanelOpen ? 'expanded-left' : ''} ${!isRightPanelOpen ? 'expanded-right' : ''}`}>

              {/* Reading View Banner */}
              {isReadingView && (
                <div className="reading-view-banner">
                  <span>📖 You are in Reading View. Editing is disabled. Side panels are hidden.</span>
                  <button onClick={() => setIsReadingView(false)}>Exit Reading View</button>
                </div>
              )}

              <div className="canvas-header">
                <span className="canvas-title">
                  📊 {hasData ? uploadedFileName?.replace('.csv', '').replace('.xlsx', '') || 'Report' : 'Machine Performance Report'}
                </span>
                <div className="canvas-actions">
                  <button
                    className={`canvas-btn ${isReadingView ? 'active' : ''}`}
                    onClick={() => setIsReadingView(!isReadingView)}
                  >
                    {isReadingView ? '✏️ Edit View' : '👁️ Reading view'}
                  </button>
                </div>
              </div>

              <div className="canvas-area">
                {!hasData && charts.length === 0 && (
                  <div className="chart-selector">
                    <p className="selector-title">📈 No Data Loaded</p>
                    <p className="selector-subtitle">
                      Please go to <strong>Data Connection</strong> and upload an Excel or CSV file first.
                    </p>
                    <button className="go-to-data-btn" onClick={handleNavigateToHome}>
                      Go to Data Connection
                    </button>
                  </div>
                )}

                {hasData && charts.length === 0 && (
                  <div className="chart-selector">
                    <p className="selector-title">📈 Build visuals with your data</p>
                    <p className="selector-subtitle">
                      <strong>{uploadedData.length} rows</strong> loaded from <strong>{uploadedFileName}</strong>
                    </p>
                    <div className="chart-types-grid">
                      {chartTypes.map(chart => (
                        <div key={chart.id} className="chart-type-card" onClick={() => addChart(chart)}>
                          <div className="chart-type-icon" style={{ color: chart.color }}>
                            {chart.icon}
                          </div>
                          <span className="chart-type-name">{chart.name}</span>
                          <span className="chart-type-desc">{chart.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {charts.map(chart => (
                  <div key={chart.id} className={`chart-wrapper ${selectedChartId === chart.id ? 'selected' : ''} ${isReadingView ? 'reading-mode' : ''}`}>
                    <div className="chart-header-bar">
                      <input
                        type="text"
                        className="chart-title"
                        value={chart.config.title}
                        onChange={(e) => updateChartConfig(chart.id, 'title', e.target.value)}
                        disabled={isReadingView}
                      />
                      <div className="chart-actions">
                        <button
                          className="chart-action-btn"
                          onClick={() => {
                            setSettingsChartId(chart.id);
                            setShowSettingsModal(true);
                          }}
                          title="Chart Settings"
                          disabled={isReadingView}
                        >
                          ⚙️
                        </button>
                        {!isReadingView && (
                          <button className="chart-action-btn" onClick={() => removeChart(chart.id)} title="Remove">
                            <FiTrash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="chart-body">
                      {renderChart(chart)}
                    </div>
                    <div className="chart-footer">
                      <small>X-axis: {chart.config.xAxis} | Y-axis: {chart.config.yAxis}</small>
                    </div>
                  </div>
                ))}

                {hasData && charts.length > 0 && (
                  <div className="add-chart-btn" onClick={() => addChart(chartTypes[0])}>
                    <FiPlus size={20} /> Add new visual
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT PANEL TOGGLE BUTTON */}
            {!isReadingView && (
              <div className="panel-toggle-right">
                <button
                  className="toggle-panel-btn"
                  onClick={toggleRightPanel}
                  title={isRightPanelOpen ? "Hide Visualizations Panel" : "Show Visualizations Panel"}
                >
                  {isRightPanelOpen ? ">>" : "<<"}
                </button>
              </div>
            )}

            {/* RIGHT PANEL */}
            {!isReadingView && isRightPanelOpen && (
              <div className="reportbuilder-right">
                <div className="panel-section">
                  <div className="panel-header" onClick={() => toggleSection('visualizations')}>
                    <span className="panel-icon">📈</span>
                    <span className="panel-title">Visualizations</span>
                    <span className="panel-chevron">
                      {expandedSections.visualizations ? <FiChevronRight /> : <FiChevronLeft />}
                    </span>
                  </div>
                  {expandedSections.visualizations && (
                    <div className="panel-content">
                      <div className="chart-types-small">
                        {chartTypes.map(chart => (
                          <div key={chart.id} className="chart-type-small" onClick={() => addChart(chart)}>
                            <div style={{ color: chart.color }}>{chart.icon}</div>
                            <span>{chart.name}</span>
                          </div>
                        ))}
                      </div>

                      {selectedChartId && hasData && (
                        <div className="axis-config">
                          <h4>Configure Chart</h4>
                          <div className="drag-instructions">
                            <small>💡 Drag fields from Data panel to drop zones below</small>
                          </div>

                          <DropZone
                            label="X-axis (Categories)"
                            value={currentChart?.config.xAxis}
                            onDrop={(field) => handleXAxisDrop(selectedChartId, field)}
                            onClear={() => clearXAxis(selectedChartId)}
                            icon="📊"
                          />

                          <DropZone
                            label="Y-axis (Values - Numeric only)"
                            value={currentChart?.config.yAxis}
                            onDrop={(field) => handleYAxisDrop(selectedChartId, field)}
                            onClear={() => clearYAxis(selectedChartId)}
                            icon="📈"
                          />

                          {/* Chart-Specific Value Filter */}
                          <div className="filter-group" style={{ marginTop: '16px' }}>
                            <div className="filter-header">
                              <span>📈 Value Filter ({currentChart?.config.yAxis})</span>
                              <span
                                className="filter-clear"
                                onClick={() => {
                                  setCharts(charts.map(chart =>
                                    chart.id === selectedChartId
                                      ? {
                                        ...chart,
                                        config: {
                                          ...chart.config,
                                          filters: {
                                            ...chart.config.filters,
                                            minMax: {}
                                          }
                                        }
                                      }
                                      : chart
                                  ));
                                }}
                              >
                                Clear
                              </span>
                            </div>

                            <div className="value-filter-inputs">
                              <input
                                type="number"
                                placeholder={`Min ${currentChart?.config.yAxis}`}
                                className="value-filter-input"
                                value={currentChart?.config.filters?.minMax?.[currentChart?.config.yAxis]?.min || ''}
                                onChange={(e) => {
                                  const currentMinMax = currentChart?.config.filters?.minMax || {};
                                  setCharts(charts.map(chart =>
                                    chart.id === selectedChartId
                                      ? {
                                        ...chart,
                                        config: {
                                          ...chart.config,
                                          filters: {
                                            ...chart.config.filters,
                                            minMax: {
                                              ...currentMinMax,
                                              [currentChart.config.yAxis]: {
                                                ...currentMinMax[currentChart.config.yAxis],
                                                min: e.target.value
                                              }
                                            }
                                          }
                                        }
                                      }
                                      : chart
                                  ));
                                }}
                              />
                              <span>to</span>
                              <input
                                type="number"
                                placeholder={`Max ${currentChart?.config.yAxis}`}
                                className="value-filter-input"
                                value={currentChart?.config.filters?.minMax?.[currentChart?.config.yAxis]?.max || ''}
                                onChange={(e) => {
                                  const currentMinMax = currentChart?.config.filters?.minMax || {};
                                  setCharts(charts.map(chart =>
                                    chart.id === selectedChartId
                                      ? {
                                        ...chart,
                                        config: {
                                          ...chart.config,
                                          filters: {
                                            ...chart.config.filters,
                                            minMax: {
                                              ...currentMinMax,
                                              [currentChart.config.yAxis]: {
                                                ...currentMinMax[currentChart.config.yAxis],
                                                max: e.target.value
                                              }
                                            }
                                          }
                                        }
                                      }
                                      : chart
                                  ));
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Filters Section */}
                <div className="panel-section">
                  <div className="panel-header" onClick={() => toggleSection('filters')}>
                    <span className="panel-icon">🔍</span>
                    <span className="panel-title">Filters</span>
                    <span className="panel-chevron">
                      {expandedSections.filters ? <FiChevronRight /> : <FiChevronLeft />}
                    </span>
                  </div>
                  {expandedSections.filters && (
                    <div className="panel-content">
                      <div className="filter-group">
                        <div className="filter-header">
                          <span>📊 Max Rows to Show</span>
                        </div>
                        <select
                          className="filter-select"
                          value={maxRows}
                          onChange={(e) => setMaxRows(Number(e.target.value))}
                        >
                          <option value={100}>100 rows</option>
                          <option value={500}>500 rows</option>
                          <option value={1000}>1000 rows</option>
                          <option value={5000}>5000 rows</option>
                          <option value={100000}>All rows</option>
                        </select>
                      </div>

                      <div className="filter-group">
                        <div className="filter-header">
                          <span>📈 Value Filters (Min/Max)</span>
                          <span className="filter-clear" onClick={() => setValueFilters({})}>
                            Clear All
                          </span>
                        </div>
                        <div className="value-filters-list">
                          {Object.entries(valueFilters).map(([column, { min, max }]) => (
                            <div key={column} className="value-filter-item">
                              <span className="value-filter-name">{column}</span>
                              <div className="value-filter-inputs">
                                <input
                                  type="number"
                                  placeholder="Min"
                                  value={min}
                                  onChange={(e) => {
                                    setValueFilters({
                                      ...valueFilters,
                                      [column]: { ...valueFilters[column], min: e.target.value }
                                    });
                                  }}
                                  className="value-filter-input"
                                />
                                <span>to</span>
                                <input
                                  type="number"
                                  placeholder="Max"
                                  value={max}
                                  onChange={(e) => {
                                    setValueFilters({
                                      ...valueFilters,
                                      [column]: { ...valueFilters[column], max: e.target.value }
                                    });
                                  }}
                                  className="value-filter-input"
                                />
                                <button
                                  className="remove-filter-btn"
                                  onClick={() => {
                                    const newFilters = { ...valueFilters };
                                    delete newFilters[column];
                                    setValueFilters(newFilters);
                                  }}
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}

                          <button
                            className="add-filter-btn"
                            onClick={() => setShowValueFilterModal(true)}
                          >
                            + Add Value Filter
                          </button>
                        </div>
                      </div>

                      <div className="filter-group">
                        <div className="filter-header">
                          <span>📅 Date Range</span>
                          <span className="filter-clear" onClick={() => setDateRange({ start: '', end: '' })}>
                            Clear
                          </span>
                        </div>
                        <div className="date-range-inputs">
                          <input
                            type="datetime-local"
                            className="date-input"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            placeholder="Start Date"
                          />
                          <span>to</span>
                          <input
                            type="datetime-local"
                            className="date-input"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            placeholder="End Date"
                          />
                        </div>
                      </div>

                      {(columnFilters.length > 0 || Object.keys(valueFilters).length > 0 || dateRange.start || dateRange.end) && (
                        <div className="active-filters-summary">
                          <div className="filter-header">
                            <span>✅ Active Filters</span>
                            <span className="filter-clear" onClick={() => {
                              setColumnFilters([]);
                              setValueFilters({});
                              setDateRange({ start: '', end: '' });
                            }}>
                              Clear All
                            </span>
                          </div>
                          <div className="active-filters-list">
                            {columnFilters.length > 0 && (
                              <div className="active-filter-tag">
                                📊 {columnFilters.length} column(s) selected
                              </div>
                            )}
                            {Object.keys(valueFilters).length > 0 && (
                              <div className="active-filter-tag">
                                📈 {Object.keys(valueFilters).length} value filter(s)
                              </div>
                            )}
                            {(dateRange.start || dateRange.end) && (
                              <div className="active-filter-tag">
                                📅 Date range applied
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filter Modal */}
        {showFilterModal && (
          <div className="filter-modal-overlay" onClick={() => setShowFilterModal(false)}>
            <div className="filter-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Add Data Fields to Filter</h3>
              <div className="filter-options" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {dataFields.map(field => (
                  <label key={field.id} className="filter-option">
                    <input
                      type="checkbox"
                      checked={activeFilters.includes(field.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setActiveFilters([...activeFilters, field.name]);
                        } else {
                          setActiveFilters(activeFilters.filter(f => f !== field.name));
                        }
                      }}
                    /> {field.name}
                  </label>
                ))}
              </div>
              <div className="filter-modal-buttons">
                <button className="cancel-btn" onClick={() => setShowFilterModal(false)}>Cancel</button>
                <button className="apply-btn" onClick={() => setShowFilterModal(false)}>Apply Filters</button>
              </div>
            </div>
          </div>
        )}

        {/* Chart Settings Modal */}
        {showSettingsModal && (
          <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
            <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>⚙️ Chart Settings</h3>
                <button className="modal-close" onClick={() => setShowSettingsModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="setting-group">
                  <label>Chart Type</label>
                  <div className="chart-type-options">
                    {chartTypes.map(type => (
                      <button
                        key={type.id}
                        className={`type-option ${charts.find(c => c.id === settingsChartId)?.type === type.id ? 'active' : ''}`}
                        onClick={() => {
                          setCharts(charts.map(chart =>
                            chart.id === settingsChartId
                              ? { ...chart, type: type.id, name: type.name }
                              : chart
                          ));
                        }}
                      >
                        {type.icon} {type.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="setting-group">
                  <label>Chart Color</label>
                  <div className="color-options">
                    {['#667eea', '#48bb78', '#ed8936', '#dc3545', '#9b59b6', '#01b8aa'].map(color => (
                      <button
                        key={color}
                        className={`color-option ${charts.find(c => c.id === settingsChartId)?.config.color === color ? 'active' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          setCharts(charts.map(chart =>
                            chart.id === settingsChartId
                              ? { ...chart, config: { ...chart.config, color: color } }
                              : chart
                          ));
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className="setting-group">
                  <label>Legend</label>
                  <div className="toggle-switch">
                    <button
                      className={`toggle-option ${charts.find(c => c.id === settingsChartId)?.config.showLegend ? 'active' : ''}`}
                      onClick={() => {
                        setCharts(charts.map(chart =>
                          chart.id === settingsChartId
                            ? { ...chart, config: { ...chart.config, showLegend: true } }
                            : chart
                        ));
                      }}
                    >On</button>
                    <button
                      className={`toggle-option ${!charts.find(c => c.id === settingsChartId)?.config.showLegend ? 'active' : ''}`}
                      onClick={() => {
                        setCharts(charts.map(chart =>
                          chart.id === settingsChartId
                            ? { ...chart, config: { ...chart.config, showLegend: false } }
                            : chart
                        ));
                      }}
                    >Off</button>
                  </div>
                </div>
                <div className="setting-group">
                  <label>Grid Lines</label>
                  <div className="toggle-switch">
                    <button
                      className={`toggle-option ${charts.find(c => c.id === settingsChartId)?.config.showGrid ? 'active' : ''}`}
                      onClick={() => {
                        setCharts(charts.map(chart =>
                          chart.id === settingsChartId
                            ? { ...chart, config: { ...chart.config, showGrid: true } }
                            : chart
                        ));
                      }}
                    >On</button>
                    <button
                      className={`toggle-option ${!charts.find(c => c.id === settingsChartId)?.config.showGrid ? 'active' : ''}`}
                      onClick={() => {
                        setCharts(charts.map(chart =>
                          chart.id === settingsChartId
                            ? { ...chart, config: { ...chart.config, showGrid: false } }
                            : chart
                        ));
                      }}
                    >Off</button>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="apply-btn" onClick={() => setShowSettingsModal(false)}>Apply</button>
              </div>
            </div>
          </div>
        )}

        {/* Value Filter Modal */}
        {showValueFilterModal && (
          <div className="filter-modal-overlay" onClick={() => setShowValueFilterModal(false)}>
            <div className="filter-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Add Value Filter</h3>
              <div className="filter-options" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <select
                  className="filter-select"
                  value={selectedValueColumn || ''}
                  onChange={(e) => setSelectedValueColumn(e.target.value)}
                >
                  <option value="">Select a column</option>
                  {dataFields.filter(f => f.type === 'number').map(field => (
                    <option key={field.id} value={field.name}>{field.name}</option>
                  ))}
                </select>
                {selectedValueColumn && (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <input
                      type="number"
                      placeholder="Minimum value"
                      className="value-filter-input"
                      id="filter-min"
                    />
                    <input
                      type="number"
                      placeholder="Maximum value"
                      className="value-filter-input"
                      id="filter-max"
                    />
                  </div>
                )}
              </div>
              <div className="filter-modal-buttons">
                <button className="cancel-btn" onClick={() => setShowValueFilterModal(false)}>Cancel</button>
                <button
                  className="apply-btn"
                  onClick={() => {
                    if (selectedValueColumn) {
                      const min = document.getElementById('filter-min')?.value || '';
                      const max = document.getElementById('filter-max')?.value || '';
                      if (min || max) {
                        setValueFilters({
                          ...valueFilters,
                          [selectedValueColumn]: { min, max }
                        });
                      }
                    }
                    setShowValueFilterModal(false);
                    setSelectedValueColumn(null);
                  }}
                >
                  Apply Filter
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export default ReportBuilder;