import { useApp } from '../../context/AppContext';

export default function ToastNotification() {
  const { toast, setToast } = useApp();
  if (!toast) return null;

  return (
    <div className="custom-toast-popup" style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderLeft: '4px solid #f97316',
      borderRadius: '14px',
      boxShadow: '0 10px 30px -5px rgba(0,0,0,0.15)',
      top: '72px'
    }}>
      <div style={{
        width: '40px', height: '40px', minWidth: '40px',
        borderRadius: '50%', background: 'var(--color-primary-light)',
        border: '1.5px solid var(--color-primary-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, boxShadow: '0 0 14px rgba(249,115,22,0.15)'
      }}>
        {toast.type === 'success' ? (
          <svg style={{ width: '18px', height: '18px', color: '#ea580c' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"></path>
          </svg>
        ) : toast.type === 'error' ? (
          <svg style={{ width: '18px', height: '18px', color: '#ef4444' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"></path>
          </svg>
        ) : (
          <svg style={{ width: '18px', height: '18px', color: '#ea580c' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.085 1.085l-1.086 1.086L10.5 13.5H12.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        )}
      </div>
      <div style={{ flex: 1, textAlign: 'left' }}>
        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-bright)', marginBottom: '3px', letterSpacing: '0.1px' }}>
          {toast.type === 'success' ? '✓  Thành công' : (toast.type === 'error' ? '⚠  Có lỗi xảy ra' : 'ℹ  Thông báo')}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.45' }}>
          {toast.message}
        </div>
      </div>
      <button
        onClick={() => setToast(null)}
        style={{
          background: 'var(--bg-main)', border: '1px solid var(--border-color)',
          color: 'var(--text-muted)', fontSize: '14px', cursor: 'pointer',
          padding: '4px 7px', lineHeight: 1, borderRadius: '6px',
          alignSelf: 'flex-start', transition: 'all 0.2s', flexShrink: 0
        }}
      >✕</button>
      <div style={{
        position: 'absolute', bottom: 0, left: 0, height: '2px',
        borderRadius: '0 0 14px 14px',
        background: 'linear-gradient(90deg, #f97316, #ea580c)',
        animation: 'toastProgress 4s linear forwards'
      }} />
    </div>
  );
}
