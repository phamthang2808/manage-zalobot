import { useApp } from '../../context/AppContext';
import ThemeToggle from '../common/ThemeToggle';

export default function DashboardHeader({ activeTab, fetchData }) {
  const { user, setSidebarOpen, sidebarOpen, token } = useApp();

  return (
    <header className="dashboard-header">
      <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle sidebar">
        <span></span><span></span><span></span>
      </button>
      <h1 className="header-title">
        {activeTab === 'dashboard' && 'Bảng Điều Khiển Tổng Quan'}
        {activeTab === 'users' && 'Quản Lý Thành Viên'}
        {activeTab === 'orders' && 'Danh Sách Đơn Hàng Tiếp Thị'}
        {activeTab === 'payouts' && 'Danh Sách Yêu Cầu Rút Tiền'}
      </h1>
      <div className="admin-profile">
        <span className="admin-name">{user?.fullName || 'Admin'}</span>
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt="Avatar" referrerPolicy="no-referrer"
            style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--border-color)' }} />
        ) : (
          <div className="avatar">{(user?.fullName || 'PT').substring(0, 2).toUpperCase()}</div>
        )}
        <ThemeToggle style={{ marginLeft: '8px' }} />
        <button
          className="btn btn-refresh"
          onClick={(e) => {
            const svg = e.currentTarget.querySelector('svg');
            if (svg) {
              svg.style.transform = 'rotate(360deg)';
              svg.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
              setTimeout(() => { svg.style.transform = 'none'; svg.style.transition = 'none'; }, 600);
            }
            fetchData(token, user);
          }}
          style={{ marginLeft: '8px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--color-primary-light)', color: '#ea580c', border: '1px solid var(--color-primary-border)', fontWeight: '600', fontSize: '13.5px', borderRadius: '8px', transition: 'all 0.2s ease', cursor: 'pointer' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.5s ease' }}>
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l.73-.73"/>
          </svg>
          Làm mới
        </button>
      </div>
    </header>
  );
}
