import React from 'react';
import { useApp } from '../../context/AppContext';
import ThemeToggle from './ThemeToggle';

export default function UserSidebar({ sidebarOpen, setSidebarOpen }) {
  const { view, setView, user, isAdmin, handleLogout, showConfirm } = useApp();

  const mainNavTabs = [
    { id: 'lookup', label: 'Tra cứu đơn hàng', icon: 'fa-solid fa-magnifying-glass' },
    { id: 'pricing', label: 'Bảng giá dịch vụ', icon: 'fa-solid fa-tags' },
    { id: 'blog', label: 'Blog kiến thức', icon: 'fa-regular fa-newspaper' }
  ];

  const memberItems = [
    { id: 'convert', label: 'Chuyển đổi', icon: 'fa-solid fa-link' },
    { id: 'orders', label: 'Đơn hàng', icon: 'fa-solid fa-boxes-stacked' },
    { id: 'withdraw', label: 'Ví tiền', icon: 'fa-solid fa-wallet' },
    { id: 'account', label: 'Tài khoản', icon: 'fa-solid fa-id-card' },
    ...(isAdmin ? [{ id: 'admin', label: 'Trang Quản Trị', icon: 'fa-solid fa-shield-halved' }] : [])
  ];

  const handleItemClick = (itemId) => {
    if (itemId === 'pricing') {
      if (view !== 'home' && view !== 'landing') {
        setView('home');
        window.history.pushState({}, '', '/');
        setTimeout(() => {
          document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      } else {
        document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
      }
      if (setSidebarOpen) setSidebarOpen(false);
      return;
    }

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

  const renderNavList = (items) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      {items.map(item => {
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
              padding: '9px 12px',
              borderRadius: '12px',
              border: 'none',
              background: isActive ? 'linear-gradient(135deg, #f97316, #ea580c)' : 'transparent',
              color: isActive ? '#ffffff' : 'var(--text-secondary, #64748b)',
              fontWeight: isActive ? '500' : '400',
              fontSize: '13.5px',
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              textAlign: 'left',
              boxShadow: isActive ? '0 3px 12px rgba(249, 115, 22, 0.25)' : 'none',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              if (!isActive) {
                e.currentTarget.style.background = 'var(--bg-main, rgba(148, 163, 184, 0.08))';
                e.currentTarget.style.color = 'var(--color-primary, #ea580c)';
                const icon = e.currentTarget.querySelector('i');
                if (icon) icon.style.color = '#ea580c';
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary, #64748b)';
                const icon = e.currentTarget.querySelector('i');
                if (icon) icon.style.color = 'var(--text-muted, #94a3b8)';
              }
            }}
          >
            <i 
              className={item.icon} 
              style={{ 
                color: isActive ? '#ffffff' : 'var(--text-muted, #94a3b8)', 
                fontSize: '14px',
                width: '20px',
                textAlign: 'center',
                flexShrink: 0,
                transition: 'color 0.2s ease'
              }}
            />
            <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      {sidebarOpen && (
        <div 
          className="user-sidebar-overlay" 
          onClick={() => setSidebarOpen(false)}
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
        zIndex: 100000,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px 16px',
        boxSizing: 'border-box',
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.04)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <div style={{ overflowY: 'auto', paddingRight: '2px', flex: 1 }}>
          {/* Logo Brand Header */}
          <div 
            onClick={() => { setView('home'); window.history.pushState({}, '', '/'); if (setSidebarOpen) setSidebarOpen(false); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              marginBottom: '20px',
              padding: '6px 0'
            }}
          >
            <img 
              src="/28symueslogomanin.png?v=7" 
              alt="28Symues Logo" 
              style={{ height: '58px', width: 'auto', maxWidth: '100%', objectFit: 'contain' }} 
            />
          </div>

          {/* Section 1: MENU ĐIỀU HƯỚNG CHÍNH (Trang chủ, Tra cứu, Bảng giá, Blog) - CHỈ HIỂN THỊ TRÊN MOBILE */}
          <div className="show-on-mobile" style={{ marginBottom: '18px' }}>
            <div style={{
              fontSize: '11px',
              fontWeight: '600',
              textTransform: 'uppercase',
              color: 'var(--text-muted, #94a3b8)',
              letterSpacing: '0.6px',
              padding: '0 12px 8px 12px',
              fontFamily: 'var(--font-sans)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <i className="fa-solid fa-compass" style={{ fontSize: '11px' }}></i>
              <span>Menu Điều Hướng</span>
            </div>
            {renderNavList(mainNavTabs)}
          </div>

          {/* Section 2: TIỆN ÍCH THÀNH VIÊN - CHỈ HIỂN THỊ TRÊN LAPTOP / DESKTOP (vì Mobile đã có Bottom Nav) */}
          <div className="hide-on-mobile" style={{ marginBottom: '16px' }}>
            <div style={{
              fontSize: '11px',
              fontWeight: '600',
              textTransform: 'uppercase',
              color: 'var(--text-muted, #94a3b8)',
              letterSpacing: '0.6px',
              padding: '0 12px 8px 12px',
              fontFamily: 'var(--font-sans)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <i className="fa-solid fa-user-gear" style={{ fontSize: '11px' }}></i>
              <span>Tiện Ích Thành Viên</span>
            </div>
            {renderNavList(memberItems)}
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
                <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-bright)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'var(--font-sans)' }}>
                  {user?.fullName || 'Thành viên'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', fontFamily: 'var(--font-sans)' }}>
                  {user?.role || 'MEMBER'}
                </div>
              </div>
            </div>

            <ThemeToggle />
          </div>

          <button
            onClick={async () => {
              const confirmed = await showConfirm({
                title: 'Đăng xuất tài khoản',
                message: 'Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?',
                confirmText: 'Đăng xuất',
                cancelText: 'Hủy bỏ'
              });
              if (confirmed) {
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
              color: 'var(--text-muted, #64748b)',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '500',
              fontFamily: 'var(--font-sans)',
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
