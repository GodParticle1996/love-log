import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { MoodPicker } from '../components/MoodPicker';
import { PhotoUpload } from '../components/PhotoUpload';

export function EditMemory() {
  const { id } = useParams<{ id: string }>();
  const { api } = useApi();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [mood, setMood] = useState('');
  const [tags, setTags] = useState('');
  const [existingPhotos, setExistingPhotos] = useState<{ url: string; key: string; caption?: string }[]>([]);
  const [removedPhotoKeys, setRemovedPhotoKeys] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<{ url: string; caption?: string }[]>([]);
  const [newCaptions, setNewCaptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load existing memory
  useEffect(() => {
    (async () => {
      try {
        const data = await api(`/memories/${id}`);
        const m = data.memory;
        setTitle(m.title || '');
        setDescription(m.description || '');
        setDate(new Date(m.date).toISOString().slice(0, 10));
        setLocation(m.location || '');
        setMood(m.mood || '');
        setTags((m.tags || []).join(', '));
        setExistingPhotos(m.photos || []);
      } catch {
        navigate('/');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    const urls = newPreviews.map((p) => p.url);
    return () => {
      for (const url of urls) {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      }
    };
  }, [newPreviews]);

  const handleNewFilesSelected = (selected: File[]) => {
    setNewFiles((prev) => [...prev, ...selected]);
    const previews = selected.map((f) => ({ url: URL.createObjectURL(f) }));
    setNewPreviews((prev) => [...prev, ...previews]);
    setNewCaptions((prev) => [...prev, ...selected.map(() => '')]);
  };

  const handleNewCaptionChange = (index: number, caption: string) => {
    setNewCaptions((prev) => {
      const next = [...prev];
      next[index] = caption;
      return next;
    });
  };

  const handleExistingCaptionChange = (index: number, caption: string) => {
    setExistingPhotos((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], caption };
      return next;
    });
  };

  const handleRemoveExistingPhoto = (key: string) => {
    setRemovedPhotoKeys((prev) => [...prev, key]);
    setExistingPhotos((prev) => prev.filter((p) => p.key !== key));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('date', date);
      formData.append('location', location);
      formData.append('mood', mood);
      formData.append('tags', tags);
      formData.append('removePhotos', JSON.stringify(removedPhotoKeys));
      formData.append('photoCaptions', JSON.stringify(newCaptions.filter(Boolean)));
      formData.append('existingPhotoCaptions', JSON.stringify(
        existingPhotos.map((p) => p.caption || '')
      ));
      newFiles.forEach((file) => formData.append('newPhotos', file));

      await api(`/memories/${id}`, { method: 'PUT', formData });
      navigate(`/memory/${id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading">Loading memory...</div>;

  return (
    <div className="create-memory-page">
      <div className="page-header">
        <h1>✏️ Edit Memory</h1>
        <p>Update this beautiful moment</p>
      </div>

      <form onSubmit={handleSubmit} className="memory-form">
        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-group">
          <label className="input-label">Title *</label>
          <input type="text" className="input" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="input-label">Date</label>
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="input-label">Location</label>
            <input type="text" className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Goa, India" />
          </div>
        </div>

        <div className="form-group">
          <label className="input-label">Description</label>
          <textarea className="input textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell the story of this moment..." rows={4} maxLength={5000} />
        </div>

        <MoodPicker value={mood} onChange={setMood} />

        <div className="form-group">
          <label className="input-label">Tags</label>
          <input type="text" className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="vacation, beach, sunset (comma separated)" />
        </div>

        {/* Existing photos with remove option */}
        {existingPhotos.length > 0 && (
          <div className="existing-photos-section">
            <label className="input-label">Current Photos</label>
            <div className="photo-previews">
              {existingPhotos.map((photo, i) => (
                <div key={photo.key} className="photo-preview-item">
                  <div className="photo-preview-wrapper">
                    <img src={photo.url} alt={`Photo ${i + 1}`} />
                    <button
                      type="button"
                      className="photo-remove-btn"
                      onClick={() => handleRemoveExistingPhoto(photo.key)}
                      title="Remove this photo"
                    >
                      ✕
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Add a caption..."
                    value={photo.caption || ''}
                    onChange={(e) => handleExistingCaptionChange(i, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="photo-caption-input"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New photo upload */}
        <PhotoUpload
          onFilesSelected={handleNewFilesSelected}
          previews={newPreviews.map((p, i) => ({ ...p, caption: newCaptions[i] || '' }))}
          onCaptionChange={handleNewCaptionChange}
        />

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={() => navigate(`/memory/${id}`)}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : '💝 Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
