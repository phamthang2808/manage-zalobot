import { useApp } from '../../context/AppContext';
import { useState, useEffect } from 'react';

export default function ThemeToggle({ style = {}, className = '', theme: propTheme, toggleTheme: propToggleTheme, showLabel: propShowLabel }) {
  const app = useApp();
  const [localTheme, setLocalTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [isHovered, setIsHovered] = useState(false);

  const activeTheme = propTheme || app?.theme || localTheme;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', activeTheme);
    document.documentElement.classList.toggle('dark', activeTheme === 'dark');
    if (document.body) document.body.classList.toggle('dark', activeTheme === 'dark');
    localStorage.setItem('theme', activeTheme);
  }, [activeTheme]);

  const handleToggle = () => {
    if (propToggleTheme) {
      propToggleTheme();
    } else if (app?.toggleTheme) {
      app.toggleTheme();
    } else {
      const next = localTheme === 'light' ? 'dark' : 'light';
      setLocalTheme(next);
    }
  };

  const isDark = activeTheme === 'dark';
  const isFullWidth = style?.width === '100%';
  const showLabel = propShowLabel || isFullWidth;

  return (
    <button
      type="button"
      className={`theme-toggle-btn ${isDark ? 'dark' : 'light'} ${className}`}
      onClick={handleToggle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={isDark ? 'Chuyển sang Giao diện Sáng' : 'Chuyển sang Giao diện Tối'}
      aria-label="Toggle Theme"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: showLabel ? '8px' : '0px',
        width: showLabel ? '100%' : '36px',
        height: showLabel ? '38px' : '36px',
        padding: showLabel ? '0 12px' : '0',
        borderRadius: showLabel ? '8px' : '50%',
        border: isDark 
          ? (isHovered ? '1.5px solid rgba(34, 197, 94, 0.6)' : '1.5px solid rgba(34, 197, 94, 0.35)')
          : (isHovered ? '1.5px solid #94a3b8' : '1.5px solid #cbd5e1'),
        background: isDark 
          ? (isHovered ? 'rgba(34, 197, 94, 0.18)' : 'rgba(34, 197, 94, 0.08)')
          : (isHovered ? '#f1f5f9' : '#ffffff'),
        color: isDark ? '#22c55e' : (isHovered ? '#334155' : '#64748b'),
        cursor: 'pointer',
        position: 'relative',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered && !showLabel ? 'scale(1.06)' : 'none',
        flexShrink: 0,
        boxShadow: isDark 
          ? (isHovered ? '0 0 14px rgba(34, 197, 94, 0.35)' : '0 0 8px rgba(34, 197, 94, 0.2)')
          : (isHovered ? '0 3px 8px rgba(0,0,0,0.08)' : '0 2px 5px rgba(0,0,0,0.04)'),
        ...style,
      }}
    >
      <svg
        width="17"
        height="17"
        viewBox="0 0 384 512"
        fill="currentColor"
        style={{
          display: 'block',
          flexShrink: 0,
          transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.25s ease',
          transform: isDark ? 'rotate(-10deg)' : 'rotate(0deg)',
          filter: isDark ? 'drop-shadow(0 0 4px rgba(34, 197, 94, 0.4))' : 'none'
        }}
      >
        <path d="M223.5 32C100 32 0 132.3 0 256S100 480 223.5 480c60.6 0 115.5-24.2 155.8-63.4 5-4.9 6.3-12.5 3.1-18.7s-10.1-9.7-17-8.5c-9.8 1.7-19.8 2.6-30.1 2.6-96.9 0-175.5-78.8-175.5-176 0-65.8 36-123.1 89.3-153.3 6.1-3.5 9.2-10.5 7.7-17.3s-7.3-11.9-14.3-12.5c-6.3-.5-12.6-.8-19-.8z" />
      </svg>
      {showLabel && (
        <span style={{ fontSize: '13px', fontWeight: '600', color: isDark ? '#4ade80' : '#475569' }}>
          {isDark ? 'Giao diện Tối' : 'Giao diện Sáng'}
        </span>
      )}
    </button>
  );
}
