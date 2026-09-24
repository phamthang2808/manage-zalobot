import { useApp } from '../../context/AppContext';
import ThemeToggle from '../common/ThemeToggle';

export default function Sidebar() {
  const { activeTab, setActiveTab, setView, setSidebarOpen, sidebarOpen, handleLogout, user, stats } = useApp();

  return (
    <>
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src="/28symueslogomanin.png?v=7" alt="28Symues Admin Logo" style={{ height: '64px', width: 'auto', maxWidth: '100%', objectFit: 'contain' }} />
          </div>
        </div>
        <ul className="sidebar-menu">
          <li
            className="menu-item sidebar-home-item"
            onClick={() => { setView('home'); sessionStorage.removeItem('adminView'); setSidebarOpen(false); }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
              <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z"/>
              <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a.465.465 0 0 0 .091-.086L12 5.43Z"/>
            </svg>
            Về Trang Chủ
          </li>
          <li
            className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setActiveTab('dashboard'); sessionStorage.setItem('adminTab', 'dashboard'); sessionStorage.setItem('adminView', 'admin'); setSidebarOpen(false); }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
              <polyline points="16 7 22 7 22 13"/>
            </svg>
            Tổng quan
          </li>
          <li
            className={`menu-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => { setActiveTab('users'); sessionStorage.setItem('adminTab', 'users'); sessionStorage.setItem('adminView', 'admin'); setSidebarOpen(false); }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            Thành viên
          </li>
          <li
            className={`menu-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => { setActiveTab('orders'); sessionStorage.setItem('adminTab', 'orders'); sessionStorage.setItem('adminView', 'admin'); setSidebarOpen(false); }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              <polyline points="14 10 12 14 10 10"/>
            </svg>
            Đơn hàng
          </li>
          <li
            className={`menu-item ${activeTab === 'payouts' ? 'active' : ''}`}
            onClick={() => { setActiveTab('payouts'); sessionStorage.setItem('adminTab', 'payouts'); sessionStorage.setItem('adminView', 'admin'); setSidebarOpen(false); }}
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            <span style={{ flex: 1 }}>Rút tiền</span>
            {stats.pendingPayoutsCount > 0 && (
              <span style={{ background: '#ef4444', color: '#fff', fontSize: '10px', padding: '2px 7px', borderRadius: '20px', fontWeight: 'bold', lineHeight: '1.4' }}>
                {stats.pendingPayoutsCount}
              </span>
            )}
          </li>
        </ul>

        <div className="sidebar-footer" style={{ padding: '12px 16px 85px', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', padding: '10px 12px', background: 'var(--bg-main)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" referrerPolicy="no-referrer"
                style={{ width: '34px', height: '34px', borderRadius: '50%', border: '2px solid #fed7aa', flexShrink: 0 }} />
            ) : (
              <div className="avatar" style={{ margin: 0, width: '34px', height: '34px', fontSize: '12px', flexShrink: 0 }}>
                {(user?.fullName || 'PT').substring(0, 2).toUpperCase()}
              </div>
            )}
            <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-bright)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.fullName}</div>
              <div style={{ fontSize: '10px', color: '#ea580c', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{user?.role}</div>
            </div>
          </div>
          <ThemeToggle style={{ width: '100%', marginBottom: '8px', justifyContent: 'center' }} />
          <button
            onClick={handleLogout}
            style={{ width: '100%', fontSize: '13px', padding: '10px', background: 'var(--color-primary-light)', color: '#ea580c', border: '1px solid var(--color-primary-border)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', transition: 'all 0.2s', letterSpacing: '0.2px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Đăng xuất
          </button>
        </div>
      </aside>
    </>
  );
}
