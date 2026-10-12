import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';

export function Login() {
  const { login, register, token } = useApi();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (token) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name, partnerName);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>💝</h1>
          <h2>Welcome to LoveLog</h2>
          <p>Your private shared journal for beautiful memories together</p>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label className="input-label">Email</label>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="input-label">Password</label>
            <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          {mode === 'register' && (
            <>
              <div className="form-group">
                <label className="input-label">Your Name</label>
                <input type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="input-label">Partner's Name</label>
                <input type="text" className="input" value={partnerName} onChange={(e) => setPartnerName(e.target.value)} required />
              </div>
            </>
          )}
          <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
            {submitting ? '...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        <p className="auth-switch">
          {mode === 'login' ? (
            <>New here? <button className="link-btn" onClick={() => setMode('register')}>Create an account</button></>
          ) : (
            <>Already have an account? <button className="link-btn" onClick={() => setMode('login')}>Sign in</button></>
          )}
        </p>
      </div>
    </div>
  );
}
