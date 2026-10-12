import React from 'react';
import { useApp } from '../../context/AppContext';
import ThemeToggle from './ThemeToggle';

export default function WorkspaceTopBar({ setSidebarOpen }) {
  const { view, setView, user, token, isAdmin, handleLogout } = useApp();

  const navTabs = [
    { id: 'home', label: 'Trang chủ', icon: 'fa-solid fa-house' },
    { id: 'lookup', label: 'Tra cứu', icon: 'fa-solid fa-magnifying-glass' },
    { id: 'pricing', label: 'Bảng giá', icon: 'fa-solid fa-tags' },
    { id: 'blog', label: 'Blog', icon: 'fa-regular fa-newspaper' }
  ];

  const handleNavClick = (tabId) => {
    if (tabId === 'pricing') {
      if (view !== 'home' && view !== 'landing') {
        setView('home');
        window.history.pushState({}, '', '/');
        setTimeout(() => {
          document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      } else {
        document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    setView(tabId);
    window.history.pushState({}, '', tabId === 'home' ? '/' : `/?view=${tabId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isTabActive = (tabId) => {
    if (tabId === 'home') return view === 'home' || view === 'landing';
    return view === tabId;
  };

  return (
    <header className="workspace-topbar" style={{
      height: '66px',
      background: 'var(--bg-card, #ffffff)',
      borderBottom: '1px solid var(--border-color, rgba(226, 232, 240, 0.8))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 18px',
      position: 'sticky',
      top: 0,
      zIndex: 90,
      backdropFilter: 'blur(12px)',
      boxSizing: 'border-box',
      gap: '12px'
    }}>
      {/* Bên Trái: Nút Hamburger Mobile + Logo Thu Nhỏ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <button
          type="button"
          className="workspace-sidebar-toggle"
          onClick={() => setSidebarOpen(prev => !prev)}
          style={{
            background: 'var(--bg-main, #f1f5f9)',
            border: '1px solid var(--border-color, #cbd5e1)',
            borderRadius: '10px',
            width: '38px',
            height: '38px',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-main, #334155)',
            fontSize: '16px'
          }}
          aria-label="Toggle menu"
        >
          <i className="fa-solid fa-bars"></i>
        </button>

        <div
          onClick={() => handleNavClick('home')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          title="Về Trang chủ"
        >
          <img
            src="/28symueslogomanin.png?v=7"
            alt="Logo"
            style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
          />
        </div>
      </div>

      {/* Ở Giữa: CÁC TAB ĐIỀU HƯỚNG TRÊN MÁY TÍNH (Trang chủ, Tra cứu, Bảng giá, Blog) - Trên Mobile đã tích hợp vào nút Menu ☰ */}
      <nav className="hide-on-mobile" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        overflowX: 'auto',
        maxWidth: '100%',
        padding: '4px 0',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none'
      }}>
        {navTabs.map(tab => {
          const active = isTabActive(tab.id);
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleNavClick(tab.id)}
              style={{
                border: 'none',
                background: active
                  ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
                  : 'transparent',
                color: active ? '#ffffff' : 'var(--text-muted, #64748b)',
                padding: '7px 15px',
                borderRadius: '20px',
                fontSize: '13.5px',
                fontWeight: active ? '600' : '500',
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                boxShadow: active ? '0 3px 10px rgba(249, 115, 22, 0.3)' : 'none'
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = 'var(--bg-main, rgba(0,0,0,0.04))';
                  e.currentTarget.style.color = 'var(--color-primary, #ea580c)';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-muted, #64748b)';
                }
              }}
            >
              <i className={tab.icon} style={{ fontSize: '13px' }}></i>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bên Phải: ThemeToggle + Quản Trị + User Profile / Đăng Nhập */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <ThemeToggle />

        {/* Quản trị đã có ở menu trái trên laptop và menu đáy trên mobile */}

        {token ? (
          <div
            onClick={() => handleNavClick('account')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              padding: '4px 10px 4px 6px',
              borderRadius: '24px',
              background: 'var(--bg-main, #f8fafc)',
              border: '1px solid var(--border-color, #e2e8f0)',
              transition: 'all 0.2s ease'
            }}
            title="Tài khoản & Zalo ID"
          >
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
                fontSize: '12px',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {(user?.fullName || user?.name || 'U').substring(0, 1).toUpperCase()}
              </div>
            )}
            <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-bright)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.fullName || user?.name || user?.email?.split('@')[0] || 'Cá nhân'}
            </span>
          </div>
        ) : (
          <button
            onClick={() => { setView('login'); window.history.pushState({}, '', '/?view=login'); }}
            className="hide-on-mobile"
            style={{
              padding: '7px 16px',
              borderRadius: '20px',
              border: '1.5px solid var(--color-primary, #ea580c)',
              background: 'transparent',
              color: 'var(--color-primary, #ea580c)',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease'
            }}
          >
            Đăng nhập
          </button>
        )}
      </div>
    </header>
  );
}
