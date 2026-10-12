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
    const search = window.location.search;
    const hash = window.location.hash;
    if (path.includes('/lookup') || path.includes('/tra-cuu') || search.includes('view=lookup') || hash.includes('lookup')) return 'lookup';
    if (path.includes('/login') || search.includes('view=login') || hash.includes('login')) return 'login';
    if (path.includes('/convert') || search.includes('view=convert')) return 'convert';
    if (path.includes('/orders') || search.includes('view=orders')) return 'orders';
    if (path.includes('/withdraw') || search.includes('view=withdraw')) return 'withdraw';
    if (path.includes('/account') || search.includes('view=account')) return 'account';
    return sessionStorage.getItem('adminView') || 'home';
  });

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const search = window.location.search;
      const hash = window.location.hash;
      if (path.includes('/lookup') || path.includes('/tra-cuu') || search.includes('view=lookup') || hash.includes('lookup')) {
        setView('lookup');
      } else if (path.includes('/login') || search.includes('view=login') || hash.includes('login')) {
        setView('login');
      } else if (path.includes('/convert') || search.includes('view=convert')) {
        setView('convert');
      } else if (path.includes('/orders') || search.includes('view=orders')) {
        setView('orders');
      } else if (path.includes('/withdraw') || search.includes('view=withdraw')) {
        setView('withdraw');
      } else if (path.includes('/account') || search.includes('view=account')) {
        setView('account');
      } else if (path.includes('/admin') || search.includes('view=admin') || hash.includes('admin')) {
        setView('admin');
      } else {
        setView(sessionStorage.getItem('adminView') || 'home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('adminTab') || 'dashboard');

  // Theme
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    if (document.body) {
      document.body.classList.toggle('dark', theme === 'dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  // Admin data
  const [stats, setStats] = useState({ totalMembers: 0, totalOrders: 0, totalCommission: 0, pendingPayoutsCount: 0, totalWithdrawn: 0 });
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(false);
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

  // Check active session on startup & handle Google Redirect Hash & TikTok bypass
  useEffect(() => {
    // 1. TikTok redirect bypass
    const params = new URLSearchParams(window.location.search);
    const openTiktokProduct = params.get('open_tiktok_product');
    if (openTiktokProduct) {
      try {
        const decodedUrl = decodeURIComponent(openTiktokProduct);
        window.location.href = decodedUrl;
        return;
      } catch (e) { /* ignore */ }
    }

    // 2. Clear legacy tokens
    localStorage.removeItem('admin_token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    // 3. Handle Google Redirect Hash (#id_token=...)
    const handleRedirectHash = async () => {
      try {
        const hash = window.location.hash;
        if (hash && (hash.includes('id_token=') || hash.includes('access_token='))) {
          const p = new URLSearchParams(hash.substring(1));
          const idToken = p.get('id_token');
          if (idToken) {
            const res = await fetch(`${API_URL_ROOT}/api/users/google-login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: idToken }),
              credentials: 'include'
            });
            const result = await res.json();
            if (res.ok && result.data) {
              const authData = result.data;
              setToken('session-cookie');
              setUser(authData.user);
              sessionStorage.setItem('adminUser', JSON.stringify(authData.user));
              sessionStorage.setItem('adminToken', 'session-cookie');
              const isAdminUser = authData.user?.role === 'ADMIN' || authData.user?.role === 'SUPER_ADMIN' || authData.user?.isAdmin;
              if (isAdminUser) {
                setView('admin');
                sessionStorage.setItem('adminView', 'admin');
              } else {
                setView('home');
              }
              window.history.replaceState(null, null, window.location.pathname + window.location.search);
              showToast('Đăng nhập Google thành công!', 'success');
              return true;
            }
          }
        }
      } catch (e) { console.error("Google redirect error:", e); }
      return false;
    };

    // 4. Verify session cookie with backend
    const checkSession = async () => {
      const handledGoogle = await handleRedirectHash();
      if (handledGoogle) return;

      try {
        const res = await fetch(`${API_URL_ROOT}/api/users/profile`, { credentials: 'include' });
        if (res.ok) {
          const result = await res.json();
          setUser(result.data);
          setToken('session-cookie');
          sessionStorage.setItem('adminUser', JSON.stringify(result.data));
          sessionStorage.setItem('adminToken', 'session-cookie');
        }
      } catch (err) {
        /* Keep session user from sessionStorage on network failure */
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // Fetch admin data
  const fetchData = async (currentToken, currentUser) => {
    if (!currentToken || !currentUser) return;
    const isAdminUser = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN' || currentUser.isAdmin;
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
      if (statsRes.status === 401 || statsRes.status === 403) {
        setError('Phiên làm việc admin hết hạn hoặc không có quyền.');
        setLoading(false);
        return;
      }
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
    if (token && user && view === 'admin') {
      fetchData(token, user);
      const intervalId = setInterval(() => {
        fetchData(token, user);
      }, 60000); // Tự động làm mới dữ liệu 1 phút / lần
      return () => clearInterval(intervalId);
    }
  }, [token, user, view]);

  // SEO document title
  useEffect(() => {
    const titles = {
      home: '28Symues Affiliate - Tự Động Hóa Hoàn Tiền Shopee Qua Zalo',
      lookup: 'Tra Cứu Đơn Hàng Shopee & Zalo | 28Symues Affiliate',
      login: 'Đăng Nhập & Đăng Ký | 28Symues Affiliate',
      convert: 'Chuyển Đổi Link Shopee, TikTok, Lazada | 28Symues Affiliate',
      orders: 'Lịch Sử Đơn Hàng Tiếp Thị (Web & Zalo) | 28Symues Affiliate',
      withdraw: 'Ví Tiền Hoa Hồng & Yêu Cầu Rút Tiền | 28Symues Affiliate',
      account: 'Tài Khoản & Liên Kết Zalo ID | 28Symues Affiliate',
      admin: 'Dashboard Quản Trị Hệ Thống | 28Symues Affiliate'
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
