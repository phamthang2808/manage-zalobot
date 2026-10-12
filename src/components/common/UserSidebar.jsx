import React from 'react';
import { useApp } from '../../context/AppContext';
import ThemeToggle from './ThemeToggle';

export default function UserSidebar({ sidebarOpen, setSidebarOpen }) {
  const { view, setView, user, isAdmin, handleLogout } = useApp();

  const menuItems = [
    { id: 'home', label: 'Về Trang chủ', icon: 'fa-solid fa-house' },
    { id: 'convert', label: 'Chuyển đổi link', icon: 'fa-solid fa-bolt' },
    { id: 'orders', label: 'Đơn hàng đã đặt', icon: 'fa-solid fa-boxes-stacked' },
    { id: 'withdraw', label: 'Ví tiền & Rút tiền', icon: 'fa-solid fa-wallet' },
    { id: 'account', label: 'Thông tin cá nhân', icon: 'fa-solid fa-id-card' },
    ...(isAdmin ? [{ id: 'admin', label: 'Trang Quản Trị', icon: 'fa-solid fa-shield-halved' }] : [])
  ];

  const handleItemClick = (itemId) => {
    if (itemId === 'home') {
      setView('home');
      sessionStorage.removeItem('adminView');
      window.history.pushState({}, '', '/');
    } else if (itemId === 'admin') {
      setView('admin');
      sessionStorage.setItem('adminView', 'admin');
    } else {
      setView(itemId);
      window.history.pushState({}, '', `/?view=${itemId}`);
    }
    if (setSidebarOpen) setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isItemActive = (itemId) => {
    if (itemId === 'home') return view === 'home' || view === 'landing';
    return view === itemId;
  };

  return (
    <>
      {sidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(4px)',
            zIndex: 998
          }}
        />
      )}

      <aside className={`user-sidebar ${sidebarOpen ? 'open' : ''}`} style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: '260px',
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border-color)',
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px 16px',
        boxSizing: 'border-box',
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.04)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <div>
          {/* Logo Brand Header */}
          <div 
            onClick={() => { setView('home'); window.history.pushState({}, '', '/'); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              marginBottom: '24px',
              padding: '6px 0'
            }}
          >
            <img 
              src="/28symueslogomanin.png?v=7" 
              alt="28Symues Logo" 
              style={{ height: '62px', width: 'auto', maxWidth: '100%', objectFit: 'contain' }} 
            />
          </div>

          {/* Section: MENU TIỆN ÍCH */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              fontSize: '11px',
              fontWeight: '800',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              letterSpacing: '0.8px',
              padding: '0 12px 10px 12px'
            }}>
              Tiện Ích Thành Viên
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {menuItems.map(item => {
                const isActive = isItemActive(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleItemClick(item.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '11px 14px',
                      borderRadius: '14px',
                      border: 'none',
                      background: isActive ? 'linear-gradient(135deg, #f97316, #ea580c)' : 'transparent',
                      color: isActive ? '#ffffff' : 'var(--text-main)',
                      fontWeight: isActive ? '700' : '600',
                      fontSize: '14px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      boxShadow: isActive ? '0 4px 14px rgba(249, 115, 22, 0.35)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'var(--bg-main)';
                        e.currentTarget.style.color = '#ea580c';
                        const icon = e.currentTarget.querySelector('i');
                        if (icon) icon.style.color = '#ea580c';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-main)';
                        const icon = e.currentTarget.querySelector('i');
                        if (icon) icon.style.color = 'var(--text-muted, #64748b)';
                      }
                    }}
                  >
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: isActive ? 'rgba(255, 255, 255, 0.2)' : 'var(--bg-main)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.2s ease'
                    }}>
                      <i className={item.icon} style={{ color: isActive ? '#ffffff' : 'var(--text-muted, #64748b)', fontSize: '13px' }}></i>
                    </div>
                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom User Info & Logout */}
        <div style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div 
              onClick={() => { setView('account'); window.history.pushState({}, '', '/?view=account'); if (setSidebarOpen) setSidebarOpen(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, cursor: 'pointer' }}
              title="Xem & sửa thông tin cá nhân"
            >
              {user?.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt="Avatar" 
                  referrerPolicy="no-referrer"
                  style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }} 
                />
              ) : (
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: '700'
                }}>
                  {(user?.fullName || 'U').substring(0, 1).toUpperCase()}
                </div>
              )}
              <div style={{ minWidth: 0, textAlign: 'left' }}>
                <div style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-bright)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.fullName || 'Thành viên'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {user?.role || 'MEMBER'}
                </div>
              </div>
            </div>

            <ThemeToggle />
          </div>

          <button
            onClick={() => {
              if (window.confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
                handleLogout();
              }
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '9px 12px',
              background: 'var(--bg-main)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#ef4444';
              e.currentTarget.style.borderColor = '#fca5a5';
              e.currentTarget.style.background = '#fef2f2';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.background = 'var(--bg-main)';
            }}
          >
            <i className="fa-solid fa-right-from-bracket"></i>
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
}
