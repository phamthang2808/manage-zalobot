import { createContext, useContext, useEffect, useState } from 'react';

export const API_URL_ROOT = import.meta.env.PROD ? "" : (import.meta.env.VITE_API_URL || 'http://localhost:8080');
export const API_BASE = `${API_URL_ROOT}/api/admin`;

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // Auth
  const [token, setToken] = useState(() => sessionStorage.getItem('adminToken') || '');
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('adminUser');
    try { return saved ? JSON.parse(saved) : null; } catch (e) { return null; }
  });

  // Navigation
  const [view, setView] = useState(() => {
    const path = window.location.pathname;
    if (path.includes('/lookup') || path.includes('/tra-cuu') || window.location.search.includes('view=lookup') || window.location.hash.includes('lookup')) return 'lookup';
    if (path.includes('/login') || window.location.search.includes('view=login') || window.location.hash.includes('login')) return 'login';
    return sessionStorage.getItem('adminView') || 'home';
  });
  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('adminTab') || 'dashboard');

  // Theme
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  // Admin data
  const [stats, setStats] = useState({ totalMembers: 0, totalOrders: 0, totalCommission: 0, pendingPayoutsCount: 0, totalWithdrawn: 0 });
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  };
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Window width
  const [windowWidth, setWindowWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.isAdmin || false;

  // Fetch admin data
  const fetchData = async (currentToken, currentUser) => {
    if (!currentToken) return;
    const isAdminUser = currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN');
    if (!isAdminUser) { setLoading(false); return; }

    setLoading(true);
    setError(null);
    try {
      const opts = { credentials: 'include' };
      const [statsRes, usersRes, ordersRes, payoutsRes] = await Promise.all([
        fetch(`${API_BASE}/stats`, opts),
        fetch(`${API_BASE}/users`, opts),
        fetch(`${API_BASE}/orders`, opts),
        fetch(`${API_BASE}/payouts`, opts),
      ]);
      if (statsRes.status === 401 || statsRes.status === 403) { handleLogout(); return; }
      if (!statsRes.ok) throw new Error('Không thể tải dữ liệu thống kê');
      if (!usersRes.ok) throw new Error('Không thể tải danh sách thành viên');
      if (!ordersRes.ok) throw new Error('Không thể tải danh sách đơn hàng');
      if (!payoutsRes.ok) throw new Error('Không thể tải yêu cầu rút tiền');
      setStats(await statsRes.json());
      setUsers(await usersRes.json());
      setOrders(await ordersRes.json());
      setPayouts(await payoutsRes.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL_ROOT}/api/users/logout`, { method: 'POST', credentials: 'include' });
    } catch (e) { /* ignore */ }
    setToken('');
    setUser(null);
    setView('home');
    sessionStorage.removeItem('adminView');
    sessionStorage.removeItem('adminTab');
    sessionStorage.removeItem('adminUser');
    sessionStorage.removeItem('adminToken');
    setStats({ totalMembers: 0, totalOrders: 0, totalCommission: 0, pendingPayoutsCount: 0, totalWithdrawn: 0 });
    setUsers([]); setOrders([]); setPayouts([]);
  };

  useEffect(() => {
    if (token && user) fetchData(token, user);
  }, [token, user]);

  // SEO document title
  useEffect(() => {
    const titles = {
      home: '28Symues Affiliate - Tự Động Hóa Hoàn Tiền Shopee Qua Zalo',
      lookup: 'Tra Cứu Đơn Hàng Shopee | 28Symues Affiliate',
      login: 'Đăng Nhập | 28Symues Affiliate',
      admin: 'Dashboard Quản Trị | 28Symues Affiliate'
    };
    document.title = titles[view] || titles.home;
  }, [view]);

  // Scroll to top on view change
  useEffect(() => { window.scrollTo(0, 0); }, [view]);

  const handleApprovePayout = async (payoutId) => {
    try {
      const res = await fetch(`${API_BASE}/payouts/${payoutId}/approve`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Duyệt rút tiền thất bại');
      }
      showToast('Đã phê duyệt rút tiền thành công!', 'success');
      fetchData(token, user);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <AppContext.Provider value={{
      token, setToken, user, setUser,
      view, setView, activeTab, setActiveTab,
      theme, toggleTheme,
      stats, users, orders, payouts,
      loading, error,
      toast, showToast, setToast,
      sidebarOpen, setSidebarOpen,
      mobileMenuOpen, setMobileMenuOpen,
      windowWidth, isAdmin,
      fetchData, handleLogout, handleApprovePayout,
      API_URL_ROOT, API_BASE,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
