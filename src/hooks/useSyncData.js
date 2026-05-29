import { useState, useEffect, useCallback } from 'react';
import { db, isMock } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  limit
} from 'firebase/firestore';

const DEFAULT_CATEGORIES = [
  { name: 'Work', color: '#8b5cf6' },
  { name: 'Study', color: '#06b6d4' },
  { name: 'Design', color: '#ec4899' },
  { name: 'Admin', color: '#eab308' },
  { name: 'Personal', color: '#10b981' }
];

export const useSyncData = (user) => {
  const [tasks, setTasks] = useState([]);
  const [timeLogs, setTimeLogs] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [activeTimer, setActiveTimer] = useState({
    isRunning: false,
    startTime: null,
    pausedSeconds: 0,
    taskId: null,
    taskTitle: '',
    category: 'Work'
  });
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState(null);

  const uid = user ? user.uid : null;

  // ==========================================
  // 1. MOCK DATA SYNC ENGINE (LOCAL STORAGE)
  // ==========================================
  const loadMockData = useCallback(() => {
    if (!uid) return;
    try {
      const mockTasks = JSON.parse(localStorage.getItem(`mock_tasks_${uid}`)) || [];
      const mockLogs = JSON.parse(localStorage.getItem(`mock_logs_${uid}`)) || [];
      const mockCategories = JSON.parse(localStorage.getItem(`mock_categories_${uid}`)) || DEFAULT_CATEGORIES;
      const mockTimer = JSON.parse(localStorage.getItem(`mock_timer_${uid}`)) || {
        isRunning: false,
        startTime: null,
        pausedSeconds: 0,
        taskId: null,
        taskTitle: '',
        category: 'Work'
      };
      
      setTasks(mockTasks);
      setTimeLogs(mockLogs);
      setCategories(mockCategories);
      setActiveTimer(mockTimer);
    } catch (e) {
      console.error("Failed to load mock data", e);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  // Handle multi-tab syncing in mock mode via storage events
  useEffect(() => {
    if (!isMock || !uid) return;
    
    loadMockData();

    const handleStorageChange = (e) => {
      if (
        e.key === `mock_tasks_${uid}` || 
        e.key === `mock_logs_${uid}` || 
        e.key === `mock_timer_${uid}` ||
        e.key === `mock_categories_${uid}`
      ) {
        loadMockData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [uid, loadMockData]);

  // ==========================================
  // 2. REAL FIREBASE SNAPSHOT ENGINE
  // ==========================================
  useEffect(() => {
    if (isMock || !uid) {
      if (!uid) setLoading(false);
      setSyncError(null);
      return;
    }

    setLoading(true);
    setSyncError(null);

    // Sync tasks
    const tasksQuery = query(
      collection(db, `users/${uid}/tasks`),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const tasksData = [];
      snapshot.forEach((doc) => {
        tasksData.push({ id: doc.id, ...doc.data() });
      });
      setTasks(tasksData);
      setLoading(false);
    }, (err) => {
      console.error("Error subscribing to tasks: ", err);
      setSyncError(err.message || "Failed to sync tasks with database.");
      setLoading(false);
    });

    // Sync time logs
    const logsQuery = query(
      collection(db, `users/${uid}/timeLogs`),
      orderBy('timestamp', 'desc'),
      limit(100) // Show last 100 logs
    );

    const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
      const logsData = [];
      snapshot.forEach((doc) => {
        logsData.push({ id: doc.id, ...doc.data() });
      });
      setTimeLogs(logsData);
    }, (err) => {
      console.error("Error subscribing to time logs: ", err);
      setSyncError(err.message || "Failed to sync time logs with database.");
      setLoading(false);
    });

    // Sync active running timer
    const timerDocRef = doc(db, `users/${uid}/activeTimer`, 'state');
    const unsubscribeTimer = onSnapshot(timerDocRef, (snapshot) => {
      if (snapshot.exists()) {
        setActiveTimer(snapshot.data());
      } else {
        // Initialize default timer document if missing
        const defaultTimer = {
          isRunning: false,
          startTime: null,
          pausedSeconds: 0,
          taskId: null,
          taskTitle: '',
          category: 'Work'
        };
        setDoc(timerDocRef, defaultTimer);
        setActiveTimer(defaultTimer);
      }
    }, (err) => {
      console.error("Error subscribing to active timer: ", err);
      setSyncError(err.message || "Failed to sync timer state with database.");
      setLoading(false);
    });

    // Sync custom categories
    const categoriesQuery = query(
      collection(db, `users/${uid}/categories`)
    );
    const unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot) => {
      if (!snapshot.empty) {
        const categoriesData = [];
        snapshot.forEach((doc) => {
          categoriesData.push({ name: doc.id, ...doc.data() });
        });
        setCategories(categoriesData);
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }
    }, (err) => {
      console.error("Error subscribing to categories: ", err);
      setSyncError(err.message || "Failed to sync categories with database.");
      setLoading(false);
    });

    return () => {
      unsubscribeTasks();
      unsubscribeLogs();
      unsubscribeTimer();
      unsubscribeCategories();
    };
  }, [uid]);

  // ==========================================
  // 3. DATABASE WRITE MUTATIONS
  // ==========================================

  // Task Mutations
  const addTask = useCallback(async (title, category) => {
    if (!uid) return;
    const newTask = {
      title,
      category: category || 'Work',
      completed: false,
      createdAt: new Date().toISOString()
    };

    if (isMock) {
      const updatedTasks = [
        { id: 'mock-task-' + Date.now(), ...newTask },
        ...tasks
      ];
      localStorage.setItem(`mock_tasks_${uid}`, JSON.stringify(updatedTasks));
      setTasks(updatedTasks);
    } else {
      await addDoc(collection(db, `users/${uid}/tasks`), newTask);
    }
  }, [uid, tasks]);

  const toggleTask = useCallback(async (taskId, completed) => {
    if (!uid) return;
    if (isMock) {
      const updatedTasks = tasks.map(t => 
        t.id === taskId ? { ...t, completed } : t
      );
      localStorage.setItem(`mock_tasks_${uid}`, JSON.stringify(updatedTasks));
      setTasks(updatedTasks);
    } else {
      const taskRef = doc(db, `users/${uid}/tasks`, taskId);
      await updateDoc(taskRef, { completed });
    }
  }, [uid, tasks]);

  const deleteTask = useCallback(async (taskId) => {
    if (!uid) return;
    if (isMock) {
      const updatedTasks = tasks.filter(t => t.id !== taskId);
      localStorage.setItem(`mock_tasks_${uid}`, JSON.stringify(updatedTasks));
      setTasks(updatedTasks);
    } else {
      const taskRef = doc(db, `users/${uid}/tasks`, taskId);
      await deleteDoc(taskRef);
    }
  }, [uid, tasks]);

  // Timer Mutations
  const startTimer = useCallback(async (taskId = null, taskTitle = '', category = 'Work') => {
    if (!uid) return;
    const timerState = {
      isRunning: true,
      startTime: new Date().toISOString(),
      pausedSeconds: activeTimer.isRunning ? activeTimer.pausedSeconds : 0,
      taskId,
      taskTitle,
      category
    };

    if (isMock) {
      localStorage.setItem(`mock_timer_${uid}`, JSON.stringify(timerState));
      setActiveTimer(timerState);
    } else {
      const timerRef = doc(db, `users/${uid}/activeTimer`, 'state');
      await setDoc(timerRef, timerState);
    }
  }, [uid, activeTimer]);

  const pauseTimer = useCallback(async (accumulatedSeconds) => {
    if (!uid) return;
    const timerState = {
      ...activeTimer,
      isRunning: false,
      startTime: null,
      pausedSeconds: accumulatedSeconds
    };

    if (isMock) {
      localStorage.setItem(`mock_timer_${uid}`, JSON.stringify(timerState));
      setActiveTimer(timerState);
    } else {
      const timerRef = doc(db, `users/${uid}/activeTimer`, 'state');
      await setDoc(timerRef, timerState);
    }
  }, [uid, activeTimer]);

  const resetTimer = useCallback(async () => {
    if (!uid) return;
    const timerState = {
      isRunning: false,
      startTime: null,
      pausedSeconds: 0,
      taskId: null,
      taskTitle: '',
      category: 'Work'
    };

    if (isMock) {
      localStorage.setItem(`mock_timer_${uid}`, JSON.stringify(timerState));
      setActiveTimer(timerState);
    } else {
      const timerRef = doc(db, `users/${uid}/activeTimer`, 'state');
      await setDoc(timerRef, timerState);
    }
  }, [uid]);

  // Time Log Mutations
  const saveTimeLog = useCallback(async (taskId, taskTitle, category, durationSeconds, notes = '') => {
    if (!uid || durationSeconds <= 0) return;
    
    const newLog = {
      taskId: taskId || null,
      taskTitle: taskTitle || 'Untagged Tracking',
      category: category || 'Work',
      durationSeconds,
      notes,
      timestamp: new Date().toISOString()
    };

    if (isMock) {
      const updatedLogs = [
        { id: 'mock-log-' + Date.now(), ...newLog },
        ...timeLogs
      ];
      localStorage.setItem(`mock_logs_${uid}`, JSON.stringify(updatedLogs));
      setTimeLogs(updatedLogs);
      
      // Auto reset active timer after saving
      await resetTimer();
    } else {
      // Create firestore log doc
      await addDoc(collection(db, `users/${uid}/timeLogs`), newLog);
      
      // Reset active timer document in Firebase
      await resetTimer();
    }
  }, [uid, timeLogs, resetTimer]);

  const deleteTimeLog = useCallback(async (logId) => {
    if (!uid) return;
    if (isMock) {
      const updatedLogs = timeLogs.filter(l => l.id !== logId);
      localStorage.setItem(`mock_logs_${uid}`, JSON.stringify(updatedLogs));
      setTimeLogs(updatedLogs);
    } else {
      const logRef = doc(db, `users/${uid}/timeLogs`, logId);
      await deleteDoc(logRef);
    }
  }, [uid, timeLogs]);

  // Category Mutations
  const addCategory = useCallback(async (name, color) => {
    if (!uid || !name.trim()) return;
    const cleanName = name.trim();
    
    // Prevent duplicate category names
    if (categories.some(c => c.name.toLowerCase() === cleanName.toLowerCase())) {
      alert("Category name already exists.");
      return;
    }

    const newCat = { color };

    if (isMock) {
      const updatedCategories = [...categories, { name: cleanName, color }];
      localStorage.setItem(`mock_categories_${uid}`, JSON.stringify(updatedCategories));
      setCategories(updatedCategories);
    } else {
      await setDoc(doc(db, `users/${uid}/categories`, cleanName), newCat);
    }
  }, [uid, categories]);

  const deleteCategory = useCallback(async (name) => {
    if (!uid) return;
    
    // Ensure we don't delete standard default categories to prevent broken layouts
    if (DEFAULT_CATEGORIES.some(c => c.name === name)) {
      alert("Standard system categories cannot be deleted.");
      return;
    }

    if (isMock) {
      const updatedCategories = categories.filter(c => c.name !== name);
      localStorage.setItem(`mock_categories_${uid}`, JSON.stringify(updatedCategories));
      setCategories(updatedCategories);
    } else {
      const catRef = doc(db, `users/${uid}/categories`, name);
      await deleteDoc(catRef);
    }
  }, [uid, categories]);

  return {
    tasks,
    timeLogs,
    activeTimer,
    categories,
    loading,
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
  };
};
