import React, { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';

const MOOD_LABELS: Record<string, string> = {
  '😍': 'In Love', '😂': 'Funny', '🥹': 'Touched', '😤': 'Frustrated',
  '🤪': 'Silly', '🥰': 'Grateful', '😎': 'Cool', '🤗': 'Warm',
};

export function MoodTracker() {
  const { api } = useApi();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const year = new Date().getFullYear();
        const result = await api(`/moods?year=${year}`);
        setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="loading">Analyzing moods...</div>;
  if (!data || data.total === 0) {
    return (
      <div className="moods-page">
        <div className="page-header">
          <h1>🎭 Mood Tracker</h1>
          <p>See the emotional journey of your relationship</p>
        </div>
        <div className="empty-state">
          <span className="empty-icon">🎭</span>
          <h3>No moods tracked yet</h3>
          <p>Add moods to your memories to see the pattern!</p>
        </div>
      </div>
    );
  }

  const topMoods = Object.entries(data.counts)
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 3) as [string, number][];

  return (
    <div className="moods-page">
      <div className="page-header">
        <h1>🎭 Mood Tracker</h1>
        <p>{data.total} memories with moods tracked</p>
      </div>

      {/* Top moods */}
      {topMoods.length > 0 && (
        <div className="mood-highlights">
          <h2>Your Top Moods</h2>
          <div className="top-moods-grid">
            {topMoods.map(([emoji, count]) => (
              <div key={emoji} className="top-mood-card">
                <span className="top-mood-emoji">{emoji}</span>
                <span className="top-mood-label">{MOOD_LABELS[emoji] || emoji}</span>
                <span className="top-mood-count">{count} times</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Distribution bars */}
      <div className="mood-distribution">
        <h2>Overall Distribution</h2>
        <div className="mood-bars">
          {Object.entries(data.counts).sort(([, a]: any, [, b]: any) => b - a).map(([emoji, count]: any) => (
            <div key={emoji} className="mood-bar-row">
              <span className="mood-bar-emoji">{emoji}</span>
              <span className="mood-bar-label">{MOOD_LABELS[emoji] || emoji}</span>
              <div className="mood-bar-track">
                <div
                  className="mood-bar-fill"
                  style={{ width: `${data.distribution[emoji] || 0}%` }}
                />
              </div>
              <span className="mood-bar-count">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly breakdown */}
      {data.monthly && data.monthly.length > 0 && (
        <div className="monthly-moods">
          <h2>Monthly Breakdown</h2>
          <div className="monthly-grid">
            {data.monthly.map((month: any) => {
              const monthName = new Date(2024, month._id - 1).toLocaleString('en', { month: 'short' });
              const topMood = month.moods.sort((a: any, b: any) => b.count - a.count)[0];
              return (
                <div key={month._id} className="monthly-card">
                  <span className="month-name">{monthName}</span>
                  <span className="month-top-mood">
                    {topMood?.mood || '—'}
                  </span>
                  <span className="month-count">{month.moods.reduce((s: number, m: any) => s + m.count, 0)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
