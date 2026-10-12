import React from 'react';
import { useApp } from '../../context/AppContext';
import ThemeToggle from './ThemeToggle';

export default function UserNavbar() {
  const { view, setView, user, isAdmin, handleLogout, showToast } = useApp();

  const navItems = [
    { id: 'convert', label: 'Chuyển đổi', icon: 'fa-solid fa-link', color: '#f59e0b' },
    { id: 'orders', label: 'Đơn hàng', icon: 'fa-solid fa-boxes-stacked', color: '#0284c7' },
    { id: 'withdraw', label: 'Ví tiền', icon: 'fa-solid fa-wallet', color: '#10b981' },
    { id: 'account', label: 'Tài khoản', icon: 'fa-solid fa-user-circle', color: '#8b5cf6' },
    { id: 'lookup', label: 'Tra cứu Zalo', icon: 'fa-solid fa-magnifying-glass', color: '#ea580c' },
  ];

  return (
    <header className="user-navbar" style={{
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(12px)',
      boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
      padding: '0 20px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '70px',
        gap: '16px'
      }}>
        {/* Brand Logo */}
        <div 
          onClick={() => { setView('home'); window.history.pushState({}, '', '/'); }}
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}
        >
          <img 
            src="/28symueslogomanin.png?v=7" 
            alt="28Symues Affiliate" 
            style={{ height: '56px', width: 'auto', objectFit: 'contain' }} 
          />
        </div>

        {/* Center Nav Items */}
        <nav className="user-nav-links" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          overflowX: 'auto',
          padding: '4px 0',
          scrollbarWidth: 'none'
        }}>
          {navItems.map(item => {
            const isActive = view === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setView(item.id);
                  if (item.id === 'lookup') {
                    window.history.pushState({}, '', '/?view=lookup');
                  } else {
                    window.history.pushState({}, '', `/?view=${item.id}`);
                  }
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isActive ? 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(234,88,12,0.08))' : 'transparent',
                  color: isActive ? '#ea580c' : 'var(--text-main)',
                  fontWeight: isActive ? '700' : '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  borderBottom: isActive ? '2px solid #ea580c' : '2px solid transparent',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--bg-main)';
                    e.currentTarget.style.color = '#ea580c';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-main)';
                  }
                }}
              >
                <i className={item.icon} style={{ color: isActive ? '#ea580c' : item.color, fontSize: '15px' }}></i>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right User Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <ThemeToggle />

          {/* Admin Switch Button */}
          {isAdmin && (
            <button
              onClick={() => {
                setView('admin');
                sessionStorage.setItem('adminView', 'admin');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                color: '#fff',
                fontSize: '13px',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
                whiteSpace: 'nowrap'
              }}
            >
              <i className="fa-solid fa-shield-halved"></i>
              <span className="hide-on-mobile">Quản trị</span>
            </button>
          )}

          {/* User Profile Badge / Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 10px 4px 4px',
              background: 'var(--bg-main)',
              borderRadius: '24px',
              border: '1px solid var(--border-color)'
            }}>
              {user?.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt="Avatar" 
                  referrerPolicy="no-referrer"
                  style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} 
                />
              ) : (
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '700'
                }}>
                  {(user?.fullName || 'U').substring(0, 1).toUpperCase()}
                </div>
              )}
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-bright)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.fullName || user?.name || user?.email?.split('@')[0] || 'Tài khoản'}
              </span>
            </div>

            <button
              onClick={() => {
                if (window.confirm('Bạn có chắc muốn đăng xuất?')) {
                  handleLogout();
                }
              }}
              title="Đăng xuất"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#ef4444';
                e.currentTarget.style.borderColor = '#fca5a5';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              <i className="fa-solid fa-right-from-bracket" style={{ fontSize: '13px' }}></i>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
