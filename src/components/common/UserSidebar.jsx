import React from 'react';
import { useApp } from '../../context/AppContext';
import ThemeToggle from './ThemeToggle';

export default function UserSidebar({ sidebarOpen, setSidebarOpen }) {
  const { view, setView, user, isAdmin, handleLogout } = useApp();

  const mainMenuItems = [
    { id: 'convert', label: 'Chuyển đổi link', icon: 'fa-solid fa-bolt', color: '#f59e0b' },
    { id: 'orders', label: 'Đơn hàng đã đặt', icon: 'fa-solid fa-boxes-stacked', color: '#0284c7' },
    { id: 'withdraw', label: 'Ví tiền & Rút tiền', icon: 'fa-solid fa-wallet', color: '#10b981' },
    { id: 'account', label: 'Thông tin cá nhân', icon: 'fa-solid fa-id-card', color: '#8b5cf6' },
  ];

  const subMenuItems = [
    { id: 'lookup', label: 'Tra cứu Zalo', icon: 'fa-solid fa-magnifying-glass', color: '#ea580c' },
    { id: 'home', label: 'Về Trang chủ', icon: 'fa-solid fa-house', color: '#64748b' },
  ];

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

          {/* Section: MENU TIỆN ÍCH WEB */}
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
              {mainMenuItems.map(item => {
                const isActive = view === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setView(item.id);
                      window.history.pushState({}, '', `/?view=${item.id}`);
                      if (setSidebarOpen) setSidebarOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
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
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-main)';
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
                      flexShrink: 0
                    }}>
                      <i className={item.icon} style={{ color: isActive ? '#fff' : item.color, fontSize: '13px' }}></i>
                    </div>
                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: KHÁC */}
          <div>
            <div style={{
              fontSize: '11px',
              fontWeight: '800',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              letterSpacing: '0.8px',
              padding: '0 12px 10px 12px'
            }}>
              Mục Khác
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {subMenuItems.map(item => {
                const isActive = view === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setView(item.id);
                      if (item.id === 'home') {
                        sessionStorage.removeItem('adminView');
                        window.history.pushState({}, '', '/');
                      } else {
                        window.history.pushState({}, '', `/?view=${item.id}`);
                      }
                      if (setSidebarOpen) setSidebarOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '14px',
                      border: 'none',
                      background: isActive ? 'var(--bg-main)' : 'transparent',
                      color: isActive ? '#ea580c' : 'var(--text-main)',
                      fontWeight: isActive ? '700' : '600',
                      fontSize: '13.5px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease'
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
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: 'var(--bg-main)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <i className={item.icon} style={{ color: item.color, fontSize: '13px' }}></i>
                    </div>
                    <span>{item.label}</span>
                  </button>
                );
              })}

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setView('admin');
                    sessionStorage.setItem('adminView', 'admin');
                    if (setSidebarOpen) setSidebarOpen(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: '14px',
                    border: '1.5px solid rgba(249, 115, 22, 0.4)',
                    background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.12), rgba(234, 88, 12, 0.06))',
                    color: '#ea580c',
                    fontWeight: '700',
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    marginTop: '6px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: '#ea580c',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <i className="fa-solid fa-shield-halved" style={{ fontSize: '12px' }}></i>
                  </div>
                  <span>Trang Quản Trị</span>
                </button>
              )}
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
