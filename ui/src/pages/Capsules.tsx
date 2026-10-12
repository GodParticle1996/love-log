import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';

export function Capsules() {
  const { api } = useApi();
  const [capsules, setCapsules] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCapsules = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api('/capsules');
      setCapsules(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load capsules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCapsules(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this capsule? Even locked ones can be deleted.')) return;
    setDeletingId(id);
    try {
      await api(`/capsules/${id}`, { method: 'DELETE' });
      setCapsules((prev: any) => ({
        ...prev,
        locked: prev.locked.filter((c: any) => c._id !== id),
        unlocked: prev.unlocked.filter((c: any) => c._id !== id),
        total: prev.total - 1,
      }));
    } catch { /* ignore */ }
    setDeletingId(null);
  };

  if (loading) return <div className="loading">Loading capsules...</div>;
  if (!capsules) return null;

  const { locked, unlocked } = capsules;

  return (
    <div className="capsules-page">
      <div className="page-header">
        <h1>⏰ Time Capsules</h1>
        <p>Seal your thoughts for the future — they unlock only when the time is right</p>
      </div>

      <div className="capsules-actions-header">
        <Link to="/capsules/create" className="btn btn-primary">✨ Seal a New Capsule</Link>
      </div>

      {/* Unlocked capsules */}
      {unlocked.length > 0 && (
        <section className="capsule-section">
          <h2>🔓 Unlocked Capsules</h2>
          <div className="capsule-grid">
            {unlocked.map((c: any) => (
              <div key={c._id} className="capsule-card unlocked">
                <Link to={`/capsules/${c._id}`} className="capsule-card-inner">
                  <div className="capsule-icon">{c.isRevealed ? '📖' : '🔓'}</div>
                  <div className="capsule-content">
                    <h3>{c.title}</h3>
                    <p className="capsule-meta">
                      Unlocked {new Date(c.unlockDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    {!c.isRevealed && <span className="capsule-new-badge">NEW</span>}
                  </div>
                </Link>
                <button
                  className="capsule-delete-btn"
                  onClick={() => handleDelete(c._id)}
                  disabled={deletingId === c._id}
                  title="Delete capsule"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Locked capsules */}
      <section className="capsule-section">
        <h2>🔒 Sealed Capsules</h2>
        {locked.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">⏰</span>
            <h3>No capsules yet</h3>
            <p>Write a note to your future selves and seal it away until a special date!</p>
          </div>
        ) : (
          <div className="capsule-grid">
            {locked.map((c: any) => (
              <div key={c._id} className="capsule-card locked">
                <div className="capsule-card-inner">
                  <div className="capsule-icon">🔒</div>
                  <div className="capsule-content">
                    <h3>{c.title}</h3>
                    <p className="capsule-meta">
                      Unlocks {new Date(c.unlockDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    <CountdownTimer targetDate={c.unlockDate} />
                  </div>
                </div>
                <button
                  className="capsule-delete-btn"
                  onClick={() => handleDelete(c._id)}
                  disabled={deletingId === c._id}
                  title="Delete capsule"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft('Ready to unlock!');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 365) {
        const years = Math.floor(days / 365);
        const remainingDays = days % 365;
        setTimeLeft(`${years}y ${remainingDays}d remaining`);
      } else if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m remaining`);
      } else {
        setTimeLeft(`${hours}h ${minutes}m remaining`);
      }
    };

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return <span className="countdown-timer">⏳ {timeLeft}</span>;
}
