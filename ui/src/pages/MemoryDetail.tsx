import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';

export function MemoryDetail() {
  const { id } = useParams<{ id: string }>();
  const { api } = useApi();
  const navigate = useNavigate();
  const [memory, setMemory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api(`/memories/${id}`);
        setMemory(data.memory);
      } catch {
        navigate('/');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Delete this memory forever? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await api(`/memories/${id}`, { method: 'DELETE' });
      navigate('/');
    } catch { setDeleting(false); }
  };

  if (loading) return <div className="loading">Loading memory...</div>;
  if (!memory) return null;

  const date = new Date(memory.date);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="memory-detail-page">
      <Link to="/" className="back-link">← Back to Timeline</Link>

      <article className="memory-detail">
        <div className="memory-detail-header">
          <h1>{memory.mood && <span className="detail-mood">{memory.mood}</span>} {memory.title}</h1>
          <time>{formattedDate}</time>
          {memory.location && <span className="detail-location">📍 {memory.location}</span>}
        </div>

        {memory.photos.length > 0 && (
          <div className="detail-photos">
            {memory.photos.map((photo: any, i: number) => (
              <figure key={i} className="detail-photo">
                <img src={photo.url} alt={photo.caption || memory.title} />
                {photo.caption && <figcaption>{photo.caption}</figcaption>}
              </figure>
            ))}
          </div>
        )}

        {memory.description && (
          <div className="detail-description">
            <p>{memory.description}</p>
          </div>
        )}

        {memory.tags.length > 0 && (
          <div className="detail-tags">
            {memory.tags.map((tag: string) => (
              <span key={tag} className="tag">#{tag}</span>
            ))}
          </div>
        )}

        <div className="detail-actions">
          <Link to={`/memory/${memory._id}/edit`} className="btn btn-primary">✏️ Edit</Link>
          <button className="btn btn-ghost" onClick={() => navigate('/create')}>✨ New Memory</button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : '🗑️ Delete'}
          </button>
        </div>
      </article>
    </div>
  );
}
