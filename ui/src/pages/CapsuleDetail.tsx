import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';

export function CapsuleDetail() {
  const { id } = useParams<{ id: string }>();
  const { api, token, logout } = useApi();
  const navigate = useNavigate();
  const [capsule, setCapsule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [lockedData, setLockedData] = useState<{ title: string; unlockDate: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/capsules/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (!res.ok) {
          if (res.status === 401) {
            logout();
            navigate('/login');
            return;
          }
          if (res.status === 403 && data.unlockDate) {
            setLocked(true);
            setLockedData({ title: data.title, unlockDate: data.unlockDate });
          } else {
            navigate('/capsules');
          }
        } else {
          setCapsule(data.capsule);
        }
      } catch {
        navigate('/capsules');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Delete this capsule forever?')) return;
    setDeleting(true);
    try {
      await api(`/capsules/${id}`, { method: 'DELETE' });
      navigate('/capsules');
    } catch {
      setDeleting(false);
    }
  };

  if (loading) return <div className="loading">Opening capsule...</div>;

  if (locked) {
    const unlockStr = lockedData?.unlockDate
      ? new Date(lockedData.unlockDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : '';
    return (
      <div className="capsule-detail-page">
        <Link to="/capsules" className="back-link">← Back to Capsules</Link>
        <div className="capsule-locked-view">
          <span className="capsule-locked-icon">🔒</span>
          <h1>{lockedData?.title || 'This Capsule is Still Sealed'}</h1>
          {unlockStr && <p className="capsule-unlock-info">Unlocks on <strong>{unlockStr}</strong></p>}
          <p>Come back when the time is right...</p>
          <Link to="/capsules" className="btn btn-primary">Back to Capsules</Link>
        </div>
      </div>
    );
  }

  if (!capsule) return null;

  const createdDate = new Date(capsule.createdAt).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const unlockedDate = new Date(capsule.unlockDate).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="capsule-detail-page">
      <Link to="/capsules" className="back-link">← Back to Capsules</Link>

      <article className="capsule-revealed">
        <div className="capsule-revealed-header">
          <span className="capsule-revealed-icon">📖</span>
          <h1>{capsule.title}</h1>
          <div className="capsule-revealed-meta">
            <span>✍️ Written {createdDate}</span>
            <span>🔓 Unlocked {unlockedDate}</span>
          </div>
        </div>

        <div className="capsule-message">
          {capsule.message.split('\n').map((line: string, i: number) => (
            <p key={i}>{line || '\u00A0'}</p>
          ))}
        </div>

        <div className="detail-actions">
          <Link to="/capsules/create" className="btn btn-ghost">✨ Seal Another</Link>
          <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : '🗑️ Delete'}
          </button>
        </div>
      </article>
    </div>
  );
}
