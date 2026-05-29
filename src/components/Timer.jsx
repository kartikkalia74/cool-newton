import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Save, Tag, FolderOpen, FileText, Plus, X, Trash2 } from 'lucide-react';

const PRESET_COLORS = [
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#eab308', // Yellow
  '#10b981', // Green
  '#f97316', // Orange
  '#ef4444', // Red
  '#3b82f6'  // Blue
];

export default function Timer({ 
  activeTimer, 
  tasks, 
  categories,
  startTimer, 
  pauseTimer, 
  resetTimer, 
  saveTimeLog,
  addCategory,
  deleteCategory
}) {
  const [seconds, setSeconds] = useState(0);
  const [notes, setNotes] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Work');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(PRESET_COLORS[0]);
  const timerRef = useRef(null);

  // Calculate actual elapsed seconds (reconstructing live ticking from startTime + pausedSeconds)
  useEffect(() => {
    let interval = null;

    const updateTimer = () => {
      if (activeTimer.isRunning && activeTimer.startTime) {
        const start = new Date(activeTimer.startTime).getTime();
        const now = Date.now();
        const elapsed = activeTimer.pausedSeconds + Math.floor((now - start) / 1000);
        setSeconds(elapsed);
      } else {
        setSeconds(activeTimer.pausedSeconds || 0);
      }
    };

    updateTimer();

    if (activeTimer.isRunning) {
      interval = setInterval(updateTimer, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTimer]);

  // Synchronize internal selection state when activeTimer changes from another device
  useEffect(() => {
    if (activeTimer.taskId) {
      setSelectedTaskId(activeTimer.taskId);
    } else {
      setSelectedTaskId('');
    }
    if (activeTimer.category) {
      setSelectedCategory(activeTimer.category);
    }
  }, [activeTimer]);

  const handleStart = () => {
    // Find selected task title if any
    let taskTitle = '';
    if (selectedTaskId) {
      const matched = tasks.find(t => t.id === selectedTaskId);
      if (matched) taskTitle = matched.title;
    }
    startTimer(selectedTaskId || null, taskTitle, selectedCategory);
  };

  const handlePause = () => {
    pauseTimer(seconds);
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to discard the current timer?")) {
      resetTimer();
      setSeconds(0);
      setSelectedTaskId('');
    }
  };

  const handleSave = () => {
    let taskTitle = 'General Session';
    if (selectedTaskId) {
      const matched = tasks.find(t => t.id === selectedTaskId);
      if (matched) taskTitle = matched.title;
    } else if (activeTimer.taskTitle) {
      taskTitle = activeTimer.taskTitle;
    }

    saveTimeLog(
      selectedTaskId || activeTimer.taskId || null,
      taskTitle,
      selectedCategory,
      seconds,
      notes
    );
    
    // Reset local UI states
    setNotes('');
    setShowSaveModal(false);
  };

  // Format seconds to HH:MM:SS
  const formatTime = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  // SVG Circular Dash Offset calculation (loops every 60 seconds)
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const activeSecond = seconds % 60;
  const strokeDashoffset = circumference - (activeSecond / 60) * circumference;

  const activeCategoryDetails = categories.find(c => c.name === selectedCategory) || categories[0];

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', width: '100%', textAlign: 'left' }}>
        Track Session
      </h3>
      <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted))', width: '100%', textAlign: 'left', marginBottom: '20px' }}>
        Start tracking task progress. Syncs instantly on all devices.
      </p>

      {/* SVG Circular Timer */}
      <div className="timer-container">
        <div className="timer-circle-wrap">
          <svg className="timer-circle-svg">
            <defs>
              <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--accent))" />
              </linearGradient>
            </defs>
            <circle
              cx="130"
              cy="130"
              r={radius}
              className="timer-circle-bg"
            />
            <circle
              cx="130"
              cy="130"
              r={radius}
              className="timer-circle-progress"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{
                stroke: activeTimer.isRunning ? 'url(#timerGradient)' : 'hsl(var(--muted-light))',
                transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease'
              }}
            />
          </svg>

          {/* Time Counter Text */}
          <div className="timer-content">
            <span className="timer-display" style={{
              color: activeTimer.isRunning ? 'hsl(var(--foreground))' : 'hsl(var(--muted))'
            }}>
              {formatTime(seconds)}
            </span>
            <span className="timer-label" style={{
              color: activeCategoryDetails.color,
              fontWeight: 700
            }}>
              {selectedCategory}
            </span>
          </div>
        </div>
      </div>

      {/* Configuration & Controls */}
      {!activeTimer.isRunning && !showSaveModal && seconds === 0 ? (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Project Category Pills */}
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'hsl(var(--muted))', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
              Select Category
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: showAddCategory ? '12px' : '0' }}>
              {categories.map((cat) => {
                const isDefault = ['Work', 'Study', 'Design', 'Admin', 'Personal'].includes(cat.name);
                const isSelected = selectedCategory === cat.name;

                return (
                  <div
                    key={cat.name}
                    className={`category-tag ${isSelected ? 'active' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      paddingRight: (!isDefault && isSelected) ? '4px' : '10px',
                      position: 'relative'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedCategory(cat.name)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'inherit',
                        font: 'inherit',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: 0
                      }}
                    >
                      <span className="category-dot" style={{ backgroundColor: cat.color }}></span>
                      <span>{cat.name}</span>
                    </button>

                    {!isDefault && isSelected && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete the custom category "${cat.name}"? Tasks/Logs under this category will fallback to default.`)) {
                            deleteCategory(cat.name);
                            setSelectedCategory('Work');
                          }
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'hsl(var(--danger))',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '2px',
                          borderRadius: '50%',
                          marginLeft: '2px'
                        }}
                        title="Delete Category"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => setShowAddCategory(!showAddCategory)}
                className="category-tag"
                style={{
                  borderColor: 'rgba(var(--primary-rgb), 0.3)',
                  background: 'none',
                  color: 'hsl(var(--primary))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>+ Add Custom</span>
              </button>
            </div>

            {showAddCategory && (
              <div style={{
                background: 'rgba(var(--primary-rgb), 0.04)',
                border: '1px solid hsl(var(--border))',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                marginTop: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                animation: 'fadeIn 0.2s ease',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                <div className="input-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.75rem' }}>Category Name</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Design, Exercise, Health"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--muted))', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Select Color
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    {PRESET_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewCatColor(color)}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: color,
                          border: newCatColor === color ? '2px solid hsl(var(--foreground))' : '2px solid transparent',
                          cursor: 'pointer',
                          transition: 'var(--transition)',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                        }}
                      />
                    ))}
                    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                      <input
                        type="color"
                        value={newCatColor}
                        onChange={(e) => setNewCatColor(e.target.value)}
                        style={{
                          width: '26px',
                          height: '26px',
                          border: 'none',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          background: 'none',
                          padding: 0
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddCategory(false);
                      setNewCatName('');
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '8px 12px', fontSize: '0.8rem', flexGrow: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newCatName.trim()) return;
                      addCategory(newCatName.trim(), newCatColor);
                      setSelectedCategory(newCatName.trim());
                      setNewCatName('');
                      setShowAddCategory(false);
                    }}
                    className="btn btn-primary"
                    style={{ padding: '8px 12px', fontSize: '0.8rem', flexGrow: 1 }}
                  >
                    Save Category
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Optional Task Linker */}
          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Tag size={12} /> Link to Task (Optional)
            </label>
            <select
              className="input-field"
              value={selectedTaskId}
              onChange={(e) => {
                setSelectedTaskId(e.target.value);
                const matched = tasks.find(t => t.id === e.target.value);
                if (matched) {
                  setSelectedCategory(matched.category || 'Work');
                }
              }}
              style={{ width: '100%', cursor: 'pointer' }}
            >
              <option value="">-- General Tracker (Untagged) --</option>
              {tasks.filter(t => !t.completed).map(task => (
                <option key={task.id} value={task.id}>
                  [{task.category}] {task.title}
                </option>
              ))}
            </select>
          </div>

          {/* Trigger Play button */}
          <button 
            onClick={handleStart}
            className="btn btn-primary pulse-glow"
            style={{ width: '100%', display: 'flex', gap: '8px', padding: '14px' }}
          >
            <Play size={18} fill="white" />
            <span>Start Tracking Time</span>
          </button>
        </div>
      ) : (
        /* Running / Paused Interface */
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Active Tracker Banner */}
          <div style={{
            background: 'hsl(var(--secondary))',
            border: '1px solid hsl(var(--border))',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <FolderOpen size={18} style={{ color: activeCategoryDetails.color }} />
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--muted))' }}>
                Tracking for: {activeTimer.category || selectedCategory}
              </span>
              <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                {activeTimer.taskTitle || "General Session"}
              </span>
            </div>
          </div>

          {/* Interactive controls */}
          {!showSaveModal ? (
            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              {activeTimer.isRunning ? (
                <button 
                  onClick={handlePause} 
                  className="btn btn-secondary" 
                  style={{ flexGrow: 1, display: 'flex', gap: '8px', padding: '14px', background: 'rgba(234, 179, 8, 0.08)', color: 'hsl(var(--warning))', borderColor: 'rgba(234, 179, 8, 0.15)' }}
                >
                  <Pause size={18} fill="currentColor" />
                  <span>Pause</span>
                </button>
              ) : (
                <button 
                  onClick={handleStart} 
                  className="btn btn-primary" 
                  style={{ flexGrow: 1, display: 'flex', gap: '8px', padding: '14px' }}
                >
                  <Play size={18} fill="white" />
                  <span>Resume</span>
                </button>
              )}

              {seconds > 0 && !activeTimer.isRunning && (
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
                    flexGrow: 1,
                    display: 'flex',
                    gap: '8px',
                    padding: '14px'
                  }}
                >
                  <Save size={18} />
                  <span>Save Log</span>
                </button>
              )}

              <button 
                onClick={handleReset} 
                className="btn btn-secondary btn-icon"
                title="Discard Timer"
                style={{ flexShrink: 0 }}
              >
                <RotateCcw size={18} />
              </button>
            </div>
          ) : (
            /* Save Log Modal View (Inline Form) */
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--card))',
              padding: '16px',
              borderRadius: 'var(--radius-lg)',
              animation: 'fadeIn 0.3s ease'
            }}>
              <div className="input-group" style={{ marginBottom: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={12} /> Session Notes
                </label>
                <textarea
                  className="input-field"
                  placeholder="What did you work on during this session?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="btn btn-secondary"
                  style={{ flexGrow: 1, padding: '10px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    flexGrow: 1,
                    padding: '10px'
                  }}
                >
                  Confirm & Save
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
