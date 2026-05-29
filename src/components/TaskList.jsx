import React, { useState } from 'react';
import { Plus, Trash2, Check, Circle, Folder, Play, CheckCircle, ListTodo, X } from 'lucide-react';

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

export default function TaskList({ 
  tasks, 
  timeLogs,
  categories,
  addTask, 
  toggleTask, 
  deleteTask,
  onStartTrackingTask,
  addCategory,
  deleteCategory
}) {
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Work');
  const [filterTab, setFilterTab] = useState('active'); // 'active' | 'completed'
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(PRESET_COLORS[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addTask(newTitle.trim(), newCategory);
    setNewTitle('');
  };

  // Helper to sum tracked seconds for a given task ID
  const getTaskTrackedTime = (taskId) => {
    const totalSecs = timeLogs
      .filter(log => log.taskId === taskId)
      .reduce((sum, log) => sum + (log.durationSeconds || 0), 0);
    
    if (totalSecs === 0) return '';
    
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const filteredTasks = tasks.filter(task => {
    if (filterTab === 'active') return !task.completed;
    return task.completed;
  });

  const getCategoryColor = (name) => {
    const cat = categories.find(c => c.name === name);
    return cat ? cat.color : '#8b5cf6';
  };

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <ListTodo size={20} style={{ color: 'hsl(var(--primary))' }} />
        <h3 style={{ fontSize: '1.2rem' }}>Tasks Board</h3>
      </div>
      <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted))', marginBottom: '20px' }}>
        Organize your agenda and launch timers directly from your checklist.
      </p>

      {/* Task Creation Form */}
      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid hsl(var(--border))'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            className="input-field"
            placeholder="What needs to be done?"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            style={{ flexGrow: 1 }}
            required
          />
          <select
            className="input-field"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            style={{ width: '110px', cursor: 'pointer' }}
          >
            {categories.map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowAddCategory(!showAddCategory)}
            className="btn btn-secondary"
            style={{ padding: '0 10px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Manage Categories"
          >
            <Folder size={16} />
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ padding: '0 16px', flexShrink: 0 }}
          >
            <Plus size={18} />
          </button>
        </div>

        {showAddCategory && (
          <div style={{
            background: 'rgba(var(--primary-rgb), 0.04)',
            border: '1px solid hsl(var(--border))',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            animation: 'fadeIn 0.2s ease',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'hsl(var(--muted))', textTransform: 'uppercase' }}>
                Add Custom Category
              </span>
              <button
                type="button"
                onClick={() => setShowAddCategory(false)}
                style={{ background: 'none', border: 'none', color: 'hsl(var(--muted))', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            </div>

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

            {categories.some(c => !['Work', 'Study', 'Design', 'Admin', 'Personal'].includes(c.name)) && (
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--muted))', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Custom Categories
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {categories.filter(c => !['Work', 'Study', 'Design', 'Admin', 'Personal'].includes(c.name)).map(c => (
                    <div
                      key={c.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'hsl(var(--secondary))',
                        border: '1px solid hsl(var(--border))',
                        padding: '4px 8px 4px 10px',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}
                    >
                      <span className="category-dot" style={{ backgroundColor: c.color, width: '6px', height: '6px' }}></span>
                      <span>{c.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete custom category "${c.name}"?`)) {
                            deleteCategory(c.name);
                            if (newCategory === c.name) {
                              setNewCategory('Work');
                            }
                          }
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'hsl(var(--danger))',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '1px'
                        }}
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                  setNewCategory(newCatName.trim());
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
      </form>

      {/* Active vs Completed Tabs */}
      <div style={{
        display: 'flex',
        background: 'hsl(var(--secondary))',
        border: '1px solid hsl(var(--border))',
        padding: '3px',
        borderRadius: 'var(--radius-md)',
        marginBottom: '16px',
        gap: '2px'
      }}>
        <button
          onClick={() => setFilterTab('active')}
          style={{
            flexGrow: 1,
            background: filterTab === 'active' ? 'hsl(var(--card))' : 'none',
            border: 'none',
            padding: '8px 12px',
            borderRadius: 'calc(var(--radius-md) - 3px)',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: filterTab === 'active' ? 'hsl(var(--foreground))' : 'hsl(var(--muted))',
            cursor: 'pointer',
            transition: 'var(--transition)'
          }}
        >
          Active Tasks ({tasks.filter(t => !t.completed).length})
        </button>
        <button
          onClick={() => setFilterTab('completed')}
          style={{
            flexGrow: 1,
            background: filterTab === 'completed' ? 'hsl(var(--card))' : 'none',
            border: 'none',
            padding: '8px 12px',
            borderRadius: 'calc(var(--radius-md) - 3px)',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: filterTab === 'completed' ? 'hsl(var(--foreground))' : 'hsl(var(--muted))',
            cursor: 'pointer',
            transition: 'var(--transition)'
          }}
        >
          Completed ({tasks.filter(t => t.completed).length})
        </button>
      </div>

      {/* Tasks List */}
      <div style={{ flexGrow: 1, overflowY: 'auto', maxHeight: '420px', paddingRight: '4px' }}>
        {filteredTasks.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            color: 'hsl(var(--muted))',
            textAlign: 'center',
            gap: '8px'
          }}>
            <CheckCircle size={32} style={{ opacity: 0.3 }} />
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
              {filterTab === 'active' 
                ? "All caught up! Create a new task to get started." 
                : "No completed tasks yet. Finish a task and watch it land here!"
              }
            </span>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const catColor = getCategoryColor(task.category);
            const trackedTime = getTaskTrackedTime(task.id);

            return (
              <div 
                key={task.id} 
                className={`task-item ${task.completed ? 'completed' : ''}`}
                style={{ position: 'relative' }}
              >
                <div className="task-item-left">
                  {/* Task Toggle Button */}
                  <div 
                    onClick={() => toggleTask(task.id, !task.completed)}
                    className={`task-checkbox ${task.completed ? 'checked' : ''}`}
                  >
                    {task.completed && <Check size={14} strokeWidth={3} />}
                  </div>

                  {/* Task Details */}
                  <div className="task-info">
                    <span className="task-title">{task.title}</span>
                    <div className="task-meta">
                      <span className="category-tag" style={{
                        padding: '2px 8px',
                        fontSize: '0.7rem',
                        background: 'none',
                        border: 'none',
                        color: catColor,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        <span className="category-dot" style={{ backgroundColor: catColor, width: '6px', height: '6px' }}></span>
                        {task.category || 'Work'}
                      </span>
                      {trackedTime && (
                        <span style={{ 
                          color: 'hsl(var(--success))', 
                          fontWeight: 700,
                          background: 'rgba(16, 185, 129, 0.08)',
                          padding: '1px 6px',
                          borderRadius: '4px'
                        }}>
                          Tracked: {trackedTime}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Immediate Track Launch Button */}
                  {!task.completed && onStartTrackingTask && (
                    <button
                      onClick={() => onStartTrackingTask(task)}
                      className="btn btn-secondary btn-icon"
                      title="Start Tracking Now"
                      style={{
                        width: '32px',
                        height: '32px',
                        borderColor: 'transparent',
                        background: 'rgba(var(--primary-rgb), 0.08)',
                        color: 'hsl(var(--primary))'
                      }}
                    >
                      <Play size={14} fill="currentColor" />
                    </button>
                  )}
                  
                  {/* Delete Button */}
                  <button 
                    onClick={() => deleteTask(task.id)}
                    className="btn btn-secondary btn-icon btn-danger"
                    title="Delete Task"
                    style={{ width: '32px', height: '32px', border: 'none' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
