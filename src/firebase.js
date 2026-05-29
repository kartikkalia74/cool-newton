import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  getFirestore
} from 'firebase/firestore';

// Helper to check if configuration looks valid
const isValidConfig = (config) => {
  return config && config.apiKey && config.projectId && config.authDomain;
};

// Try to load config from Env or LocalStorage
const getFirebaseConfig = () => {
  const envConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  if (isValidConfig(envConfig)) {
    return { config: envConfig, source: 'env' };
  }

  try {
    const localSaved = localStorage.getItem('COOL_TRACKER_FIREBASE_CONFIG');
    if (localSaved) {
      const parsed = JSON.parse(localSaved);
      if (isValidConfig(parsed)) {
        return { config: parsed, source: 'local' };
      }
    }
  } catch (e) {
    console.error("Error parsing saved Firebase config", e);
  }

  return { config: null, source: 'none' };
};

const { config, source } = getFirebaseConfig();

let app = null;
let auth = null;
let db = null;
let isMock = true;

if (config) {
  try {
    // Prevent duplicate initialization
    app = getApps().length === 0 ? initializeApp(config) : getApp();
    
    // Initialize Firestore with robust multi-tab offline persistence
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });

    auth = getAuth(app);
    isMock = false;
    console.log(`Firebase successfully initialized via source: ${source}`);
  } catch (err) {
    console.error("Firebase initialization failed. Falling back to Local Mock Mode.", err);
  }
}

// ==========================================
// LOCAL MOCK BACKEND FOR ZERO-CONFIG DEMO
// ==========================================
// If Firebase isn't configured, we simulate authentication and database changes
// in LocalStorage, matching the Firebase SDK signatures exactly.
class MockAuth {
  constructor() {
    this.listeners = [];
    this.currentUser = JSON.parse(localStorage.getItem('MOCK_AUTH_USER')) || null;
    
    // Simulate async auth state emission
    setTimeout(() => {
      this._emit();
    }, 100);
  }

  onAuthStateChanged(callback) {
    this.listeners.push(callback);
    callback(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  async signInWithEmailAndPassword(email, password) {
    // Generate a simple mock user
    const mockUser = {
      uid: 'mock-user-123',
      email: email,
      displayName: email.split('@')[0],
      isAnonymous: false,
    };
    this.currentUser = mockUser;
    localStorage.setItem('MOCK_AUTH_USER', JSON.stringify(mockUser));
    this._emit();
    return { user: mockUser };
  }

  async createUserWithEmailAndPassword(email, password) {
    return this.signInWithEmailAndPassword(email, password);
  }

  async signOut() {
    this.currentUser = null;
    localStorage.removeItem('MOCK_AUTH_USER');
    this._emit();
  }

  _emit() {
    this.listeners.forEach(cb => cb(this.currentUser));
  }
}

const mockAuthInstance = new MockAuth();

export const firebaseAuth = {
  signIn: async (email, password) => {
    if (isMock) return mockAuthInstance.signInWithEmailAndPassword(email, password);
    return signInWithEmailAndPassword(auth, email, password);
  },
  signUp: async (email, password) => {
    if (isMock) return mockAuthInstance.createUserWithEmailAndPassword(email, password);
    return createUserWithEmailAndPassword(auth, email, password);
  },
  signOut: async () => {
    if (isMock) return mockAuthInstance.signOut();
    return signOut(auth);
  },
  onAuthStateChanged: (callback) => {
    if (isMock) return mockAuthInstance.onAuthStateChanged(callback);
    return onAuthStateChanged(auth, callback);
  }
};

export { app, auth, db, isMock };
export const saveClientFirebaseConfig = (newConfig) => {
  if (isValidConfig(newConfig)) {
    localStorage.setItem('COOL_TRACKER_FIREBASE_CONFIG', JSON.stringify(newConfig));
    return true;
  }
  return false;
};
export const clearClientFirebaseConfig = () => {
  localStorage.removeItem('COOL_TRACKER_FIREBASE_CONFIG');
};
