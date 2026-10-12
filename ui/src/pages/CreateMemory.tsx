import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { MoodPicker } from '../components/MoodPicker';
import { PhotoUpload } from '../components/PhotoUpload';

export function CreateMemory() {
  const { api } = useApi();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [location, setLocation] = useState('');
  const [mood, setMood] = useState('');
  const [tags, setTags] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ url: string; caption?: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [photoCaptions, setPhotoCaptions] = useState<string[]>([]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    const urls = previews.map((p) => p.url);
    return () => {
      for (const url of urls) {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      }
    };
  }, [previews]);

  const handleFilesSelected = (selected: File[]) => {
    setFiles((prev) => [...prev, ...selected]);
    const newPreviews = selected.map((f) => ({ url: URL.createObjectURL(f) }));
    setPreviews((prev) => [...prev, ...newPreviews]);
    setPhotoCaptions((prev) => [...prev, ...selected.map(() => '')]);
  };

  const handleCaptionChange = (index: number, caption: string) => {
    setPhotoCaptions((prev) => {
      const next = [...prev];
      next[index] = caption;
      return next;
    });
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
      if (location) formData.append('location', location);
      if (mood) formData.append('mood', mood);
      if (tags) formData.append('tags', tags);
      formData.append('photoCaptions', JSON.stringify(photoCaptions.filter(Boolean)));
      files.forEach((file) => formData.append('photos', file));

      await api('/memories', { method: 'POST', formData });
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="create-memory-page">
      <div className="page-header">
        <h1>✨ Create a Memory</h1>
        <p>Capture a beautiful moment together</p>
      </div>

      <form onSubmit={handleSubmit} className="memory-form">
        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-group">
          <label className="input-label">Title *</label>
          <input type="text" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Our first trip to the beach" required maxLength={200} />
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

        <PhotoUpload
          onFilesSelected={handleFilesSelected}
          previews={previews.map((p, i) => ({ ...p, caption: photoCaptions[i] || '' }))}
          onCaptionChange={handleCaptionChange}
        />

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/')}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : '💝 Save Memory'}
          </button>
        </div>
      </form>
    </div>
  );
}
