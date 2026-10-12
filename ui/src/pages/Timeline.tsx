import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { MemoryCard } from '../components/MemoryCard';

export function Timeline() {
  const { api } = useApi();
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [moodFilter, setMoodFilter] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [onThisDay, setOnThisDay] = useState<Record<number, any[]>>({});
  const [memoryOfTheDay, setMemoryOfTheDay] = useState<any>(null);

  const MOODS = ['😍', '😂', '🥹', '😤', '🤪', '🥰', '😎', '🤗'];

  // Debounce the search box so we don't hit the API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchMemories = async (pageNum: number, mood: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: '12' });
      if (mood) params.set('mood', mood);
      if (search) params.set('q', search);
      if (favoritesOnly) params.set('favorite', 'true');
      const data = await api(`/memories?${params}`);
      setMemories(data.memories);
      setTotalPages(data.pagination.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (id: string) => {
    try {
      const data = await api(`/memories/${id}/favorite`, { method: 'PATCH' });
      setMemories((prev) => prev.map((m) => (m._id === id ? { ...m, isFavorite: data.memory.isFavorite } : m)));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOnThisDay = async () => {
    try {
      const data = await api('/memories/on-this-day');
      setOnThisDay(data.memories);
      if (Object.keys(data.memories).length === 0) {
        const motd = await api('/memories/memory-of-the-day');
        setMemoryOfTheDay(motd.memory);
      } else {
        setMemoryOfTheDay(null);
      }
    } catch { /* noop */ }
  };

  useEffect(() => {
    fetchMemories(page, moodFilter);
  }, [page, moodFilter, search, favoritesOnly]);

  useEffect(() => {
    fetchOnThisDay();
  }, []);

  return (
    <div className="timeline-page">
      <div className="page-header">
        <h1>📖 Your Timeline</h1>
        <p>Every beautiful moment, captured together</p>
      </div>

      {/* Search */}
      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          type="search"
          className="search-input"
          placeholder="Search memories — title, place, tag..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        {searchInput && (
          <button className="search-clear" onClick={() => setSearchInput('')} aria-label="Clear search">✕</button>
        )}
      </div>

      {/* Mood filters */}
      <div className="mood-filters">
        <button
          className={`mood-filter-btn favorite-filter ${favoritesOnly ? 'active' : ''}`}
          onClick={() => { setFavoritesOnly(!favoritesOnly); setPage(1); }}
        >
          ❤️ Favorites
        </button>
        <button className={`mood-filter-btn ${!moodFilter ? 'active' : ''}`} onClick={() => { setMoodFilter(''); setPage(1); }}>
          All
        </button>
        {MOODS.map((mood) => (
          <button
            key={mood}
            className={`mood-filter-btn ${moodFilter === mood ? 'active' : ''}`}
            onClick={() => { setMoodFilter(moodFilter === mood ? '' : mood); setPage(1); }}
          >
            {mood}
          </button>
        ))}
      </div>

      {/* On This Day section */}
      {Object.keys(onThisDay).length > 0 ? (
        <div className="on-this-day-section">
          <h2>💝 On This Day</h2>
          <div className="on-this-day-grid">
            {Object.entries(onThisDay).map(([yearsAgo, mems]) =>
              (mems as any[]).map((m: any) => (
                <Link key={m._id} to={`/memory/${m._id}`} className="on-this-day-card">
                  <span className="years-ago">{yearsAgo} {+yearsAgo === 1 ? 'year' : 'years'} ago</span>
                  <span className="otd-mood">{m.mood}</span>
                  <strong>{m.title}</strong>
                </Link>
              ))
            )}
          </div>
        </div>
      ) : memoryOfTheDay ? (
        <div className="on-this-day-section memory-of-day">
          <h2>💫 Memory of the Day</h2>
          <Link to={`/memory/${memoryOfTheDay._id}`} className="memory-of-day-card">
            {memoryOfTheDay.photos && memoryOfTheDay.photos.length > 0 && (
              <div className="motd-photo">
                <img src={memoryOfTheDay.photos[0].url} alt={memoryOfTheDay.title} loading="lazy" />
              </div>
            )}
            <div className="motd-content">
              <span className="motd-mood">{memoryOfTheDay.mood || '💝'}</span>
              <strong>{memoryOfTheDay.title}</strong>
              <span className="motd-date">
                {new Date(memoryOfTheDay.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
              {memoryOfTheDay.description && (
                <p className="motd-excerpt">{memoryOfTheDay.description.slice(0, 100)}{memoryOfTheDay.description.length > 100 ? '...' : ''}</p>
              )}
            </div>
          </Link>
        </div>
      ) : null}

      {/* Memory grid */}
      {loading ? (
        <div className="loading">Loading memories...</div>
      ) : memories.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📝</span>
          <h3>No memories yet</h3>
          <p>Start capturing your beautiful moments together!</p>
          <Link to="/create" className="btn btn-primary">Create First Memory</Link>
        </div>
      ) : (
        <>
          <div className="memory-grid">
            {memories.map((memory) => (
              <MemoryCard key={memory._id} memory={memory} onToggleFavorite={toggleFavorite} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <button className="btn btn-ghost" disabled={page === 1} onClick={() => setPage(page - 1)}>
                ← Previous
              </button>
              <span className="page-info">Page {page} of {totalPages}</span>
              <button className="btn btn-ghost" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
