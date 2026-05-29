import React, { useState } from 'react';
import { firebaseAuth, isMock } from '../firebase';
import { Mail, Lock, LogIn, UserPlus, Clock, Sparkles, AlertCircle } from 'lucide-react';

export default function Auth({ onMockDemoStart }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await firebaseAuth.signUp(email, password);
      } else {
        await firebaseAuth.signIn(email, password);
      }
    } catch (err) {
      console.error(err);
      let errMsg = "Authentication failed. Please check your credentials.";
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        errMsg = "Incorrect email or password.";
      } else if (err.code === 'auth/email-already-in-use') {
        errMsg = "An account with this email already exists.";
      } else if (err.code === 'auth/weak-password') {
        errMsg = "Password should be at least 6 characters.";
      } else if (err.code === 'auth/invalid-email') {
        errMsg = "Please enter a valid email address.";
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100%',
      padding: '20px',
    }}>
      <div className="glass-card" style={{
        maxWidth: '440px',
        width: '100%',
        padding: '36px',
        textAlign: 'center',
      }}>
        {/* Brand Logo & Header */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)',
          color: 'white',
          marginBottom: '20px',
          boxShadow: '0 8px 24px rgba(var(--primary-rgb), 0.25)',
        }}>
          <Clock size={32} />
        </div>
        
        <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>
          <span className="gradient-text">CoolNewton</span> Tracker
        </h2>
        
        <p style={{ 
          fontSize: '0.9rem', 
          color: 'hsl(var(--muted))', 
          marginBottom: '28px',
          fontWeight: 500 
        }}>
          {isMock 
            ? "Sync across tabs locally. Add Firebase keys anytime to sync globally."
            : "Real-time task and time tracking synced everywhere."
          }
        </p>

        {/* Error Alert */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            color: 'hsl(var(--danger))',
            fontSize: '0.85rem',
            textAlign: 'left',
            marginBottom: '20px',
            fontWeight: 500
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div className="input-group">
            <label>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'hsl(var(--muted))'
              }} />
              <input
                type="email"
                placeholder="you@example.com"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '44px', width: '100%' }}
                required
              />
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: '24px' }}>
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'hsl(var(--muted))'
              }} />
              <input
                type="password"
                placeholder="••••••••"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '44px', width: '100%' }}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '14px', marginBottom: '16px' }}
            disabled={loading}
          >
            {loading ? (
              <span>Connecting...</span>
            ) : (
              <>
                {isRegister ? <UserPlus size={18} /> : <LogIn size={18} />}
                <span>{isRegister ? "Create Free Account" : "Sign In"}</span>
              </>
            )}
          </button>
        </form>

        {/* Toggle between Register/Login */}
        <div style={{ fontSize: '0.9rem', color: 'hsl(var(--muted))', marginBottom: '24px' }}>
          {isRegister ? "Already have an account?" : "New to CoolNewton?"}{' '}
          <button 
            onClick={() => setIsRegister(!isRegister)}
            style={{
              background: 'none',
              border: 'none',
              color: 'hsl(var(--primary))',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isRegister ? "Sign In" : "Register Now"}
          </button>
        </div>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: '24px 0',
          color: 'hsl(var(--muted-light))',
          fontSize: '0.8rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          <div style={{ flexGrow: 1, height: '1px', background: 'hsl(var(--border))' }}></div>
          <span style={{ padding: '0 12px', color: 'hsl(var(--muted))' }}>Or Try Without Firebase</span>
          <div style={{ flexGrow: 1, height: '1px', background: 'hsl(var(--border))' }}></div>
        </div>

        {/* Instant Demo Launch Button */}
        <button
          onClick={onMockDemoStart}
          className="btn btn-secondary"
          style={{
            width: '100%',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: 'rgba(var(--accent-rgb), 0.06)',
            borderColor: 'rgba(var(--accent-rgb), 0.15)',
            color: 'hsl(var(--accent))',
            fontWeight: 700
          }}
        >
          <Sparkles size={16} />
          <span>Launch Local Offline Demo</span>
        </button>
      </div>
    </div>
  );
}
