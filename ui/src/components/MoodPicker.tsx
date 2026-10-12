import React from 'react';

const MOODS = [
  { emoji: '😍', label: 'In Love' },
  { emoji: '😂', label: 'Funny' },
  { emoji: '🥹', label: 'Touched' },
  { emoji: '😤', label: 'Frustrated' },
  { emoji: '🤪', label: 'Silly' },
  { emoji: '🥰', label: 'Grateful' },
  { emoji: '😎', label: 'Cool' },
  { emoji: '🤗', label: 'Warm' },
];

interface MoodPickerProps {
  value: string;
  onChange: (mood: string) => void;
}

export function MoodPicker({ value, onChange }: MoodPickerProps) {
  return (
    <div className="mood-picker">
      <label className="input-label">How are you feeling?</label>
      <div className="mood-options">
        {MOODS.map((mood) => (
          <button
            key={mood.emoji}
            type="button"
            className={`mood-btn ${value === mood.emoji ? 'selected' : ''}`}
            onClick={() => onChange(value === mood.emoji ? '' : mood.emoji)}
            title={mood.label}
          >
            <span className="mood-emoji">{mood.emoji}</span>
            <span className="mood-label">{mood.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
