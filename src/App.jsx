import React, { useState, useEffect } from 'react';
import { firebaseAuth, isMock, saveClientFirebaseConfig, clearClientFirebaseConfig } from './firebase';
import { useSyncData } from './hooks/useSyncData';
import Auth from './components/Auth';
import Timer from './components/Timer';
import TaskList from './components/TaskList';
import Analytics from './components/Analytics';
import { 
  Clock, 
  ListTodo, 
  BarChart3, 
  LogOut, 
  Sun, 
  Moon, 
  Settings, 
  WifiOff, 
  Check, 
  HelpCircle,
  X,
  AlertCircle
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timer'); // 'timer' | 'tasks' | 'analytics'
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [showConfigModal, setShowConfigModal] = useState(false);
  
  // Custom states for Dynamic Firebase config injection
  const [apiKey, setApiKey] = useState('');
  const [authDomain, setAuthDomain] = useState('');
  const [projectId, setProjectId] = useState('');
  const [storageBucket, setStorageBucket] = useState('');
  const [messagingSenderId, setMessagingSenderId] = useState('');
  const [appId, setAppId] = useState('');
  const [configSuccess, setConfigSuccess] = useState(false);

  // Monitor Authentication State
  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged((currUser) => {
      setUser(currUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // Sync state database hook
  const {
    tasks,
    timeLogs,
    activeTimer,
    categories,
    loading: dbLoading,
    syncError,
    addTask,
    toggleTask,
    deleteTask,
    startTimer,
    pauseTimer,
    resetTimer,
    saveTimeLog,
    deleteTimeLog,
    addCategory,
    deleteCategory
  } = useSyncData(user);

  // Theme Sync
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Load existing client firebase credentials if any in state inputs
  useEffect(() => {
    try {
      const saved = localStorage.getItem('COOL_TRACKER_FIREBASE_CONFIG');
      if (saved) {
        const parsed = JSON.parse(saved);
        setApiKey(parsed.apiKey || '');
        setAuthDomain(parsed.authDomain || '');
        setProjectId(parsed.projectId || '');
        setStorageBucket(parsed.storageBucket || '');
        setMessagingSenderId(parsed.messagingSenderId || '');
        setAppId(parsed.appId || '');
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleSignOut = async () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      await firebaseAuth.signOut();
    }
  };

  // Launch offline local testing
  const handleLaunchMockDemo = async () => {
    await firebaseAuth.signIn("demo-user@coolnewton.local", "demopass");
  };

  const handleSaveFirebaseConfig = (e) => {
    e.preventDefault();
    const newConfig = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim()
    };

    const success = saveClientFirebaseConfig(newConfig);
    if (success) {
      setConfigSuccess(true);
      setTimeout(() => {
        setConfigSuccess(false);
        setShowConfigModal(false);
        // Reload page to reinitialize Firebase instance
        window.location.reload();
      }, 1000);
    } else {
      alert("Invalid configuration keys. Please ensure API Key, Project ID and Auth Domain are filled.");
    }
  };

  const handleClearFirebaseConfig = () => {
    if (window.confirm("Disconnect Firebase? This will return the application to local offline mode.")) {
      clearClientFirebaseConfig();
      window.location.reload();
    }
  };

  // Trigger timer from Task Board list directly
  const handleStartTrackingTask = (task) => {
    setActiveTab('timer');
    startTimer(task.id, task.title, task.category || 'Work');
  };

  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'hsl(var(--background))',
        color: 'hsl(var(--muted))',
        fontFamily: 'var(--font-sans)',
        fontSize: '1.1rem',
        fontWeight: 600
      }}>
        <span>Loading Application...</span>
      </div>
    );
  }

  // Not logged in -> Show Authentication Wall
  if (!user) {
    return (
      <div className="glass-container">
        {/* Float Config Button on Auth Wall */}
        <button 
          onClick={() => setShowConfigModal(true)}
          className="btn btn-secondary btn-icon"
          style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 100 }}
          title="Configure Database Connection"
        >
          <Settings size={18} />
        </button>

        <Auth onMockDemoStart={handleLaunchMockDemo} />

        {/* Dynamic Firebase Injector Modal */}
        {showConfigModal && (
          <ConfigModal 
            apiKey={apiKey} setApiKey={setApiKey}
            authDomain={authDomain} setAuthDomain={setAuthDomain}
            projectId={projectId} setProjectId={setProjectId}
            storageBucket={storageBucket} setStorageBucket={setStorageBucket}
            messagingSenderId={messagingSenderId} setMessagingSenderId={setMessagingSenderId}
            appId={appId} setAppId={setAppId}
            onSave={handleSaveFirebaseConfig}
            onClear={handleClearFirebaseConfig}
            onClose={() => setShowConfigModal(false)}
            success={configSuccess}
          />
        )}
      </div>
    );
  }

  return (
    <div className="glass-container">
      {/* 1. Header Toolbar */}
      <header className="nav-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)',
            color: 'white',
          }}>
            <Clock size={18} />
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
            CoolNewton <span style={{ fontWeight: 400, color: 'hsl(var(--muted))' }}>Tracker</span>
          </h2>
        </div>

        {/* Desktop Navigation Tabs */}
        <div className="desktop-tabs">
          <button 
            className={`desktop-tab-btn ${activeTab === 'timer' ? 'active' : ''}`}
            onClick={() => setActiveTab('timer')}
          >
            Stopwatch
          </button>
          <button 
            className={`desktop-tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            Tasks
          </button>
          <button 
            className={`desktop-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button>
        </div>

        <div className="nav-actions">
          {/* Theme switcher */}
          <button 
            onClick={toggleTheme} 
            className="btn btn-secondary btn-icon"
            style={{ width: '36px', height: '36px' }}
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Database Setup Button */}
          <button 
            onClick={() => setShowConfigModal(true)} 
            className="btn btn-secondary btn-icon"
            style={{ 
              width: '36px', 
              height: '36px',
              color: isMock ? 'hsl(var(--warning))' : 'hsl(var(--primary))',
              borderColor: isMock ? 'rgba(234, 179, 8, 0.3)' : 'transparent'
            }}
            title="Database Connection Settings"
          >
            <Settings size={16} />
          </button>

          {/* User Email & Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              fontSize: '0.8rem', 
              color: 'hsl(var(--muted))', 
              fontWeight: 600,
              maxWidth: '120px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'inline-block'
            }} className="desktop-tabs">
              {user.email}
            </span>
            <button 
              onClick={handleSignOut} 
              className="btn btn-secondary btn-icon btn-danger"
              style={{ width: '36px', height: '36px' }}
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Sync Offline warning banner */}
      {isMock && (
        <div style={{
          background: 'rgba(234, 179, 8, 0.08)',
          borderBottom: '1px solid rgba(234, 179, 8, 0.15)',
          padding: '10px 16px',
          fontSize: '0.82rem',
          fontWeight: 600,
          color: 'hsl(var(--warning))',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          textAlign: 'center'
        }}>
          <WifiOff size={14} style={{ flexShrink: 0 }} />
          <span><strong>Local Offline Mode:</strong> Your data is saved locally to this browser only. </span>
          <button 
            onClick={() => setShowConfigModal(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'hsl(var(--warning))',
              textDecoration: 'underline',
              fontWeight: 700,
              cursor: 'pointer',
              padding: 0
            }}
          >
            Connect Firebase Firestore
          </button>
          <span> to enable cloud sync across all of your browsers and devices.</span>
        </div>
      )}

      {/* 2.5. Firestore Sync Error Banner */}
      {!isMock && syncError && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          borderBottom: '1px solid rgba(239, 68, 68, 0.15)',
          padding: '12px 16px',
          fontSize: '0.85rem',
          fontWeight: 600,
          color: 'hsl(var(--danger))',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          textAlign: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span><strong>Database Sync Failed:</strong> {syncError}</span>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'hsl(var(--muted))', maxWidth: '700px' }}>
            This usually happens if your Firestore Security Rules block access or standard credentials are not configured.
            Ensure you have allowed authenticated owner read/writes under <code>/users/{"{userId}"}</code>.
          </span>
        </div>
      )}

      {/* 3. Main Dashboard grid container */}
      <main className="dashboard-grid">
        {/* Render loading state for database sync */}
        {dbLoading ? (
          <div style={{
            gridColumn: '1 / -1',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 20px',
            color: 'hsl(var(--muted))',
            fontWeight: 500,
            gap: '16px'
          }}>
            <span>Syncing database with Firestore...</span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => window.location.reload()}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '8px 16px' }}
              >
                Retry Connection
              </button>
              <button 
                onClick={() => setShowConfigModal(true)}
                className="btn btn-secondary btn-danger"
                style={{ fontSize: '0.8rem', padding: '8px 16px' }}
              >
                Adjust Firebase Settings
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* View Dispatcher based on active tab */}
            {activeTab === 'timer' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <Timer 
                  activeTimer={activeTimer} 
                  tasks={tasks}
                  categories={categories}
                  startTimer={startTimer}
                  pauseTimer={pauseTimer}
                  resetTimer={resetTimer}
                  saveTimeLog={saveTimeLog}
                  addCategory={addCategory}
                  deleteCategory={deleteCategory}
                />
              </div>
            )}

            {activeTab === 'tasks' && (
              <TaskList 
                tasks={tasks}
                timeLogs={timeLogs}
                categories={categories}
                addTask={addTask}
                toggleTask={toggleTask}
                deleteTask={deleteTask}
                onStartTrackingTask={handleStartTrackingTask}
                addCategory={addCategory}
                deleteCategory={deleteCategory}
              />
            )}

            {activeTab === 'analytics' && (
              <Analytics 
                timeLogs={timeLogs}
                tasks={tasks}
                categories={categories}
                deleteTimeLog={deleteTimeLog}
              />
            )}

            {/* Desktop side view helper: Show analytics history sidebar side-by-side on wide screens */}
            <div className="desktop-tabs" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {activeTab === 'timer' && (
                <TaskList 
                  tasks={tasks}
                  timeLogs={timeLogs}
                  categories={categories}
                  addTask={addTask}
                  toggleTask={toggleTask}
                  deleteTask={deleteTask}
                  onStartTrackingTask={handleStartTrackingTask}
                  addCategory={addCategory}
                  deleteCategory={deleteCategory}
                />
              )}
              {activeTab === 'tasks' && (
                <Analytics 
                  timeLogs={timeLogs}
                  tasks={tasks}
                  categories={categories}
                  deleteTimeLog={deleteTimeLog}
                />
              )}
              {activeTab === 'analytics' && (
                <div style={{ display: 'flex', flexGrow: 1 }} />
              )}
            </div>
          </>
        )}
      </main>

      {/* 4. Mobile Bottom navigation tabs */}
      <nav className="mobile-nav-bar">
        <button 
          className={`mobile-nav-item ${activeTab === 'timer' ? 'active' : ''}`}
          onClick={() => setActiveTab('timer')}
        >
          <Clock size={20} />
          <span>Stopwatch</span>
        </button>
        <button 
          className={`mobile-nav-item ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          <ListTodo size={20} />
          <span>Tasks</span>
        </button>
        <button 
          className={`mobile-nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 size={20} />
          <span>Analytics</span>
        </button>
      </nav>

      {/* 5. Firebase Dynamic Injection Modal */}
      {showConfigModal && (
        <ConfigModal 
          apiKey={apiKey} setApiKey={setApiKey}
          authDomain={authDomain} setAuthDomain={setAuthDomain}
          projectId={projectId} setProjectId={setProjectId}
          storageBucket={storageBucket} setStorageBucket={setStorageBucket}
          messagingSenderId={messagingSenderId} setMessagingSenderId={setMessagingSenderId}
          appId={appId} setAppId={setAppId}
          onSave={handleSaveFirebaseConfig}
          onClear={handleClearFirebaseConfig}
          onClose={() => setShowConfigModal(false)}
          success={configSuccess}
        />
      )}
    </div>
  );
}

// Config Modal Component
function ConfigModal({
  apiKey, setApiKey,
  authDomain, setAuthDomain,
  projectId, setProjectId,
  storageBucket, setStorageBucket,
  messagingSenderId, setMessagingSenderId,
  appId, setAppId,
  onSave,
  onClear,
  onClose,
  success
}) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0.65)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: '20px'
    }}>
      <div className="glass-card" style={{
        maxWidth: '520px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '30px',
        position: 'relative',
        animation: 'fadeIn 0.3s ease'
      }}>
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="btn btn-secondary btn-icon"
          style={{ position: 'absolute', top: '16px', right: '16px', width: '32px', height: '32px', border: 'none' }}
        >
          <X size={14} />
        </button>

        <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>
          Connect Syncing Backend
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted))', marginBottom: '20px' }}>
          Connect your own **Firebase Project (Spark Free Tier)** keys to unlock secure global synchronization across all laptops and mobile devices!
        </p>

        {success ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 0',
            color: 'hsl(var(--success))',
            gap: '12px'
          }}>
            <Check size={48} strokeWidth={3} />
            <span style={{ fontWeight: 700 }}>Connection Keys Saved! Reloading app...</span>
          </div>
        ) : (
          <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
            <div className="input-group">
              <label>API Key *</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="AIzaSyA..."
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)} 
                required 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="input-group">
                <label>Project ID *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="my-tracker-app"
                  value={projectId} 
                  onChange={(e) => setProjectId(e.target.value)} 
                  required 
                />
              </div>

              <div className="input-group">
                <label>Auth Domain *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="my-tracker-app.firebaseapp.com"
                  value={authDomain} 
                  onChange={(e) => setAuthDomain(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <div className="input-group">
              <label>Storage Bucket</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="my-tracker-app.appspot.com"
                value={storageBucket} 
                onChange={(e) => setStorageBucket(e.target.value)} 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="input-group">
                <label>Messaging Sender ID</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="8291048291..."
                  value={messagingSenderId} 
                  onChange={(e) => setMessagingSenderId(e.target.value)} 
                />
              </div>

              <div className="input-group">
                <label>App ID</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="1:829104:web:e391b..."
                  value={appId} 
                  onChange={(e) => setAppId(e.target.value)} 
                />
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              color: 'hsl(var(--muted))',
              background: 'hsl(var(--secondary))',
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '10px',
              fontWeight: 500
            }}>
              <HelpCircle size={14} style={{ flexShrink: 0 }} />
              <span>You can find these values inside your **Firebase Console &rarr; Project Settings &rarr; General &rarr; Your Web App configuration script** block.</span>
            </div>

            <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '10px' }}>
              {localStorage.getItem('COOL_TRACKER_FIREBASE_CONFIG') && (
                <button 
                  type="button" 
                  onClick={onClear} 
                  className="btn btn-secondary btn-danger"
                  style={{ padding: '12px' }}
                >
                  Disconnect
                </button>
              )}
              
              <button 
                type="button" 
                onClick={onClose} 
                className="btn btn-secondary"
                style={{ flexGrow: 1, padding: '12px' }}
              >
                Cancel
              </button>

              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ flexGrow: 1, padding: '12px' }}
              >
                Save & Connect
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
