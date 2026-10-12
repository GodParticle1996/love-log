import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';

export function CreateCapsule() {
  const { api } = useApi();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [unlockDate, setUnlockDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim() || !unlockDate) {
      setError('All fields are required');
      return;
    }

    const unlock = new Date(unlockDate);
    if (unlock <= new Date()) {
      setError('Unlock date must be in the future');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api('/capsules', {
        method: 'POST',
        body: { title, message, unlockDate },
      });
      navigate('/capsules');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Min date = tomorrow, max date = 5 years from now
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 5);

  return (
    <div className="create-memory-page">
      <div className="page-header">
        <h1>⏰ Seal a Time Capsule</h1>
        <p>Write a message to your future selves — it stays locked until the date you choose</p>
      </div>

      <form onSubmit={handleSubmit} className="memory-form">
        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-group">
          <label className="input-label">Title *</label>
          <input
            type="text"
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. A letter for our 2nd anniversary"
            required
            maxLength={200}
          />
        </div>

        <div className="form-group">
          <label className="input-label">Unlock Date *</label>
          <input
            type="date"
            className="input"
            value={unlockDate}
            onChange={(e) => setUnlockDate(e.target.value)}
            min={tomorrow.toISOString().slice(0, 10)}
            max={maxDate.toISOString().slice(0, 10)}
            required
          />
          <p className="input-hint">Choose a meaningful future date — an anniversary, birthday, or just "one year from now"</p>
        </div>

        <div className="form-group">
          <label className="input-label">Your Message *</label>
          <textarea
            className="input textarea capsule-textarea"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Dear future us... ✍️"
            rows={8}
            required
            maxLength={10000}
          />
          <p className="input-hint char-count">{message.length}/10000</p>
        </div>

        <div className="capsule-note">
          <p>🔒 Once sealed, this message cannot be viewed by anyone — not even you — until the unlock date arrives.</p>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/capsules')}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Sealing...' : '🔒 Seal Capsule'}
          </button>
        </div>
      </form>
    </div>
  );
}
