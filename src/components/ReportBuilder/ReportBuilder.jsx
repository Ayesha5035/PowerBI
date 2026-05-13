// src/components/ReportBuilder/ReportBuilder.jsx
import React, { useState } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import {
  FiBarChart2, FiTrendingUp, FiPieChart, FiActivity, FiTrash2, FiPlus, FiMove,
  FiChevronRight, FiChevronLeft, FiThermometer, FiWind, FiZap,
  FiPackage, FiAlertCircle, FiCalendar, FiCpu, FiEye, FiEyeOff
} from 'react-icons/fi';
import "./ReportBuilder.css";

const ReportBuilder = ({ 
  onBackToDashboard,
  sidebarOpen,          
  toggleSidebar,
  onNavigateToDataConnection,
  onNavigateToWorkspace,
  onNavigateToFavourites,
  onNavigateToReportBuilder
}) => {
  const [activeTab, setActiveTab] = useState("reports");
  const [charts, setCharts] = useState([]);
  const [selectedChartId, setSelectedChartId] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    data: true,
    fields: true,
    visualizations: true,
    filters: true
  });

  // Machine monitoring data fields
  const dataFields = [
    { id: 1, name: "Machine ID", type: "text", icon: <FiCpu size={16} />, color: "#667eea" },
    { id: 2, name: "Timestamp", type: "datetime", icon: <FiCalendar size={16} />, color: "#48bb78" },
    { id: 3, name: "Temperature (°C)", type: "number", icon: <FiThermometer size={16} />, color: "#ed8936" },
    { id: 4, name: "Pressure (bar)", type: "number", icon: <FiWind size={16} />, color: "#9b59b6" },
    { id: 5, name: "Speed (bottles/min)", type: "number", icon: <FiZap size={16} />, color: "#01b8aa" },
    { id: 6, name: "Bottle Count", type: "number", icon: <FiPackage size={16} />, color: "#1e6f3f" },
    { id: 7, name: "Reject Count", type: "number", icon: <FiAlertCircle size={16} />, color: "#dc3545" },
    { id: 8, name: "Efficiency (%)", type: "number", icon: <FiBarChart2 size={16} />, color: "#01b8aa" }
  ];

  const chartTypes = [
    { id: "line", name: "Line Chart", icon: <FiTrendingUp size={24} />, color: "#667eea", description: "Show trends over time" },
    { id: "bar", name: "Bar Chart", icon: <FiBarChart2 size={24} />, color: "#48bb78", description: "Compare categories" },
    { id: "pie", name: "Pie Chart", icon: <FiPieChart size={24} />, color: "#ed8936", description: "Show distribution" },
    { id: "kpi", name: "KPI Card", icon: <FiActivity size={24} />, color: "#01b8aa", description: "Single metric" }
  ];

  const addChart = (chartType) => {
    const newChart = {
      id: Date.now(),
      type: chartType.id,
      name: chartType.name,
      config: {
        xAxis: "Timestamp",
        yAxis: "Temperature",
        title: `${chartType.name} - Machine Performance`
      },
      position: { x: 0, y: 0 }
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

  // Sample data for chart preview
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
        onNavigateToDataConnection={onNavigateToDataConnection}
        onNavigateToHome={handleNavigateToHome}
        onNavigateToWorkspace={onNavigateToWorkspace}
        onNavigateToFavourites={onNavigateToFavourites}
        onNavigateToReportBuilder={onNavigateToReportBuilder}
      />
      <Navbar sidebarOpen={sidebarOpen} />

      <div className={`reportbuilder-page ${sidebarOpen ? "open" : "closed"}`}>
        {/* Top Navigation Bar */}
        <div className="reportbuilder-topbar">
          <div className="topbar-actions">
            <button className="topbar-action-btn">💾 Save</button>
            <button className="topbar-action-btn">📥 Export</button>
          </div>
        </div>

        {/* Main 3-Column Layout */}
        <div className="reportbuilder-container">

          {/* LEFT PANEL - Data Fields */}
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
                    <input type="text" placeholder="🔍 Search fields..." />
                  </div>
                  <div className="fields-list">
                    {dataFields.map(field => (
                      <div key={field.id} className="field-item" draggable>
                        <span className="field-icon" style={{ color: field.color }}>
                          {field.icon}
                        </span>
                        <span className="field-name">{field.name}</span>
                        <span className="field-type">{field.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CENTER PANEL - Report Canvas */}
          <div className="reportbuilder-center">
            <div className="canvas-header">
              <span className="canvas-title">📊 Machine Performance Report</span>
              <div className="canvas-actions">
                <button className="canvas-btn">👁️ Reading view</button>
              </div>
            </div>

            <div className="canvas-area">
              {charts.length === 0 && (
                <div className="chart-selector">
                  <p className="selector-title">📈 Build visuals with your machine data</p>
                  <p className="selector-subtitle">
                    Select or drag fields from the <strong>Data</strong> pane onto the report canvas.
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

              {charts.map(chart => {
                const sampleData = getSampleChartData(chart.type);
                return (
                  <div key={chart.id} className={`chart-card ${selectedChartId === chart.id ? 'selected' : ''}`}>
                    <div className="chart-header">
                      <div className="chart-drag-handle"><FiMove size={16} /></div>
                      <input
                        type="text"
                        className="chart-title-input"
                        value={chart.config.title}
                        onChange={(e) => updateChartConfig(chart.id, 'title', e.target.value)}
                      />
                      <div className="chart-actions">
                        <button className="chart-action-btn" title="Settings">⚙️</button>
                        <button className="chart-action-btn" onClick={() => removeChart(chart.id)}>
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="chart-body">
                      <div className="chart-placeholder">
                        {chart.type === 'line' && (
                          <div className="preview-chart">
                            <FiTrendingUp size={36} style={{ color: '#667eea' }} />
                            <div className="preview-line-chart">
                              {sampleData.map((item, idx) => (
                                <div key={idx} className="preview-line-point" style={{ height: `${item.temperature}px` }} />
                              ))}
                            </div>
                            <div className="preview-labels">
                              <span>X-axis: {chart.config.xAxis}</span>
                              <span>Y-axis: {chart.config.yAxis}</span>
                            </div>
                          </div>
                        )}
                        {chart.type === 'bar' && (
                          <div className="preview-chart">
                            <FiBarChart2 size={36} style={{ color: '#48bb78' }} />
                            <div className="preview-bar-chart">
                              {sampleData.map((item, idx) => (
                                <div key={idx} className="preview-bar" style={{ height: `${item.speed / 2}px` }} />
                              ))}
                            </div>
                            <div className="preview-labels">
                              <span>X-axis: {chart.config.xAxis}</span>
                              <span>Y-axis: {chart.config.yAxis}</span>
                            </div>
                          </div>
                        )}
                        {chart.type === 'pie' && (
                          <div className="preview-chart">
                            <FiPieChart size={36} style={{ color: '#ed8936' }} />
                            <div className="preview-pie-chart">
                              <div className="pie-slice" style={{ transform: 'rotate(0deg)' }} />
                              <div className="pie-slice" style={{ transform: 'rotate(72deg)' }} />
                              <div className="pie-slice" style={{ transform: 'rotate(144deg)' }} />
                            </div>
                            <div className="preview-labels">
                              <span>Distribution by {chart.config.xAxis}</span>
                            </div>
                          </div>
                        )}
                        {chart.type === 'kpi' && (
                          <div className="preview-chart">
                            <FiActivity size={36} style={{ color: '#01b8aa' }} />
                            <div className="kpi-value">
                              <span className="kpi-number">94</span>
                              <span className="kpi-unit">%</span>
                            </div>
                            <div className="preview-labels">
                              <span>Current {chart.config.yAxis}</span>
                              <span className="kpi-trend">↑ +2.5% from yesterday</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {charts.length > 0 && (
                <div className="add-chart-btn" onClick={() => addChart(chartTypes[0])}>
                  <FiPlus size={20} /> Add new visual
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL - Visualizations & Filters */}
          <div className="reportbuilder-right">
            {/* Visualizations Section */}
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

                  {selectedChartId && (
                    <div className="axis-config">
                      <h4>Configure Chart</h4>
                      <div className="axis-field">
                        <label>X-axis</label>
                        <select
                          className="axis-select"
                          value={charts.find(c => c.id === selectedChartId)?.config.xAxis || "Timestamp"}
                          onChange={(e) => updateChartConfig(selectedChartId, 'xAxis', e.target.value)}
                        >
                          {dataFields.map(field => (
                            <option key={field.id} value={field.name}>{field.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="axis-field">
                        <label>Y-axis</label>
                        <select
                          className="axis-select"
                          value={charts.find(c => c.id === selectedChartId)?.config.yAxis || "Temperature"}
                          onChange={(e) => updateChartConfig(selectedChartId, 'yAxis', e.target.value)}
                        >
                          {dataFields.filter(f => f.type === 'number').map(field => (
                            <option key={field.id} value={field.name}>{field.name}</option>
                          ))}
                        </select>
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
                      <span>Machine</span>
                      <span className="filter-clear">✕ Clear</span>
                    </div>
                    <div className="filter-options">
                      <label className="filter-option"><input type="checkbox" /> Packer-01</label>
                      <label className="filter-option"><input type="checkbox" /> Packer-02</label>
                      <label className="filter-option"><input type="checkbox" /> Packer-03</label>
                    </div>
                  </div>
                  <div className="filter-group">
                    <div className="filter-header">
                      <span>Date Range</span>
                      <span className="filter-clear">✕ Clear</span>
                    </div>
                    <div className="filter-options">
                      <label className="filter-option"><input type="radio" name="date" /> Last 24 Hours</label>
                      <label className="filter-option"><input type="radio" name="date" /> Last 7 Days</label>
                      <label className="filter-option"><input type="radio" name="date" /> Last 30 Days</label>
                      <label className="filter-option"><input type="radio" name="date" /> Custom Range</label>
                    </div>
                  </div>
                  <div className="filter-group">
                    <div className="filter-header">
                      <span>Status</span>
                      <span className="filter-clear">✕ Clear</span>
                    </div>
                    <div className="filter-options">
                      <label className="filter-option"><input type="checkbox" /> Running</label>
                      <label className="filter-option"><input type="checkbox" /> Idle</label>
                      <label className="filter-option"><input type="checkbox" /> Maintenance</label>
                      <label className="filter-option"><input type="checkbox" /> Error</label>
                    </div>
                  </div>
                  <div className="filter-add">
                    <button>+ Add data fields here</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportBuilder;