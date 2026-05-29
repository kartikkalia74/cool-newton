import React from 'react';
import { BarChart3, Clock, CheckSquare, Trash2, Calendar, ClipboardList } from 'lucide-react';

export default function Analytics({ timeLogs, tasks, categories, deleteTimeLog }) {

  // Format total seconds to readable HH hrs MM mins
  const formatTotalTime = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);

    if (hrs === 0 && mins === 0) return '0 mins';
    if (hrs === 0) return `${mins}m`;
    return `${hrs}h ${mins}m`;
  };

  // Format single session log seconds to MM:SS or HH:MM:SS
  const formatSessionTime = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  // 1. Calculations
  const totalSeconds = timeLogs.reduce((sum, log) => sum + (log.durationSeconds || 0), 0);
  const completedTasksCount = tasks.filter(t => t.completed).length;
  const activeTasksCount = tasks.filter(t => !t.completed).length;
  const totalTasks = tasks.length;

  // 2. Category Distribution sum
  const categorySums = categories.reduce((acc, cat) => {
    acc[cat.name] = 0;
    return acc;
  }, {});

  timeLogs.forEach(log => {
    const cat = log.category || 'Work';
    if (categorySums[cat] !== undefined) {
      categorySums[cat] += log.durationSeconds || 0;
    } else {
      // Fallback to first available category if 'Work' or current category is not defined
      const fallbackCat = categories.find(c => c.name === 'Work') ? 'Work' : (categories[0] ? categories[0].name : '');
      if (fallbackCat && categorySums[fallbackCat] !== undefined) {
        categorySums[fallbackCat] += log.durationSeconds || 0;
      }
    }
  });

  const maxCategoryTime = Math.max(...Object.values(categorySums), 1); // Avoid division by zero

  // Format date to readable string
  const formatLogDate = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoString;
    }
  };

  const getCategoryColor = (name) => {
    const cat = categories.find(c => c.name === name);
    return cat ? cat.color : '#8b5cf6';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* 1. Summary Cards Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '16px'
      }}>
        {/* Total Time Card */}
        <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(139, 92, 246, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'hsl(var(--primary))'
          }}>
            <Clock size={20} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--muted))', textTransform: 'uppercase' }}>
              Total Synced Time
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              {formatTotalTime(totalSeconds)}
            </span>
          </div>
        </div>

        {/* Tasks Progress Card */}
        <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'hsl(var(--success))'
          }}>
            <CheckSquare size={20} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--muted))', textTransform: 'uppercase' }}>
              Tasks Completed
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              {completedTasksCount} <span style={{ fontSize: '0.9rem', color: 'hsl(var(--muted))', fontWeight: 500 }}>/ {totalTasks}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Visual CSS Charts */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <BarChart3 size={18} style={{ color: 'hsl(var(--primary))' }} />
          <h3 style={{ fontSize: '1.1rem' }}>Category Distribution</h3>
        </div>

        {totalSeconds === 0 ? (
          <div style={{
            padding: '24px 0',
            textAlign: 'center',
            color: 'hsl(var(--muted))',
            fontSize: '0.85rem',
            fontWeight: 500
          }}>
            No time tracked yet today. Categories will appear as you log sessions.
          </div>
        ) : (
          <div className="chart-bar-container">
            {categories.map(cat => {
              const secondsSpent = categorySums[cat.name] || 0;
              const percentage = (secondsSpent / totalSeconds) * 100;
              const widthVal = (secondsSpent / maxCategoryTime) * 100;

              return (
                <div key={cat.name} className="chart-bar-row">
                  <div className="chart-bar-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="category-dot" style={{ backgroundColor: cat.color }}></span>
                    <span>{cat.name}</span>
                  </div>
                  <div className="chart-bar-track">
                    <div
                      className="chart-bar-fill"
                      style={{
                        width: `${widthVal}%`,
                        backgroundColor: cat.color,
                        boxShadow: `0 0 10px rgba(0,0,0,0.05)`
                      }}
                    ></div>
                  </div>
                  <div className="chart-bar-value">
                    {percentage > 0 ? `${Math.round(percentage)}%` : '0%'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Chronological Time logs list */}
      <div className="glass-card" style={{ flexGrow: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <ClipboardList size={18} style={{ color: 'hsl(var(--primary))' }} />
          <h3 style={{ fontSize: '1.1rem' }}>Activity History</h3>
        </div>

        <div style={{ overflowY: 'auto', maxHeight: '340px', paddingRight: '4px' }}>
          {timeLogs.length === 0 ? (
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
              <Calendar size={28} style={{ opacity: 0.3 }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                No tracking logs in this account yet.
              </span>
            </div>
          ) : (
            timeLogs.map((log) => {
              const catColor = getCategoryColor(log.category);
              return (
                <div
                  key={log.id}
                  className="log-item"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    gap: '6px',
                    padding: '14px 8px',
                    borderBottom: '1px solid hsl(var(--border))'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', gap: '2px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                        {log.taskTitle || 'Untagged Tracking'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'hsl(var(--muted))' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: catColor, fontWeight: 700 }}>
                          <span className="category-dot" style={{ backgroundColor: catColor, width: '6px', height: '6px' }}></span>
                          {log.category}
                        </span>
                        <span>•</span>
                        <span>{formatLogDate(log.timestamp)}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        color: 'hsl(var(--foreground))',
                        background: 'hsl(var(--secondary))',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid hsl(var(--border))'
                      }}>
                        {formatSessionTime(log.durationSeconds)}
                      </span>
                      <button
                        onClick={() => {
                          if (window.confirm("Delete this logged session?")) {
                            deleteTimeLog(log.id);
                          }
                        }}
                        className="btn btn-secondary btn-icon btn-danger"
                        title="Delete Session"
                        style={{ width: '28px', height: '28px', border: 'none' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {log.notes && (
                    <div style={{
                      background: 'hsl(var(--secondary))',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      color: 'hsl(var(--foreground))',
                      borderLeft: `3px solid ${catColor}`,
                      textAlign: 'left',
                      fontStyle: 'italic',
                      marginTop: '4px'
                    }}>
                      "{log.notes}"
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
