import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function YearInReview() {
  const { year: yearParam } = useParams<{ year?: string }>();
  const currentYear = new Date().getFullYear();
  const year = yearParam ? parseInt(yearParam) : currentYear;
  const { api } = useApi();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const result = await api(`/year-in-review/${year}`);
        setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [year]);

  if (loading) return <div className="loading">Crunching the numbers...</div>;
  if (!data || !data.stats) return null;

  const { stats } = data;
  const maxMonthly = Math.max(...stats.monthly, 1);

  return (
    <div className="review-page">
      <div className="page-header">
        <h1>📊 {year} Year in Review</h1>
        <p>A look back at your year together</p>
      </div>

      {/* Year selector */}
      <div className="year-selector">
        {[currentYear, currentYear - 1].map((y) => (
          <Link key={y} to={`/year-in-review/${y}`} className={`year-chip ${y === year ? 'active' : ''}`}>
            {y}
          </Link>
        ))}
      </div>

      {/* Stats cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon">📖</span>
          <span className="stat-value">{stats.totalMemories}</span>
          <span className="stat-label">Memories</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📸</span>
          <span className="stat-value">{stats.totalPhotos}</span>
          <span className="stat-label">Photos</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">{stats.topMood?.emoji || '💝'}</span>
          <span className="stat-value">{stats.topMood?.emoji || '—'}</span>
          <span className="stat-label">Top Mood</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🔥</span>
          <span className="stat-value">{stats.longestStreak}</span>
          <span className="stat-label">Day Streak</span>
        </div>
      </div>

      {/* Monthly bar chart */}
      <div className="monthly-chart">
        <h2>Monthly Activity</h2>
        <div className="chart-bars">
          {stats.monthly.map((count: number, i: number) => (
            <div key={i} className="chart-bar-group">
              <div className="chart-bar-container">
                <div
                  className={`chart-bar ${i === stats.mostActiveMonth ? 'highlight' : ''}`}
                  style={{ height: `${(count / maxMonthly) * 100}%` }}
                  title={`${MONTHS[i]}: ${count} memories`}
                />
              </div>
              <span className="chart-label">{MONTHS[i]}</span>
              <span className="chart-count">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top locations */}
      {stats.topLocations.length > 0 && (
        <div className="top-locations">
          <h2>📍 Top Locations</h2>
          <div className="location-list">
            {stats.topLocations.map((loc: any) => (
              <div key={loc.location} className="location-item">
                <span>{loc.location}</span>
                <span className="location-count">{loc.count} visits</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top tags */}
      {stats.topTags.length > 0 && (
        <div className="top-tags-section">
          <h2>🏷️ Top Tags</h2>
          <div className="tags-cloud">
            {stats.topTags.map((t: any) => (
              <span key={t.tag} className="tag tag-lg">#{t.tag} ({t.count})</span>
            ))}
          </div>
        </div>
      )}

      {/* Highlight photos */}
      {data.highlights.length > 0 && (
        <div className="highlights-section">
          <h2>✨ Highlights</h2>
          <div className="highlights-grid">
            {data.highlights.slice(0, 8).map((memory: any) =>
              memory.photos.length > 0 ? (
                <Link key={memory._id} to={`/memory/${memory._id}`} className="highlight-card">
                  <img src={memory.photos[0].url} alt={memory.title} loading="lazy" />
                  <div className="highlight-overlay">
                    <span className="highlight-title">{memory.title}</span>
                    <span className="highlight-month">{MONTHS[new Date(memory.date).getMonth()]}</span>
                  </div>
                </Link>
              ) : null
            ).filter(Boolean)}
          </div>
        </div>
      )}
    </div>
  );
}
