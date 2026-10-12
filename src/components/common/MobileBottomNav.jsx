import React from 'react';
import { useApp } from '../../context/AppContext';

export default function MobileBottomNav() {
  const { view, setView, activeTab, setActiveTab, isAdmin, token, user, stats } = useApp();
  const isNavAdminMode = view === 'admin';

  if (isNavAdminMode) {
    return (
      <nav className="mobile-bottom-nav">
        <button type="button" className={`mobile-bottom-nav-item${activeTab === 'dashboard' ? ' active' : ''}`}
          onClick={() => { setActiveTab('dashboard'); sessionStorage.setItem('adminTab', 'dashboard'); window.scrollTo(0, 0); }}>
          <div className="nav-icon-wrap"><i className="fa-solid fa-chart-pie"></i></div>
          <span className="nav-label">Tổng quan</span>
        </button>
        <button type="button" className={`mobile-bottom-nav-item${activeTab === 'users' ? ' active' : ''}`}
          onClick={() => { setActiveTab('users'); sessionStorage.setItem('adminTab', 'users'); window.scrollTo(0, 0); }}>
          <div className="nav-icon-wrap"><i className="fa-solid fa-address-book"></i></div>
          <span className="nav-label">User Zalo</span>
        </button>
        <button type="button" className={`mobile-bottom-nav-item${activeTab === 'web_users' ? ' active' : ''}`}
          onClick={() => { setActiveTab('web_users'); sessionStorage.setItem('adminTab', 'web_users'); window.scrollTo(0, 0); }}>
          <div className="nav-icon-wrap"><i className="fa-solid fa-users-gear"></i></div>
          <span className="nav-label">User Web</span>
        </button>
        <button type="button" className={`mobile-bottom-nav-item${activeTab === 'orders' || activeTab === 'lazada_orders' ? ' active' : ''}`}
          onClick={() => { setActiveTab('orders'); sessionStorage.setItem('adminTab', 'orders'); window.scrollTo(0, 0); }}>
          <div className="nav-icon-wrap"><i className="fa-solid fa-boxes-stacked"></i></div>
          <span className="nav-label">Đơn hàng</span>
        </button>
        <button type="button" className={`mobile-bottom-nav-item${activeTab === 'payouts' ? ' active' : ''}`}
          onClick={() => { setActiveTab('payouts'); sessionStorage.setItem('adminTab', 'payouts'); window.scrollTo(0, 0); }}>
          <div className="nav-icon-wrap">
            <i className="fa-solid fa-wallet"></i>
            {stats?.pendingPayoutsCount > 0 && <span className="mobile-nav-badge">{stats.pendingPayoutsCount}</span>}
          </div>
          <span className="nav-label">Rút tiền</span>
        </button>
        <button type="button" className="mobile-bottom-nav-item"
          onClick={() => { setView('home'); sessionStorage.removeItem('adminView'); window.scrollTo(0, 0); }}>
          <div className="nav-icon-wrap"><i className="fa-solid fa-house"></i></div>
          <span className="nav-label">Trang chủ</span>
        </button>
      </nav>
    );
  }

  // Giao diện điện thoại khách hàng: Chuyển link | Đơn hàng | Ví tiền | Tài khoản (+ Quản trị nếu là Admin)
  const handleCustomerTabClick = (targetView) => {
    if (targetView === 'account') {
      if (token) {
        setView('account');
        window.history.pushState({}, '', '/?view=account');
      } else {
        setView('login');
        window.history.pushState({}, '', '/?view=login');
      }
    } else {
      if (token) {
        setView(targetView);
        window.history.pushState({}, '', `/?view=${targetView}`);
      } else {
        setView('login');
        window.history.pushState({}, '', '/?view=login');
      }
    }
    window.scrollTo(0, 0);
  };

  return (
    <nav className="mobile-bottom-nav">
      <button type="button" className={`mobile-bottom-nav-item${view === 'home' || view === 'landing' ? ' active' : ''}`}
        onClick={() => {
          setView('home');
          sessionStorage.removeItem('adminView');
          window.history.pushState({}, '', '/');
          window.scrollTo(0, 0);
        }}>
        <div className="nav-icon-wrap"><i className="fa-solid fa-house"></i></div>
        <span className="nav-label">Trang chủ</span>
      </button>

      <button type="button" className={`mobile-bottom-nav-item${view === 'convert' ? ' active' : ''}`}
        onClick={() => handleCustomerTabClick('convert')}>
        <div className="nav-icon-wrap"><i className="fa-solid fa-link"></i></div>
        <span className="nav-label">Chuyển link</span>
      </button>

      <button type="button" className={`mobile-bottom-nav-item${view === 'orders' ? ' active' : ''}`}
        onClick={() => handleCustomerTabClick('orders')}>
        <div className="nav-icon-wrap"><i className="fa-solid fa-boxes-stacked"></i></div>
        <span className="nav-label">Đơn hàng</span>
      </button>

      <button type="button" className={`mobile-bottom-nav-item${view === 'withdraw' ? ' active' : ''}`}
        onClick={() => handleCustomerTabClick('withdraw')}>
        <div className="nav-icon-wrap"><i className="fa-solid fa-wallet"></i></div>
        <span className="nav-label">Ví tiền</span>
      </button>

      <button type="button" className={`mobile-bottom-nav-item${view === 'account' || (!token && view === 'login') ? ' active' : ''}`}
        onClick={() => handleCustomerTabClick('account')}>
        <div className="nav-icon-wrap">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="User" referrerPolicy="no-referrer" style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <i className="fa-solid fa-user"></i>
          )}
        </div>
        <span className="nav-label">Tài khoản</span>
      </button>

      {isAdmin && (
        <button type="button" className={`mobile-bottom-nav-item${view === 'admin' ? ' active' : ''}`}
          onClick={() => { setView('admin'); sessionStorage.setItem('adminView', 'admin'); window.scrollTo(0, 0); }}>
          <div className="nav-icon-wrap"><i className="fa-solid fa-shield-halved"></i></div>
          <span className="nav-label">Quản trị</span>
        </button>
      )}
    </nav>
  );
}
