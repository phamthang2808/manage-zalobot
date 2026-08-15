import { useApp } from '../../context/AppContext';

export default function ThemeToggle({ style = {}, className = '' }) {
  const { theme, toggleTheme } = useApp();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className={`theme-toggle-switch ${isDark ? 'dark' : 'light'} ${className}`}
      onClick={toggleTheme}
      title={isDark ? 'Chuyển sang Chế độ Sáng' : 'Chuyển sang Chế độ Tối'}
      aria-label="Toggle Theme"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '52px',
        height: '28px',
        padding: '3px 5px',
        borderRadius: '20px',
        border: isDark ? '1px solid #475569' : '1px solid #fdba74',
        background: isDark ? '#1e293b' : '#fff7ed',
        cursor: 'pointer',
        position: 'relative',
        transition: 'all 0.3s ease',
        flexShrink: 0,
        boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
        ...style,
      }}
    >
      <span style={{ fontSize: '11px', zIndex: 1, lineHeight: 1, opacity: isDark ? 0.35 : 1, transition: 'opacity 0.2s' }}>☀️</span>
      <span style={{ fontSize: '11px', zIndex: 1, lineHeight: 1, opacity: isDark ? 1 : 0.35, transition: 'opacity 0.2s' }}>🌙</span>
      <span
        style={{
          position: 'absolute',
          top: '3px',
          left: isDark ? '27px' : '3px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: isDark ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #fb923c, #ea580c)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease',
          zIndex: 2,
        }}
      />
    </button>
  );
}
