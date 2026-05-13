// src/components/Workspace/WorkspacePage.jsx

import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";

import {
  FaPlus,
  FaFilter,
  FaTh,
  FaThList,
  FaDatabase,
  FaFileExcel,
  FaFileCsv,
  FaServer,
  FaTrash,
  FaSync
} from "react-icons/fa";

import "./WorkspacePage.css";

function WorkspacePage({
  sidebarOpen,
  toggleSidebar,
  onBackToDashboard,
  onNavigateToDataConnection,
  onNavigateToWorkspace,
  onNavigateToFavourites,
  onNavigateToReportBuilder
}) {
  const [activeTab, setActiveTab] = useState("workspaces");

  /* ===================================== */
  /* WORKSPACE STATES */
  /* ===================================== */
  const [workspaceItems, setWorkspaceItems] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [filterKeyword, setFilterKeyword] = useState("");
  const [filterType, setFilterType] = useState("all");

  /* ===================================== */
  /* DATA LOADED STATE */
  /* ===================================== */
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  /* ===================================== */
  /* WORKSPACE SYSTEM */
  /* ===================================== */
  const [workspaceSidebarOpen, setWorkspaceSidebarOpen] = useState(false);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState("My Workspace");
  const [newWorkspace, setNewWorkspace] = useState({
    title: "",
    description: ""
  });

  const isFirstRender = useRef(true);

  /* ===================================== */
  /* LOAD WORKSPACE ITEMS */
  /* ===================================== */
  const loadWorkspaceItems = (workspaceName) => {
    const allWorkspaceData = JSON.parse(localStorage.getItem("workspaceData")) || {};
    const currentItems = allWorkspaceData[workspaceName] || [];
    setWorkspaceItems(currentItems);
  };

  /* ===================================== */
  /* INITIAL LOAD */
  /* ===================================== */
  useEffect(() => {
    // Load workspaces
    const savedWorkspaces = JSON.parse(localStorage.getItem("allWorkspaces"));
    if (savedWorkspaces && savedWorkspaces.length > 0) {
      setWorkspaces(savedWorkspaces);
    } else {
      const defaultWorkspace = [
        {
          id: 1,
          title: "My Workspace",
          description: "Default workspace"
        }
      ];
      setWorkspaces(defaultWorkspace);
      localStorage.setItem("allWorkspaces", JSON.stringify(defaultWorkspace));
    }

    // Load active workspace and items
    const savedActiveWorkspace = localStorage.getItem("activeWorkspace");
    if (savedActiveWorkspace) {
      setActiveWorkspace(savedActiveWorkspace);
      loadWorkspaceItems(savedActiveWorkspace);
    } else {
      const workspaceName = "My Workspace";
      setActiveWorkspace(workspaceName);
      loadWorkspaceItems(workspaceName);
    }
    
    // ✅ Force sidebar CLOSED
    setWorkspaceSidebarOpen(false);
    
    setIsDataLoaded(true);
    isFirstRender.current = false;
  }, []);

  /* ===================================== */
  /* RELOAD ON WORKSPACE CHANGE */
  /* ===================================== */
  useEffect(() => {
    if (activeWorkspace && isDataLoaded) {
      loadWorkspaceItems(activeWorkspace);
      localStorage.setItem("activeWorkspace", activeWorkspace);
    }
  }, [activeWorkspace, isDataLoaded]);

  /* ===================================== */
  /* LISTEN FOR EXTERNAL UPDATES */
  /* ===================================== */
  useEffect(() => {
    const handleWorkspaceUpdate = () => {
      if (activeWorkspace) {
        loadWorkspaceItems(activeWorkspace);
      }
    };

    window.addEventListener("workspaceDataUpdated", handleWorkspaceUpdate);

    return () => {
      window.removeEventListener("workspaceDataUpdated", handleWorkspaceUpdate);
    };
  }, [activeWorkspace]);

  /* ===================================== */
  /* NAVIGATION */
  /* ===================================== */
  const handleNavigateToHome = () => {
    if (onBackToDashboard) {
      onBackToDashboard();
    }
  };

  const handleNewItem = () => {
    localStorage.setItem("selectedWorkspace", activeWorkspace);
    if (onNavigateToDataConnection) {
      onNavigateToDataConnection();
    }
  };

  const handleOpenReport = (item) => {
    console.log("Opening:", item);
    if (onNavigateToReportBuilder) {
      onNavigateToReportBuilder();
    }
  };

  const handleCreateWorkspace = () => {
    if (!newWorkspace.title.trim()) {
      alert("Workspace title required");
      return;
    }

    const workspaceData = {
      id: Date.now(),
      title: newWorkspace.title,
      description: newWorkspace.description
    };

    const updatedWorkspaces = [...workspaces, workspaceData];
    setWorkspaces(updatedWorkspaces);
    localStorage.setItem("allWorkspaces", JSON.stringify(updatedWorkspaces));

    const allWorkspaceData = JSON.parse(localStorage.getItem("workspaceData")) || {};
    allWorkspaceData[newWorkspace.title] = [];
    localStorage.setItem("workspaceData", JSON.stringify(allWorkspaceData));

    setActiveWorkspace(newWorkspace.title);
    setWorkspaceItems([]);
    setShowWorkspaceModal(false);
    setNewWorkspace({ title: "", description: "" });
    // ✅ Ensure sidebar stays closed after creating workspace
    setWorkspaceSidebarOpen(false);
  };

  const handleWorkspaceSwitch = (workspaceTitle) => {
    setActiveWorkspace(workspaceTitle);
    setWorkspaceSidebarOpen(false);
  };

  const handleRefreshItem = (itemId) => {
    const updatedItems = workspaceItems.map((item) =>
      item.id === itemId
        ? { ...item, lastRefreshed: new Date().toLocaleString() }
        : item
    );
    setWorkspaceItems(updatedItems);

    const allWorkspaceData = JSON.parse(localStorage.getItem("workspaceData")) || {};
    allWorkspaceData[activeWorkspace] = updatedItems;
    localStorage.setItem("workspaceData", JSON.stringify(allWorkspaceData));
  };

  const handleDeleteItem = (itemId) => {
    if (!window.confirm("Delete this item?")) {
      return;
    }

    const updatedItems = workspaceItems.filter((item) => item.id !== itemId);
    setWorkspaceItems(updatedItems);

    const allWorkspaceData = JSON.parse(localStorage.getItem("workspaceData")) || {};
    allWorkspaceData[activeWorkspace] = updatedItems;
    localStorage.setItem("workspaceData", JSON.stringify(allWorkspaceData));
  };

  const getIconByType = (type) => {
    switch (type) {
      case "excel":
        return <FaFileExcel />;
      case "csv":
        return <FaFileCsv />;
      case "sql":
        return <FaServer />;
      default:
        return <FaDatabase />;
    }
  };

  const filteredItems = workspaceItems.filter((item) => {
    const matchesKeyword =
      filterKeyword === "" ||
      item.name?.toLowerCase().includes(filterKeyword.toLowerCase());
    const matchesType = filterType === "all" || item.type === filterType;
    return matchesKeyword && matchesType;
  });

  return (
    <div>
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        onNavigateToHome={handleNavigateToHome}
        onNavigateToDataConnection={onNavigateToDataConnection}
        onNavigateToWorkspace={onNavigateToWorkspace}
        onNavigateToFavourites={onNavigateToFavourites}
        onNavigateToReportBuilder={onNavigateToReportBuilder}
      />

      <Navbar sidebarOpen={sidebarOpen} />

      <div className={`workspace-page ${sidebarOpen ? "open" : "closed"}`}>
        <div className="workspace-container">
          
          {/* LOADING STATE */}
          {!isDataLoaded ? (
            <div className="empty-workspace">
              <div className="empty-icon">⏳</div>
              <h3>Loading...</h3>
              <p>Please wait while we load your workspace</p>
            </div>
          ) : (
            <>
              {/* HEADER */}
              <div className="workspace-header">
                <div className="workspace-title-section">
                  <div className="workspace-title-row">
                    <button
                      className="workspace-switch-btn"
                      onClick={() => setWorkspaceSidebarOpen(!workspaceSidebarOpen)}
                    >
                      ☰
                    </button>
                    <div>
                      <h1>{activeWorkspace}</h1>
                      <p className="workspace-subtitle"></p>
                    </div>
                  </div>
                </div>

                <div className="workspace-actions">
                  <button className="action-btn new-item-btn" onClick={() => setShowWorkspaceModal(true)}>
                    <FaPlus /> New Workspace
                  </button>
                </div>
              </div>

              {/* TOOLBAR */}
              <div className="workspace-toolbar">
                <div className="filter-section">
                  <div className="search-filter">
                    <FaFilter />
                    <input
                      type="text"
                      placeholder="Filter by keyword..."
                      value={filterKeyword}
                      onChange={(e) => setFilterKeyword(e.target.value)}
                      className="filter-input"
                    />
                  </div>
                  <select
                    className="type-filter"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="all">All types</option>
                    <option value="excel">Excel</option>
                    <option value="csv">CSV</option>
                    <option value="sql">SQL Server</option>
                    <option value="manual">Manual Entry</option>
                  </select>
                </div>

                <div className="view-options">
                  <button
                    className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
                    onClick={() => setViewMode("grid")}
                  >
                    <FaTh /> Grid
                  </button>
                  <button
                    className={`view-btn ${viewMode === "list" ? "active" : ""}`}
                    onClick={() => setViewMode("list")}
                  >
                    <FaThList /> List
                  </button>
                </div>
              </div>

              {/* OVERLAY - Only render when sidebar is open */}
              {workspaceSidebarOpen && (
                <div
                  className="workspace-sidebar-overlay"
                  onClick={() => setWorkspaceSidebarOpen(false)}
                />
              )}

              {/* WORKSPACE SIDEBAR */}
              <div className={`workspace-sidebar ${workspaceSidebarOpen ? "show" : ""}`}>
                <div className="workspace-sidebar-header">
                  <h3>Workspaces</h3>
                  <button
                    className="close-workspace-sidebar"
                    onClick={() => setWorkspaceSidebarOpen(false)}
                  >
                    ✕
                  </button>
                </div>
                <div className="workspace-list">
                  {workspaces.map((workspace) => (
                    <div
                      key={workspace.id}
                      className={`workspace-list-item ${
                        activeWorkspace === workspace.title ? "active" : ""
                      }`}
                      onClick={() => handleWorkspaceSwitch(workspace.title)}
                    >
                      <div className="workspace-list-title">{workspace.title}</div>
                      <div className="workspace-list-description">{workspace.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* WORKSPACE ITEMS */}
              <div className={`workspace-items ${viewMode}`}>
                {filteredItems.length === 0 ? (
                  viewMode === "list" ? (
                    <div className="workspace-table-wrapper">
                      <div className="workspace-table">
                        <div className="workspace-table-header">
                          <div>Name</div>
                          <div>Status</div>
                          <div>Type</div>
                          <div>Task</div>
                          <div>Owner</div>
                          <div>Refreshed</div>
                          <div>Next Refresh</div>
                        </div>
                        <div className="table-empty-state">
                          <div className="empty-icon">📁</div>
                          <h3>{activeWorkspace} is empty</h3>
                          <p>Add datasets and reports to this workspace</p>
                          <button className="empty-action-btn" onClick={handleNewItem}>
                            <FaPlus /> Add your first item
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="empty-workspace">
                      <div className="empty-icon">📁</div>
                      <h3>{activeWorkspace} is empty</h3>
                      <p>Add datasets and reports to this workspace</p>
                      <button className="empty-action-btn" onClick={handleNewItem}>
                        <FaPlus /> Add your first item
                      </button>
                    </div>
                  )
                ) : viewMode === "list" ? (
                  <div className="workspace-table-wrapper">
                    <div className="workspace-table">
                      <div className="workspace-table-header">
                        <div>Name</div>
                        <div>Status</div>
                        <div>Type</div>
                        <div>Task</div>
                        <div>Owner</div>
                        <div>Refreshed</div>
                        <div>Next Refresh</div>
                      </div>
                      {filteredItems.map((item) => (
                        <div key={item.id} className="workspace-table-row" onClick={() => handleOpenReport(item)}>
                          <div className="table-name-cell">
                            <span className="table-icon">{getIconByType(item.type)}</span>
                            <span>{item.name}</span>
                          </div>
                          <div>{item.status || "—"}</div>
                          <div>{item.itemCategory || item.type || "—"}</div>
                          <div>{item.task || "—"}</div>
                          <div>{item.owner || "—"}</div>
                          <div>{item.lastRefreshed || "—"}</div>
                          <div>{item.nextRefresh || "—"}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  filteredItems.map((item) => (
                    <div key={item.id} className="workspace-item" onClick={() => handleOpenReport(item)}>
                      <div className="item-icon">{getIconByType(item.type)}</div>
                      <div className="item-details">
                        <div className="item-name">{item.name}</div>
                        <div className="item-meta">
                          <span className="item-type">{item.type}</span>
                          {item.rows && <span>{item.rows.toLocaleString()} rows</span>}
                          <span>Refreshed: {item.lastRefreshed}</span>
                        </div>
                      </div>
                      <div className="item-actions">
                        <button
                          className="item-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRefreshItem(item.id);
                          }}
                        >
                          <FaSync />
                        </button>
                        <button
                          className="item-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteItem(item.id);
                          }}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* MODAL */}
      {showWorkspaceModal && (
        <div className="workspace-modal-overlay">
          <div className="workspace-modal">
            <h2>Create Workspace</h2>
            <input
              type="text"
              placeholder="Workspace title"
              value={newWorkspace.title}
              onChange={(e) =>
                setNewWorkspace({ ...newWorkspace, title: e.target.value })
              }
              className="workspace-modal-input"
            />
            <textarea
              placeholder="Workspace description"
              value={newWorkspace.description}
              onChange={(e) =>
                setNewWorkspace({ ...newWorkspace, description: e.target.value })
              }
              className="workspace-modal-textarea"
            />
            <div className="workspace-modal-actions">
              <button
                className="modal-cancel-btn"
                onClick={() => setShowWorkspaceModal(false)}
              >
                Cancel
              </button>
              <button className="modal-create-btn" onClick={handleCreateWorkspace}>
                Create Workspace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkspacePage;