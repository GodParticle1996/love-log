import React from 'react';
import { Link } from 'react-router-dom';

interface MemoryCardProps {
  memory: {
    _id: string;
    title: string;
    description: string;
    date: string;
    location?: string;
    mood?: string;
    photos: { url: string; caption?: string }[];
    tags: string[];
    isFavorite?: boolean;
  };
  onToggleFavorite?: (id: string) => void;
}

export function MemoryCard({ memory, onToggleFavorite }: MemoryCardProps) {
  const date = new Date(memory.date);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Link to={`/memory/${memory._id}`} className="memory-card">
      {onToggleFavorite && (
        <button
          className={`favorite-btn ${memory.isFavorite ? 'favorited' : ''}`}
          aria-label={memory.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(memory._id); }}
        >
          {memory.isFavorite ? '❤️' : '🤍'}
        </button>
      )}
      {memory.photos.length > 0 && (
        <div className="memory-card-image">
          <img src={memory.photos[0].url} alt={memory.title} loading="lazy" />
          {memory.photos.length > 1 && (
            <span className="photo-count-badge">{memory.photos.length} 📸</span>
          )}
        </div>
      )}
      <div className="memory-card-body">
        <div className="memory-card-header">
          <h3>{memory.mood ? `${memory.mood} ` : ''}{memory.title}</h3>
          <time className="memory-date">{formattedDate}</time>
        </div>
        {memory.description && (
          <p className="memory-excerpt">
            {memory.description.slice(0, 120)}
            {memory.description.length > 120 ? '...' : ''}
          </p>
        )}
        <div className="memory-card-footer">
          {memory.location && <span className="memory-location">📍 {memory.location}</span>}
          {memory.tags.length > 0 && (
            <div className="memory-tags">
              {memory.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="tag">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
