import { useApp } from '../../context/AppContext';
import ThemeToggle from '../common/ThemeToggle';

export default function MobileBottomNav() {
  const { view, setView, activeTab, setActiveTab, isAdmin, token, user, handleLogout, stats } = useApp();
  const isNavAdminMode = view === 'admin';

  const scrollToSection = (id) => {
    if (view !== 'home') {
      setView('home');
      setTimeout(() => {
        const elem = document.getElementById(id);
        if (elem) elem.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const elem = document.getElementById(id);
      if (elem) elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

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
          <div className="nav-icon-wrap"><i className="fa-solid fa-robot"></i></div>
          <span className="nav-label">Bot Zalo</span>
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

  // If user is logged in and using portal views:
  if (token && (view === 'convert' || view === 'orders' || view === 'withdraw' || view === 'account')) {
    return (
      <nav className="mobile-bottom-nav">
        <button type="button" className={`mobile-bottom-nav-item${view === 'convert' ? ' active' : ''}`}
          onClick={() => { setView('convert'); window.history.pushState({}, '', '/?view=convert'); window.scrollTo(0, 0); }}>
          <div className="nav-icon-wrap"><i className="fa-solid fa-bolt"></i></div>
          <span className="nav-label">Đổi Link</span>
        </button>
        <button type="button" className={`mobile-bottom-nav-item${view === 'orders' ? ' active' : ''}`}
          onClick={() => { setView('orders'); window.history.pushState({}, '', '/?view=orders'); window.scrollTo(0, 0); }}>
          <div className="nav-icon-wrap"><i className="fa-solid fa-boxes-stacked"></i></div>
          <span className="nav-label">Đơn Hàng</span>
        </button>
        <button type="button" className={`mobile-bottom-nav-item${view === 'withdraw' ? ' active' : ''}`}
          onClick={() => { setView('withdraw'); window.history.pushState({}, '', '/?view=withdraw'); window.scrollTo(0, 0); }}>
          <div className="nav-icon-wrap"><i className="fa-solid fa-wallet"></i></div>
          <span className="nav-label">Ví Tiền</span>
        </button>
        <button type="button" className={`mobile-bottom-nav-item${view === 'account' ? ' active' : ''}`}
          onClick={() => { setView('account'); window.history.pushState({}, '', '/?view=account'); window.scrollTo(0, 0); }}>
          <div className="nav-icon-wrap"><i className="fa-solid fa-user-circle"></i></div>
          <span className="nav-label">Tài Khoản</span>
        </button>
        {isAdmin && (
          <button type="button" className="mobile-bottom-nav-item"
            onClick={() => { setView('admin'); sessionStorage.setItem('adminView', 'admin'); window.scrollTo(0, 0); }}>
            <div className="nav-icon-wrap"><i className="fa-solid fa-shield-halved"></i></div>
            <span className="nav-label">Quản Trị</span>
          </button>
        )}
      </nav>
    );
  }

  return (
    <nav className="mobile-bottom-nav">
      <button type="button" className={`mobile-bottom-nav-item${view === 'home' ? ' active' : ''}`}
        onClick={() => { setView('home'); window.history.pushState({}, '', '/'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
        <div className="nav-icon-wrap"><i className="fa-solid fa-house"></i></div>
        <span className="nav-label">Trang chủ</span>
      </button>
      <button type="button" className={`mobile-bottom-nav-item${view === 'lookup' ? ' active' : ''}`}
        onClick={() => { setView('lookup'); window.history.pushState({}, '', '/?view=lookup'); window.scrollTo(0, 0); }}>
        <div className="nav-icon-wrap"><i className="fa-solid fa-magnifying-glass"></i></div>
        <span className="nav-label">Tra cứu</span>
      </button>
      <button type="button" className={`mobile-bottom-nav-item${view === 'convert' ? ' active' : ''}`}
        onClick={() => {
          if (token) {
            setView('convert');
            window.history.pushState({}, '', '/?view=convert');
          } else {
            setView('login');
            window.history.pushState({}, '', '/?view=login');
          }
          window.scrollTo(0, 0);
        }}>
        <div className="nav-icon-wrap"><i className="fa-solid fa-bolt"></i></div>
        <span className="nav-label">Đổi link</span>
      </button>
      <a href="https://zalo.me/g/0p083nqqoordpki9zgvy" target="_blank" rel="noreferrer"
        className="mobile-bottom-nav-item" title="Nhắn tin với Bot Zalo hoàn tiền">
        <div className="nav-icon-wrap"><i className="fa-solid fa-comment-dots"></i></div>
        <span className="nav-label">Bot Zalo</span>
      </a>
      {isAdmin ? (
        <button type="button" className={`mobile-bottom-nav-item${view === 'admin' ? ' active' : ''}`}
          onClick={() => { setView('admin'); sessionStorage.setItem('adminView', 'admin'); window.scrollTo(0, 0); }}>
          <div className="nav-icon-wrap"><i className="fa-solid fa-shield-halved"></i></div>
          <span className="nav-label">Quản trị</span>
        </button>
      ) : token ? (
        <button type="button" className={`mobile-bottom-nav-item${view === 'account' ? ' active' : ''}`}
          onClick={() => { setView('account'); window.history.pushState({}, '', '/?view=account'); window.scrollTo(0, 0); }}>
          <div className="nav-icon-wrap">
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt="User" referrerPolicy="no-referrer" style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} />
              : <i className="fa-solid fa-user"></i>}
          </div>
          <span className="nav-label">{user?.fullName?.split(' ')[user.fullName.split(' ').length - 1] || 'Cá nhân'}</span>
        </button>
      ) : (
        <button type="button" className={`mobile-bottom-nav-item${view === 'login' ? ' active' : ''}`}
          onClick={() => { setView('login'); window.history.pushState({}, '', '/?view=login'); window.scrollTo(0, 0); }}>
          <div className="nav-icon-wrap"><i className="fa-solid fa-right-to-bracket"></i></div>
          <span className="nav-label">Đăng nhập</span>
        </button>
      )}
    </nav>
  );
}
