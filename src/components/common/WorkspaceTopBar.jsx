import React from 'react';
import { useApp } from '../../context/AppContext';
import ThemeToggle from './ThemeToggle';

export default function WorkspaceTopBar({ setSidebarOpen }) {
  const { view, setView, user, isAdmin } = useApp();

  const getPageTitle = () => {
    switch (view) {
      case 'convert': return { title: 'Chuyển Đổi Link Tiếp Thị', icon: 'fa-solid fa-bolt', color: '#f59e0b' };
      case 'orders': return { title: 'Đơn Hàng Đã Đặt', icon: 'fa-solid fa-boxes-stacked', color: '#0284c7' };
      case 'withdraw': return { title: 'Ví Tiền & Yêu Cầu Rút', icon: 'fa-solid fa-wallet', color: '#10b981' };
      case 'account': return { title: 'Tài Khoản & Liên Kết Zalo ID', icon: 'fa-solid fa-user-circle', color: '#8b5cf6' };
      default: return { title: 'Không Gian Tiện Ích', icon: 'fa-solid fa-grid-2', color: '#ea580c' };
    }
  };

  const current = getPageTitle();

  return (
    <header className="workspace-topbar" style={{
      height: '65px',
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 90,
      backdropFilter: 'blur(10px)',
      boxSizing: 'border-box'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Mobile Sidebar Hamburger Toggle */}
        <button
          type="button"
          className="workspace-sidebar-toggle"
          onClick={() => setSidebarOpen(prev => !prev)}
          style={{
            display: 'none',
            background: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            width: '38px',
            height: '38px',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-main)',
            fontSize: '16px'
          }}
          aria-label="Toggle menu"
        >
          <i className="fa-solid fa-bars"></i>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(234,88,12,0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: current.color
          }}>
            <i className={current.icon} style={{ fontSize: '15px' }}></i>
          </div>
          <h1 style={{
            margin: 0,
            fontSize: '17px',
            fontWeight: '800',
            color: 'var(--text-bright)',
            fontFamily: 'var(--font-heading)'
          }}>
            {current.title}
          </h1>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <ThemeToggle />

        <button
          onClick={() => { setView('home'); window.history.pushState({}, '', '/'); }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 12px',
            background: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            fontSize: '12.5px',
            fontWeight: '600',
            color: 'var(--text-main)',
            cursor: 'pointer'
          }}
          title="Về trang chủ giới thiệu"
        >
          <i className="fa-solid fa-house" style={{ color: '#ea580c' }}></i>
          <span className="hide-on-mobile">Trang chủ</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => { setView('admin'); sessionStorage.setItem('adminView', 'admin'); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              color: '#fff',
              fontSize: '12.5px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(249,115,22,0.3)',
              whiteSpace: 'nowrap'
            }}
          >
            <i className="fa-solid fa-shield-halved"></i>
            <span className="hide-on-mobile">Quản trị</span>
          </button>
        )}
      </div>
    </header>
  );
}
