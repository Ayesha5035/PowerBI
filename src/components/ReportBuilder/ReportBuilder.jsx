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

// Item type constant for drag and drop
const ItemTypes = {
  FIELD: 'field'
};

// Draggable Field Component
const DraggableField = ({ field }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.FIELD,
    item: { field },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`field-item ${isDragging ? 'dragging' : ''}`}
      style={{ opacity: isDragging ? 0.5 : 1, cursor: 'grab' }}
      draggable="true"
    >
      <span className="field-icon" style={{ color: field.color }}>
        {field.icon}
      </span>
      <span className="field-name">{field.name}</span>
      <span className="field-type">{field.type}</span>
    </div>
  );
};

// Drop Zone Component for Axis
const DropZone = ({ label, value, onDrop, onClear, icon }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.FIELD,
    drop: (item) => onDrop(item.field),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div className="axis-field">
      <label>{label}</label>
      <div
        ref={drop}
        className={`axis-dropzone ${isOver ? 'drag-over' : ''} ${value ? 'filled' : ''}`}
      >
        {value ? (
          <>
            <span className="axis-value">📊 {value}</span>
            <button
              className="axis-clear"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
            >
              ✕
            </button>
          </>
        ) : (
          <span className="axis-placeholder">
            {icon} Drop field here
          </span>
        )}
      </div>
    </div>
  );
};

const ReportBuilder = ({ onBackToDashboard, uploadedData, uploadedFileName, uploadedColumns }) => {
  const [activeTab, setActiveTab] = useState("reports");
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 768);
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
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFields, setFilteredFields] = useState([]);
  const [dataSourceFilter, setDataSourceFilter] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);
  const [isReadingView, setIsReadingView] = useState(false);

  // Panel toggle states
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  // Filter states
  const [columnFilters, setColumnFilters] = useState([]);
  const [valueFilters, setValueFilters] = useState({});
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showValueFilterModal, setShowValueFilterModal] = useState(false);
  const [maxRows, setMaxRows] = useState(1000);
  const [selectedValueColumn, setSelectedValueColumn] = useState(null);

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
    if (onBackToDashboard) onBackToDashboard();
  };

  const saveDashboard = () => {
    if (!hasData) {
      alert("No data loaded. Please upload data first.");
      return;
    }

    const dashboard = {
      id: Date.now(),
      name: `Dashboard_${new Date().toLocaleDateString()}`,
      fileName: uploadedFileName,
      columns: uploadedColumns,
      charts: charts,
      savedAt: new Date().toISOString()
    };

    const savedDashboards = JSON.parse(localStorage.getItem('analytics_dashboards') || '[]');
    savedDashboards.push(dashboard);
    localStorage.setItem('analytics_dashboards', JSON.stringify(savedDashboards));

    alert(`Dashboard saved successfully!`);
  };

  const loadSavedDashboards = () => {
    const saved = JSON.parse(localStorage.getItem('analytics_dashboards') || '[]');
    if (saved.length === 0) {
      alert("No saved dashboards found.");
      return;
    }

    const dashboardNames = saved.map((d, i) => `${i + 1}. ${d.name} (${d.fileName})`).join('\n');
    const selection = prompt(`Select dashboard to load:\n${dashboardNames}\n\nEnter number (1-${saved.length}):`);

    if (selection && !isNaN(selection)) {
      const index = parseInt(selection) - 1;
      if (index >= 0 && index < saved.length) {
        const dashboard = saved[index];
        setCharts(dashboard.charts);
        alert(`Loaded "${dashboard.name}"`);
      }
    }
  };

  const clearAllDashboards = () => {
    if (confirm("⚠️ This will delete ALL saved dashboards. Are you sure?")) {
      localStorage.removeItem('analytics_dashboards');
      alert("All saved dashboards cleared.");
    }
  };

  // Get filtered data for a specific chart
  const getChartDataForChart = (chart) => {
    if (!hasData) return [];

    let filtered = [...uploadedData];

    const chartFilters = chart.config.filters || { minMax: {}, dateRange: {} };
    const yAxisColumn = chart.config.yAxis;
    const filterConfig = chartFilters.minMax[yAxisColumn];

    if (filterConfig) {
      const { min, max } = filterConfig;
      if (min !== '' && min !== undefined && min !== null) {
        filtered = filtered.filter(row => {
          const val = Number(row[yAxisColumn]);
          return !isNaN(val) && val >= Number(min);
        });
      }
      if (max !== '' && max !== undefined && max !== null) {
        filtered = filtered.filter(row => {
          const val = Number(row[yAxisColumn]);
          return !isNaN(val) && val <= Number(max);
        });
      }
    }

    const { start, end } = chartFilters.dateRange;
    if (start || end) {
      const dateColumn = uploadedColumns?.find(col =>
        col.toLowerCase().includes('date') ||
        col.toLowerCase().includes('time') ||
        col.toLowerCase().includes('timestamp')
      );

      if (dateColumn) {
        filtered = filtered.filter(row => {
          const rowDate = new Date(row[dateColumn]);
          if (isNaN(rowDate.getTime())) return true;
          if (start) {
            const startDate = new Date(start);
            if (!isNaN(startDate.getTime()) && startDate > rowDate) return false;
          }
          if (end) {
            const endDate = new Date(end);
            if (!isNaN(endDate.getTime()) && endDate < rowDate) return false;
          }
          return true;
        });
      }
    }

    return filtered.slice(0, maxRows);
  };

  const currentChart = charts.find(c => c.id === selectedChartId);

  // Render chart based on type
  const renderChart = (chart) => {
    const chartSpecificData = getChartDataForChart(chart);

    if (!hasData || chartSpecificData.length === 0) {
      return (
        <div className="chart-placeholder">
          <p>No data available for this chart</p>
          <small>Please adjust filters or upload data</small>
        </div>
      );
    }

    const { xAxis, yAxis } = chart.config;

    const getPieDataForChart = () => {
      const grouped = {};
      chartSpecificData.forEach(row => {
        const key = String(row[xAxis] || 'Other');
        const value = Number(row[yAxis]) || 0;
        if (!grouped[key]) grouped[key] = 0;
        grouped[key] += value;
      });
      return Object.entries(grouped).map(([name, value]) => ({ name, value }));
    };

    const pieData = getPieDataForChart();
    const kpiValue = chartSpecificData.reduce((sum, row) => sum + (Number(row[yAxis]) || 0), 0) / chartSpecificData.length;

    switch (chart.type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartSpecificData}>
              {chart.config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey={xAxis} angle={-45} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              {chart.config.showLegend && <Legend />}
              <Line
                type="monotone"
                dataKey={yAxis}
                stroke={chart.config.color || "#667eea"}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartSpecificData}>
              {chart.config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey={xAxis} angle={-45} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              {chart.config.showLegend && <Legend />}
              <Bar dataKey={yAxis} fill={chart.config.color || "#48bb78"} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'kpi':
        const formattedValue = typeof kpiValue === 'number' ? kpiValue.toFixed(2) : kpiValue;
        return (
          <div className="kpi-card">
            <div className="kpi-icon"><FiActivity size={48} color="#01b8aa" /></div>
            <div className="kpi-number">{formattedValue}</div>
            <div className="kpi-label">Average {yAxis}</div>
            <div className="kpi-footer">Based on {chartSpecificData.length} records</div>
          </div>
        );

      default:
        return <div>Chart type not supported</div>;
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
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
          {/* Top action bar */}
          <div className="reportbuilder-topbar">
            <div className="topbar-actions">
              <button className="topbar-action-btn" onClick={saveDashboard}>
                <FiSave size={14} /> Save Dashboard
              </button>
              <button className="topbar-action-btn" onClick={loadSavedDashboards}>
                <FiDownload size={14} /> Load Dashboard
              </button>
              <button className="topbar-action-btn" onClick={clearAllDashboards}>
                🗑️ Clear Saved
              </button>
            </div>
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