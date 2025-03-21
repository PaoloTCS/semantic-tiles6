// /Users/paolopignatelli/VerbumTechnologies/Verbum7-Claude/frontend/src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import BreadcrumbNav from './components/BreadcrumbNav';
import VoronoiDiagram from './components/VoronoiDiagram';
import DomainForm from './components/DomainForm';
import DocumentPanel from './components/DocumentPanel';
import DocumentUpload from './components/DocumentUpload';
import ErrorBoundary from './components/ErrorBoundary';
import { fetchDomains, addDomain, deleteDomain, fetchDomainPath } from './services/apiService';
import './styles/App.css';

function App() {
  // State for domains at the current level
  const [domains, setDomains] = useState([]);
  
  // State for semantic distances
  const [semanticDistances, setSemanticDistances] = useState({});
  
  // Current parent ID (null for root level)
  const [currentParentId, setCurrentParentId] = useState(null);
  
  // Current domain details
  const [currentDomain, setCurrentDomain] = useState(null);
  
  // Breadcrumb path
  const [breadcrumbPath, setBreadcrumbPath] = useState([]);
  
  // Current document for document panel
  const [currentDocument, setCurrentDocument] = useState(null);
  
  // Loading state
  const [loading, setLoading] = useState(false);
  
  // Error state
  const [error, setError] = useState(null);
  
  // Diagram dimensions
  const diagramWidth = 800;
  const diagramHeight = 600;
  
  // Load domains from API (memoized to prevent unnecessary rerenders)
  const loadDomains = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchDomains(currentParentId);
      setDomains(data.domains || []);
      setSemanticDistances(data.semanticDistances || {});
      
      // If we have domain data, cache it in sessionStorage for resilience
      if (data.domains && data.domains.length > 0) {
        sessionStorage.setItem(`domains:${currentParentId || 'root'}`, JSON.stringify(data.domains));
        sessionStorage.setItem(`distances:${currentParentId || 'root'}`, JSON.stringify(data.semanticDistances || {}));
      }
    } catch (err) {
      console.error('Error loading domains:', err);
      
      // Try to load from cache if available
      const cachedDomains = sessionStorage.getItem(`domains:${currentParentId || 'root'}`);
      const cachedDistances = sessionStorage.getItem(`distances:${currentParentId || 'root'}`);
      
      if (cachedDomains) {
        setDomains(JSON.parse(cachedDomains));
        setSemanticDistances(cachedDistances ? JSON.parse(cachedDistances) : {});
        setError('Using cached data due to connection error. Some information may be outdated.');
      } else {
        // More specific error messages based on error type
        if (err.response && err.response.status === 401) {
          setError('Authentication error. Please check your API key.');
        } else if (err.code === 'ECONNABORTED' || !err.response) {
          setError('Network error. Please check your connection to the backend server.');
        } else {
          setError(`Failed to load domains: ${err.response?.data?.error || 'Unknown error'}`);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [currentParentId]);
  
  // Load domain path for breadcrumbs
  const loadDomainPath = useCallback(async () => {
    if (!currentParentId) return;
    
    try {
      const path = await fetchDomainPath(currentParentId);
      setBreadcrumbPath(path);
      
      // Set current domain
      if (path.length > 0) {
        setCurrentDomain(path[path.length - 1]);
        
        // Cache the path for resilience
        sessionStorage.setItem(`path:${currentParentId}`, JSON.stringify(path));
      }
    } catch (err) {
      console.error('Error loading domain path:', err);
      
      // Try to load from cache
      const cachedPath = sessionStorage.getItem(`path:${currentParentId}`);
      if (cachedPath) {
        const parsedPath = JSON.parse(cachedPath);
        setBreadcrumbPath(parsedPath);
        
        if (parsedPath.length > 0) {
          setCurrentDomain(parsedPath[parsedPath.length - 1]);
        }
      }
    }
  }, [currentParentId]);
  
  // Load domains at the current level
  useEffect(() => {
    loadDomains();
  }, [loadDomains]);
  
  // Load domain path when parent changes
  useEffect(() => {
    if (currentParentId) {
      loadDomainPath();
    } else {
      setBreadcrumbPath([]);
      setCurrentDomain(null);
    }
  }, [currentParentId, loadDomainPath]);
  
  // Handle adding a new domain
  const handleAddDomain = async (name, description = '') => {
    try {
      await addDomain(name, currentParentId, description);
      
      // Refresh domains
      loadDomains();
    } catch (err) {
      console.error('Error adding domain:', err);
      setError('Failed to add domain. Please try again.');
    }
  };
  
  // Handle deleting a domain
  const handleDeleteDomain = async (domainId) => {
    try {
      await deleteDomain(domainId);
      
      // Refresh domains
      loadDomains();
    } catch (err) {
      console.error('Error deleting domain:', err);
      setError('Failed to delete domain. Please try again.');
    }
  };
  
  // Handle domain click for drill-down
  const handleDomainClick = (domain) => {
    setCurrentParentId(domain.id);
  };
  
  // Handle document click
  const handleDocumentClick = (document) => {
    setCurrentDocument(document);
  };
  
  // Handle breadcrumb navigation
  const handleBreadcrumbClick = (domainId) => {
    setCurrentParentId(domainId);
  };
  
  // Handle closing the document panel
  const handleCloseDocumentPanel = () => {
    setCurrentDocument(null);
  };
  
  // Handle document upload completion
  const handleDocumentUpload = () => {
    loadDomains();
  };
  
  return (
    <ErrorBoundary>
      <div className="app-container">
        <header className="app-header">
          <div className="container">
            <h1 className="app-title">Semantic Tiles - Knowledge Map</h1>
          </div>
        </header>
        
        <main className="main-content">
          <div className="container">
            {/* Breadcrumb navigation */}
            <ErrorBoundary fallback={<div>Error loading navigation. <button onClick={() => setCurrentParentId(null)}>Return to root</button></div>}>
              <BreadcrumbNav 
                path={breadcrumbPath} 
                onNavigate={handleBreadcrumbClick} 
              />
            </ErrorBoundary>
            
            {/* Domain form */}
            <ErrorBoundary fallback={<div>Error in domain form component</div>}>
              <DomainForm onAdd={handleAddDomain} />
            </ErrorBoundary>
            
            {/* Document upload form (only visible when inside a domain) */}
            {currentDomain && (
              <ErrorBoundary fallback={<div>Error in document upload component</div>}>
                <DocumentUpload 
                  domainId={currentDomain.id} 
                  onUploadComplete={handleDocumentUpload}
                />
              </ErrorBoundary>
            )}
            
            {/* Error message */}
            {error && (
              <div className="error-message">
                {error}
                {error.includes('connection') && 
                  <button 
                    className="retry-button" 
                    onClick={loadDomains}
                  >
                    Retry
                  </button>
                }
              </div>
            )}
            
            {/* Loading indicator */}
            {loading ? (
              <div className="loading-indicator">
                <div className="spinner"></div>
                <p>Loading domains...</p>
              </div>
            ) : (
              <ErrorBoundary fallback={<div>Error displaying knowledge map. <button onClick={loadDomains}>Reload</button></div>}>
                {/* Voronoi diagram */}
                {domains.length > 0 ? (
                  <VoronoiDiagram
                    domains={domains}
                    semanticDistances={semanticDistances}
                    width={diagramWidth}
                    height={diagramHeight}
                    onDomainClick={handleDomainClick}
                    onDocumentClick={handleDocumentClick}
                    onDeleteDomain={handleDeleteDomain}
                  />
                ) : (
                  <div className="empty-diagram">
                    <p>No domains at this level. Add your first domain!</p>
                  </div>
                )}
              </ErrorBoundary>
            )}
          </div>
        </main>
        
        {/* Document panel */}
        <ErrorBoundary fallback={<div className="document-panel-error">Error displaying document</div>}>
          <DocumentPanel
            document={currentDocument}
            onClose={handleCloseDocumentPanel}
            isLoading={currentDocument && !currentDocument.summary}
          />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}

export default App;