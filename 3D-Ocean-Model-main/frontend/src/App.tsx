import { useEffect, useState } from 'react';
import SceneViewer from './components/SceneViewer/SceneViewer';
import OceanLeafletMap from './components/LeafletViewer/OceanLeafletMap';
import PointInspectorPanel from './components/Inspector/PointInspectorPanel';
import GoogleApiKeyModal from './components/common/GoogleApiKeyModal';
import LayersPanel from './components/ControlsPanel/LayersPanel';
import FloatProfileCard from './components/ProfileCard/FloatProfileCard';
import ArgoFullProfileModal from './components/ProfileCard/ArgoFullProfileModal';
import GliderProfileModal from './components/ProfileCard/GliderProfileModal';
import DataSourcesModal from './components/common/DataSourcesModal';
import LoadingOverlay from './components/common/LoadingOverlay';
import ToastNotification from './components/common/ToastNotification';
import OutreachGuide from './components/common/OutreachGuide';
import WebGL2Fallback, { isWebGL2Available } from './components/common/WebGL2Fallback';
import LandingPage from './components/Landing/LandingPage';
import OfficerLogin from './components/Login/OfficerLogin';
import { useOceanStore } from './stores/oceanStore';
import { checkHealth } from './services/api';

export default function App() {
  const [webgl2Supported, setWebgl2Supported] = useState<boolean>(() => isWebGL2Available());
  const showToast = useOceanStore((s) => s.showToast);
  const viewMode = useOceanStore((s) => s.viewMode);
  const isAuthenticated = useOceanStore((s) => s.isAuthenticated);
  const officerName = useOceanStore((s) => s.officerName);
  const logout = useOceanStore((s) => s.logout);
  const dataSourcesModalOpen = useOceanStore((s) => s.dataSourcesModalOpen);
  const setDataSourcesModalOpen = useOceanStore((s) => s.setDataSourcesModalOpen);
  const pageView = useOceanStore((s) => s.pageView);
  const setPageView = useOceanStore((s) => s.setPageView);

  useEffect(() => {
    let mounted = true;
    const verifyBackend = async () => {
      try {
        await checkHealth();
      } catch (err) {
        if (!mounted) return;

      }
    };

    verifyBackend();
    const interval = setInterval(verifyBackend, 12000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [showToast]);

  // 1. Initial Gate: Officer must login first
  if (!isAuthenticated) {
    return <OfficerLogin />;
  }

  // 2. Executive Briefing & Information Landing Page (after login, before main page)
  if (pageView === 'landing') {
    return (
      <LandingPage
        onLaunch={() => setPageView('dashboard')}
        onLogout={logout}
        isAuthenticated={isAuthenticated}
        officerName={officerName}
      />
    );
  }

  if (!webgl2Supported && viewMode !== 'map2d') {
    return (
      <div className="app-container">
        <WebGL2Fallback onRetry={() => setWebgl2Supported(isWebGL2Available())} />
      </div>
    );
  }

  return (
    <div
      className="app-container"
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#030712',
      }}
    >

      {/* Officer Session Top Badge & Logout */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '6px 14px',
          background: 'rgba(7, 17, 36, 0.88)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '9999px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 15px rgba(6, 182, 212, 0.15)',
          fontSize: '12px',
          color: '#e2e8f0',
        }}
      >
        <button
          onClick={() => setPageView('landing')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#38bdf8',
            cursor: 'pointer',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#7dd3fc')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#38bdf8')}
          title="Return to Landing Page & Overview"
        >
          <span>← Overview</span>
        </button>
        <span style={{ color: '#334155' }}>|</span>
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#10b981',
            display: 'inline-block',
            boxShadow: '0 0 8px #10b981',
          }}
        />
        <span style={{ fontWeight: 600, color: '#f1f5f9', letterSpacing: '0.02em' }}>
          {officerName}
        </span>
        <span style={{ color: '#475569' }}>|</span>
        <button
          onClick={() => logout()}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 500,
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
          title="Sign out of Officer Portal"
        >
          Sign Out
        </button>
      </div>

      {viewMode === 'map2d' ? (
        <OceanLeafletMap />
      ) : (
        <SceneViewer />
      )}

      <LayersPanel />

      <FloatProfileCard />

      <PointInspectorPanel />

      <GoogleApiKeyModal />

      <ArgoFullProfileModal />
      <GliderProfileModal />
      <DataSourcesModal
        isOpen={dataSourcesModalOpen}
        onClose={() => setDataSourcesModalOpen(false)}
      />

      <LoadingOverlay />
      <ToastNotification />
      <OutreachGuide />
    </div>
  );
}
