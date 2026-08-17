import { useEffect, useState } from 'react';
import ThemeToggle from './components/common/ThemeToggle';
import RunningCatMascot from './components/common/RunningCatMascot';
import OrdersTab from './components/dashboard/OrdersTab';

const API_URL_ROOT = import.meta.env.PROD ? "" : (import.meta.env.VITE_API_URL || 'http://localhost:8080');

const API_BASE = `${API_URL_ROOT}/api/admin`;

function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem('adminToken') || '');
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('adminUser');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('adminTab') || 'dashboard');
  const [view, setView] = useState(() => {
    const path = window.location.pathname;
    if (path.includes('/lookup') || path.includes('/tra-cuu') || window.location.search.includes('view=lookup') || window.location.hash.includes('lookup')) {
      return 'lookup';
    }
    if (path.includes('/login') || window.location.search.includes('view=login') || window.location.hash.includes('login')) {
      return 'login';
    }
    return sessionStorage.getItem('adminView') || 'home';
  });

  // Public Lookup States
  const [lookupSearchType, setLookupSearchType] = useState('ORDER_ID');
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupStartDate, setLookupStartDate] = useState('');
  const [lookupEndDate, setLookupEndDate] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);

  useEffect(() => {
    if (view === 'home') {
      const observerCallback = (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      };

      const observerOptions = {
        threshold: 0,
        rootMargin: '100px 0px 100px 0px'
      };

      const observer = new IntersectionObserver(observerCallback, observerOptions);
      const elements = document.querySelectorAll('.reveal-on-scroll');
      elements.forEach(el => {
        if (window.innerWidth <= 768) {
          el.classList.add('revealed');
        } else {
          observer.observe(el);
        }
      });

      return () => observer.disconnect();
    }
  }, [view]);
  const [lookupError, setLookupError] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupRecentSearches, setLookupRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem('recentLookups');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [lookupLocalFilter, setLookupLocalFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('ALL');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cfStatus, setCfStatus] = useState('verifying');
  const [windowWidth, setWindowWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.isAdmin || false;

  useEffect(() => {
    if (view === 'login') {
      setCfStatus('verifying');
      const timer = setTimeout(() => {
        setCfStatus('success');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [view]);

  // Scroll to top on view changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  // Dynamic SEO document title per view
  useEffect(() => {
    const titles = {
      home: '28Symues Affiliate - Tự Động Hóa Hoàn Tiền Shopee Qua Zalo',
      lookup: 'Tra Cứu Đơn Hàng Shopee | 28Symues Affiliate',
      login: 'Đăng Nhập | 28Symues Affiliate',
      dashboard: 'Dashboard Quản Trị | 28Symues Affiliate'
    };
    document.title = titles[view] || titles.home;
  }, [view]);

  // Public Lookup Actions States
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [editBankName, setEditBankName] = useState('');
  const [editAccountNumber, setEditAccountNumber] = useState('');
  const [bankSaveError, setBankSaveError] = useState('');
  const [bankSaveLoading, setBankSaveLoading] = useState(false);

  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutSaveError, setPayoutSaveError] = useState('');
  const [payoutSaveLoading, setPayoutSaveLoading] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(false);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpActionType, setOtpActionType] = useState(''); // 'BANK' or 'PAYOUT'
  const [otpCode, setOtpCode] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [showBanner, setShowBanner] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Custom Toast Notification State
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalOrders: 0,
    totalCommission: 0,
    pendingPayoutsCount: 0,
    totalWithdrawn: 0
  });
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payouts, setPayouts] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search filters
  const [userSearch, setUserSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [payoutSearch, setPayoutSearch] = useState('');

  // Modal State
  const [selectedUser, setSelectedUser] = useState(null);

  // Fetch all data
  const fetchData = async (currentToken, currentUser) => {
    console.log(">>> [fetchData] currentToken:", currentToken, "currentUser:", currentUser);
    if (!currentToken) {
      console.log(">>> [fetchData] No currentToken, returning.");
      return;
    }
    
    const isAdmin = currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN');
    console.log(">>> [fetchData] isAdmin:", isAdmin);
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const fetchOpts = { credentials: 'include' };

      // Fetch stats
      console.log(">>> [fetchData] fetching admin stats...");
      const statsRes = await fetch(`${API_BASE}/stats`, fetchOpts);
      console.log(">>> [fetchData] stats response status:", statsRes.status);
      if (statsRes.status === 401 || statsRes.status === 403) {
        console.log(">>> [fetchData] 401/403 statsRes status, calling handleLogout()");
        handleLogout();
        return;
      }
      if (!statsRes.ok) throw new Error('Không thể tải dữ liệu thống kê');
      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch users
      const usersRes = await fetch(`${API_BASE}/users`, fetchOpts);
      if (!usersRes.ok) throw new Error('Không thể tải danh sách thành viên');
      const usersData = await usersRes.json();
      setUsers(usersData);

      // Fetch orders
      const ordersRes = await fetch(`${API_BASE}/orders`, fetchOpts);
      if (!ordersRes.ok) throw new Error('Không thể tải danh sách đơn hàng');
      const ordersData = await ordersRes.json();
      setOrders(ordersData);

      // Fetch payouts
      const payoutsRes = await fetch(`${API_BASE}/payouts`, fetchOpts);
      if (!payoutsRes.ok) throw new Error('Không thể tải yêu cầu rút tiền');
      const payoutsData = await payoutsRes.json();
      setPayouts(payoutsData);

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Check active session on startup & handle open_tiktok_product redirect
  useEffect(() => {
    // Check if redirecting to TikTok Shop product (Bypass Zalo Browser)
    const params = new URLSearchParams(window.location.search);
    const openTiktokProduct = params.get('open_tiktok_product');
    if (openTiktokProduct) {
      try {
        const decodedUrl = decodeURIComponent(openTiktokProduct);
        console.log(">>> [TikTok Bypass] Redirecting user to decoded URL:", decodedUrl);
        window.location.href = decodedUrl;
        return;
      } catch (e) {
        console.error(">>> [TikTok Bypass] Error decoding product URL:", e);
      }
    }

    // Clear legacy tokens from localStorage to prevent token exposure
    localStorage.removeItem('admin_token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    const checkSession = async () => {
      try {
        const res = await fetch(`${API_URL_ROOT}/api/users/profile`, {
          credentials: 'include'
        });
        if (res.ok) {
          const result = await res.json();
          setUser(result.data);
          setToken('session-cookie');
          sessionStorage.setItem('adminUser', JSON.stringify(result.data));
          sessionStorage.setItem('adminToken', 'session-cookie');
        } else {
          setUser(null);
          setToken('');
          const path = window.location.pathname;
          const search = window.location.search;
          const hash = window.location.hash;
          const isLookup = path.includes('/lookup') || path.includes('/tra-cuu') || search.includes('view=lookup') || hash.includes('lookup');
          if (!isLookup) {
            setView('home');
          }
          sessionStorage.removeItem('adminView');
          sessionStorage.removeItem('adminTab');
          sessionStorage.removeItem('adminUser');
          sessionStorage.removeItem('adminToken');
          setLoading(false);
        }
      } catch (err) {
        console.error(">>> [checkSession] error:", err);
        setUser(null);
        setToken('');
        const path = window.location.pathname;
        const search = window.location.search;
        const hash = window.location.hash;
        const isLookup = path.includes('/lookup') || path.includes('/tra-cuu') || search.includes('view=lookup') || hash.includes('lookup');
        if (!isLookup) {
          setView('home');
        }
        sessionStorage.removeItem('adminView');
        sessionStorage.removeItem('adminTab');
        sessionStorage.removeItem('adminUser');
        sessionStorage.removeItem('adminToken');
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  // Handle Google Redirect login token on page load
  useEffect(() => {
    const handleRedirectHash = async () => {
      try {
        const hash = window.location.hash;
        if (hash && (hash.includes('id_token=') || hash.includes('access_token='))) {
          const params = new URLSearchParams(hash.substring(1));
          const idToken = params.get('id_token');
          if (idToken) {
            setLoginLoading(true);
            setLoginError('');
            setView('login');
            console.log(">>> [Google Redirect Flow] Sending id_token to backend...");
            const res = await fetch(`${API_URL_ROOT}/api/users/google-login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: idToken }),
              credentials: 'include'
            });
            const result = await res.json();
            if (!res.ok) {
              throw new Error(result.message || 'Xác thực Google thất bại');
            }
            const authData = result.data;
            console.log(">>> [Google Redirect Flow] Success! authData:", authData);
            setToken('session-cookie');
            setUser(authData.user);
            sessionStorage.setItem('adminUser', JSON.stringify(authData.user));
            sessionStorage.setItem('adminToken', 'session-cookie');
            
            if (authData.user && (authData.user.role === 'ADMIN' || authData.user.role === 'SUPER_ADMIN')) {
              setView('admin');
              sessionStorage.setItem('adminView', 'admin');
            } else {
              setView('home');
            }
            
            // Clean hash from URL without reloading the page
            window.history.replaceState(null, null, window.location.pathname + window.location.search);
          }
        }
      } catch (err) {
        console.error(">>> [Google Redirect Flow] Error:", err);
        setLoginError(err.message);
        setView('login');
      } finally {
        setLoginLoading(false);
      }
    };
    handleRedirectHash();
  }, []);

  useEffect(() => {
    console.log(">>> [useEffect] token or user changed. token:", token, "user:", user);
    if (token && user) {
      fetchData(token, user);
    }
  }, [token, user]);

  // Google Sign-In Initializer with polling to handle race conditions & responsive button width
  useEffect(() => {
    if (view !== 'login' || token) return;

    let intervalId;
    let attempts = 0;

    const initializeGoogleBtn = () => {
      if (window.google  ) {
        try {
          window.google.accounts.id.initialize({
            client_id: '195858897824-4h5ffebs0djtuncmhod98o0ca495ju71.apps.googleusercontent.com',
            callback: handleGoogleLoginSuccess
          });

          // Determine button width dynamically to fit mobile viewport
          const calculatedWidth = Math.max(200, Math.min(336, window.innerWidth - 64));

          const btnElem = document.getElementById('google-signin-btn');
          if (btnElem) {
            window.google.accounts.id.renderButton(
              btnElem,
              { 
                theme: 'outline', 
                size: 'large', 
                width: calculatedWidth,
                shape: 'pill'
              }
            );
          }
          if (intervalId) clearInterval(intervalId);
        } catch (err) {
          console.error('Lỗi khi load nút Google Login:', err);
        }
      }
    };

    // Try immediately
    initializeGoogleBtn();

    // If window.google is not ready, check every 200ms
    if (!window.google) {
       intervalId = setInterval(() => {
        attempts++;
        if (window.google || attempts > 50) { // Max 10 seconds
          initializeGoogleBtn();
          clearInterval(intervalId);
        }
      }, 200);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [view, token]);

  // Auto-lookup khi mở link có ?zaloId=xxx hoặc ?token=xxx (từ lệnh /tracuu của bot)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const autoToken = params.get('token');
    const autoZaloId = params.get('zaloId');
    const targetQuery = autoToken || autoZaloId;
    if (targetQuery && targetQuery.trim()) {
      setView('lookup');
      const targetType = 'ZALO_ID';
      setLookupSearchType(targetType);
      setLookupQuery('');
      // Trigger search sau khi state set xong
      setTimeout(() => {
        handlePublicLookup(targetQuery.trim(), targetType);
      }, 100);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePublicLookup = async (overrideQuery = null, overrideType = null) => {

    const q = overrideQuery !== null ? overrideQuery : lookupQuery;
    const type = overrideType !== null ? overrideType : lookupSearchType;
    if (overrideType !== null) {
      setLookupSearchType(overrideType);
    }

    if (!q || !q.trim()) {
      setLookupError('Vui lòng nhập từ khóa tìm kiếm');
      showToast('Vui lòng nhập từ khóa tìm kiếm', 'error');
      return;
    }

    setLookupLoading(true);
    setLookupError('');
    setLookupResult(null);

    try {
      let url = `${API_URL_ROOT}/api/public/lookup?searchType=${type}&query=${encodeURIComponent(q.trim())}`;
      if (lookupStartDate) url += `&startDate=${lookupStartDate}`;
      if (lookupEndDate) url += `&endDate=${lookupEndDate}`;

      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || 'Lỗi tra cứu thông tin');
      }

      setLookupResult(json.data);

      // Save to recent search history only for ORDER_ID
      if (type === 'ORDER_ID') {
        setLookupRecentSearches(prev => {
          const item = { query: q.trim(), searchType: type };
          const filtered = prev.filter(x => !(x.query.toLowerCase() === item.query.toLowerCase() && x.searchType === item.searchType));
          const updated = [item, ...filtered].slice(0, 5);
          localStorage.setItem('recentLookups', JSON.stringify(updated));
          return updated;
        });
      }

    } catch (err) {
      console.error(err);
      setLookupError(err.message);
      showToast(err.message, 'error');
    } finally {
      setLookupLoading(false);
    }
  };

  const sendOtpToUser = async (action) => {
    if (otpCountdown > 0) {
      showToast(`Vui lòng đợi ${otpCountdown} giây trước khi yêu cầu gửi lại mã OTP mới!`, 'warning');
      return;
    }

    if (action === 'BANK') {
      if (!editBankName.trim() || !editAccountNumber.trim()) {
        setBankSaveError('Vui lòng điền đầy đủ tên ngân hàng và số tài khoản');
        return;
      }
    } else if (action === 'PAYOUT') {
      const amountVal = parseFloat(payoutAmount.replace(/[^\d]/g, ''));
      if (isNaN(amountVal) || amountVal <= 0) {
        setPayoutSaveError('Vui lòng nhập số tiền rút hợp lệ (lớn hơn 0đ)');
        return;
      }
      if (!lookupResult.bankName || !lookupResult.accountNumber) {
        setPayoutSaveError('Vui lòng thiết lập thông tin ngân hàng nhận tiền trước');
        return;
      }
    }

    setOtpSending(true);
    setOtpError('');
    try {
      const res = await fetch(`${API_URL_ROOT}/api/public/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zaloId: lookupResult.zaloId,
          zaloName: lookupResult.zaloName || 'Sếp'
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Lỗi gửi mã OTP');
      setOtpActionType(action);
      setOtpCode('');
      setOtpModalOpen(true);
      setOtpCountdown(60);
      showToast('Đã gửi mã xác thực OTP vào tin nhắn riêng Zalo!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setOtpSending(false);
    }
  };

  const handleSaveBankInfo = async (code = '') => {
    if (!editBankName.trim() || !editAccountNumber.trim()) {
      setBankSaveError('Vui lòng điền đầy đủ tên ngân hàng và số tài khoản');
      showToast('Vui lòng điền đầy đủ tên ngân hàng và số tài khoản', 'error');
      return;
    }

    setBankSaveLoading(true);
    setBankSaveError('');
    setOtpError('');

    try {
      const res = await fetch(`${API_URL_ROOT}/api/public/bank-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zaloId: lookupResult.zaloId,
          bankName: editBankName.trim(),
          accountNumber: editAccountNumber.trim(),
          otp: code
        })
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Lỗi khi lưu thông tin ngân hàng');
      }

      // Cập nhật state cục bộ
      setLookupResult(prev => ({
        ...prev,
        bankName: editBankName.trim(),
        accountNumber: editAccountNumber.trim()
      }));
      setIsEditingBank(false);
      setOtpModalOpen(false);
      setOtpCountdown(0);
      showToast('Đã cập nhật thông tin ngân hàng thành công!', 'success');
    } catch (err) {
      setBankSaveError(err.message);
      if (otpModalOpen) setOtpError(err.message);
      showToast(err.message, 'error');
    } finally {
      setBankSaveLoading(false);
    }
  };

  const handleRequestPayout = async (code = '') => {
    const amountVal = parseFloat(payoutAmount.replace(/[^\d]/g, ''));
    if (isNaN(amountVal) || amountVal <= 0) {
      setPayoutSaveError('Vui lòng nhập số tiền rút hợp lệ (lớn hơn 0đ)');
      showToast('Vui lòng nhập số tiền rút hợp lệ (lớn hơn 0đ)', 'error');
      return;
    }

    if (!lookupResult.bankName || !lookupResult.accountNumber) {
      setPayoutSaveError('Vui lòng thiết lập thông tin ngân hàng nhận tiền trước');
      showToast('Vui lòng thiết lập thông tin ngân hàng nhận tiền trước', 'error');
      return;
    }

    setPayoutSaveLoading(true);
    setPayoutSaveError('');
    setOtpError('');

    try {
      const res = await fetch(`${API_URL_ROOT}/api/public/payout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zaloId: lookupResult.zaloId,
          amount: amountVal,
          otp: code
        })
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Lỗi khi yêu cầu rút tiền');
      }

      setPayoutAmount('');
      setOtpModalOpen(false);
      setOtpCountdown(0);
      showToast('🎉 Yêu cầu rút tiền thành công! Trưởng nhóm Phạm Thắng sẽ duyệt và chuyển khoản cho sếp sớm nhất!', 'success');
      // Tải lại dữ liệu ví tiền
      handlePublicLookup(lookupResult.zaloId, 'ZALO_ID');
    } catch (err) {
      setPayoutSaveError(err.message);
      if (otpModalOpen) setOtpError(err.message);
      showToast(err.message, 'error');
    } finally {
      setPayoutSaveLoading(false);
    }
  };

  function renderMobileBottomNav() {
    const isNavAdminMode = view === 'admin';

    if (isNavAdminMode) {
      return (
        <nav className="mobile-bottom-nav">
          <button 
            type="button"
            className={`mobile-bottom-nav-item${activeTab === 'dashboard' ? ' active' : ''}`}
            onClick={() => { setActiveTab('dashboard'); sessionStorage.setItem('adminTab','dashboard'); window.scrollTo(0,0); }}
          >
            <div className="nav-icon-wrap">
              <i className="fa-solid fa-chart-pie"></i>
            </div>
            <span className="nav-label">Tổng quan</span>
          </button>

          <button 
            type="button"
            className={`mobile-bottom-nav-item${activeTab === 'users' ? ' active' : ''}`}
            onClick={() => { setActiveTab('users'); sessionStorage.setItem('adminTab','users'); window.scrollTo(0,0); }}
          >
            <div className="nav-icon-wrap">
              <i className="fa-solid fa-users"></i>
            </div>
            <span className="nav-label">Thành viên</span>
          </button>

          <button 
            type="button"
            className={`mobile-bottom-nav-item${activeTab === 'orders' ? ' active' : ''}`}
            onClick={() => { setActiveTab('orders'); sessionStorage.setItem('adminTab','orders'); window.scrollTo(0,0); }}
          >
            <div className="nav-icon-wrap">
              <i className="fa-solid fa-boxes-stacked"></i>
            </div>
            <span className="nav-label">Đơn hàng</span>
          </button>

          <button 
            type="button"
            className={`mobile-bottom-nav-item${activeTab === 'payouts' ? ' active' : ''}`}
            onClick={() => { setActiveTab('payouts'); sessionStorage.setItem('adminTab','payouts'); window.scrollTo(0,0); }}
          >
            <div className="nav-icon-wrap">
              <i className="fa-solid fa-wallet"></i>
              {stats?.pendingPayoutsCount > 0 && (
                <span className="mobile-nav-badge">{stats.pendingPayoutsCount}</span>
              )}
            </div>
            <span className="nav-label">Rút tiền</span>
          </button>

          <button 
            type="button"
            className="mobile-bottom-nav-item"
            onClick={() => { setView('home'); sessionStorage.removeItem('adminView'); window.scrollTo(0,0); }}
          >
            <div className="nav-icon-wrap">
              <i className="fa-solid fa-house"></i>
            </div>
            <span className="nav-label">Trang chủ</span>
          </button>
        </nav>
      );
    }

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

    return (
      <nav className="mobile-bottom-nav">
        {/* Nút 1: Trang chủ */}
        <button 
          type="button"
          className={`mobile-bottom-nav-item${view === 'home' ? ' active' : ''}`}
          onClick={() => { setView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        >
          <div className="nav-icon-wrap">
            <i className="fa-solid fa-house"></i>
          </div>
          <span className="nav-label">Trang chủ</span>
        </button>

        {/* Nút 2: Tra cứu (khi từ Zalo /tracuu tới sẽ active) */}
        <button 
          type="button"
          className={`mobile-bottom-nav-item${view === 'lookup' ? ' active' : ''}`}
          onClick={() => { setView('lookup'); window.history.pushState({}, '', '/?view=lookup'); window.scrollTo(0,0); }}
        >
          <div className="nav-icon-wrap">
            <i className="fa-solid fa-magnifying-glass"></i>
          </div>
          <span className="nav-label">Tra cứu</span>
        </button>

        {/* Nút 3 (Nút Nổi Ở Giữa - Floating Action Button): Mở Bot Zalo Group */}
        <a 
          href="https://zalo.me/g/0p083nqqoordpki9zgvy" 
          target="_blank" 
          rel="noreferrer"
          className="mobile-bottom-nav-item mobile-nav-fab"
          title="Nhắn tin với Bot Zalo hoàn tiền"
        >
          <div className="fab-circle">
            <i className="fa-solid fa-comment-dots"></i>
          </div>
          <span className="nav-label">Bot Zalo</span>
        </a>

        {/* Nút 4: Hướng dẫn */}
        <button 
          type="button"
          className="mobile-bottom-nav-item"
          onClick={() => scrollToSection('steps')}
        >
          <div className="nav-icon-wrap">
            <i className="fa-solid fa-circle-question"></i>
          </div>
          <span className="nav-label">Hướng dẫn</span>
        </button>

        {/* Nút 5: Quản trị / Tài khoản */}
        {isAdmin ? (
          <button 
            type="button"
            className={`mobile-bottom-nav-item${view === 'admin' ? ' active' : ''}`}
            onClick={() => { setView('admin'); sessionStorage.setItem('adminView','admin'); window.scrollTo(0,0); }}
          >
            <div className="nav-icon-wrap">
              <i className="fa-solid fa-user-gear"></i>
            </div>
            <span className="nav-label">Quản trị</span>
          </button>
        ) : token ? (
          <button 
            type="button"
            className="mobile-bottom-nav-item"
            onClick={() => {
              if (window.confirm('Bạn có muốn đăng xuất không?')) {
                handleLogout();
              }
            }}
          >
            <div className="nav-icon-wrap">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="User" referrerPolicy="no-referrer" style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <i className="fa-solid fa-user"></i>
              )}
            </div>
            <span className="nav-label">{user?.fullName?.split(' ')[0] || 'Tài khoản'}</span>
          </button>
        ) : (
          <button 
            type="button"
            className={`mobile-bottom-nav-item${view === 'login' ? ' active' : ''}`}
            onClick={() => { setView('login'); window.history.pushState({}, '', '/?view=login'); window.scrollTo(0,0); }}
          >
            <div className="nav-icon-wrap">
              <i className="fa-solid fa-right-to-bracket"></i>
            </div>
            <span className="nav-label">Đăng nhập</span>
          </button>
        )}
      </nav>
    );
  }

  // Auto-run lookup if search params are present in the URL on load
  useEffect(() => {
    if (view === 'lookup') {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      const urlSearchType = urlToken ? 'ZALO_ID' : (params.get('searchType') || 'ZALO_ID');
      const urlQuery = urlToken || params.get('query') || params.get('q') || params.get('zaloId');
      const urlStartDate = params.get('startDate');
      const urlEndDate = params.get('endDate');

      if (urlQuery) {
        if (urlSearchType === 'ORDER_ID') {
          setLookupQuery(urlQuery);
        } else {
          setLookupQuery('');
        }
        if (urlSearchType) {
          setLookupSearchType(urlSearchType);
        }
        if (urlStartDate) setLookupStartDate(urlStartDate);
        if (urlEndDate) setLookupEndDate(urlEndDate);
        
        // Auto-trigger search
        handlePublicLookup(urlQuery, urlSearchType || 'NAME');
      }
    }
  }, [view]);

  const removeRecentSearch = (e, index) => {
    e.stopPropagation();
    setLookupRecentSearches(prev => {
      const updated = prev.filter((_, i) => i !== index);
      localStorage.setItem('recentLookups', JSON.stringify(updated));
      return updated;
    });
  };

  const handleGoogleLoginSuccess = async (response) => {
    console.log(">>> [handleGoogleLoginSuccess] response credential length:", response.credential?.length);
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await fetch(`${API_URL_ROOT}/api/users/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.credential }),
        credentials: 'include'
      });
      console.log(">>> [handleGoogleLoginSuccess] res status:", res.status);
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'Xác thực Google thất bại');
      }
      const authData = result.data;
      console.log(">>> [handleGoogleLoginSuccess] authData:", authData);
      console.log(">>> [handleGoogleLoginSuccess] Setting token and user states...");
      setToken('session-cookie');
      setUser(authData.user);
      sessionStorage.setItem('adminUser', JSON.stringify(authData.user));
      sessionStorage.setItem('adminToken', 'session-cookie');
      
      if (authData.user && (authData.user.role === 'ADMIN' || authData.user.role === 'SUPER_ADMIN')) {
        setView('admin');
        sessionStorage.setItem('adminView', 'admin');
      } else {
        setView('home');
      }
      
      showToast('Đăng nhập thành công!', 'success');
    } catch (err) {
      console.error(">>> [handleGoogleLoginSuccess] error:", err);
      setLoginError(err.message);
      showToast(err.message, 'error');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLocalLogin = async (e) => {
    e.preventDefault();
    console.log(">>> [handleLocalLogin] email:", loginEmail);
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await fetch(`${API_URL_ROOT}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
        credentials: 'include'
      });
      console.log(">>> [handleLocalLogin] res status:", res.status);
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'Sai tài khoản hoặc mật khẩu');
      }
      const authData = result.data;
      console.log(">>> [handleLocalLogin] authData:", authData);
      setToken('session-cookie');
      setUser(authData.user);
      sessionStorage.setItem('adminUser', JSON.stringify(authData.user));
      sessionStorage.setItem('adminToken', 'session-cookie');
      
      if (authData.user && (authData.user.role === 'ADMIN' || authData.user.role === 'SUPER_ADMIN')) {
        setView('admin');
        sessionStorage.setItem('adminView', 'admin');
      } else {
        setView('home');
      }
      
      showToast('Đăng nhập thành công!', 'success');
    } catch (err) {
      console.error(">>> [handleLocalLogin] error:", err);
      setLoginError(err.message);
      showToast(err.message, 'error');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    console.log(">>> [handleLogout] Logging out and clearing storage/states...");
    try {
      await fetch(`${API_URL_ROOT}/api/users/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {
      console.warn(">>> [handleLogout] Error calling backend logout endpoint:", e);
    }
    setToken('');
    setUser(null);
    setView('home');
    sessionStorage.removeItem('adminView');
    setStats({
      totalMembers: 0,
      totalOrders: 0,
      totalCommission: 0,
      pendingPayoutsCount: 0,
      totalWithdrawn: 0
    });
    setUsers([]);
    setOrders([]);
    setPayouts([]);
  };

  // Format currency
  const formatMoney = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '0đ';
    return Math.round(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';
  };

  // Format DateTime string
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        return dateStr.replace('T', ' ').substring(0, 16);
      }
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month} ${hours}:${minutes}`;
    } catch (e) {
      return dateStr;
    }
  };

  // Parse legacy combined bank info string
  const parseBankInfo = (bankInfo) => {
    if (!bankInfo) return { bankName: '', accountNumber: '' };
    const raw = bankInfo.trim();
    const parts = raw.split(/[\s_\-]+/);
    if (parts.length >= 2) {
      const accountNumber = parts[parts.length - 1];
      const bankName = parts.slice(0, parts.length - 1).join(' ');
      return { bankName, accountNumber };
    } else {
      const match = raw.match(/^([a-zA-Z\s]+)(\d+)$/);
      if (match) {
        return { bankName: match[1].trim(), accountNumber: match[2].trim() };
      }
      return { bankName: 'UNKNOWN', accountNumber: raw };
    }
  };

  // Get bankName and accountNumber from item (user or payout request)
  const getBankAndAccount = (item) => {
    if (!item) return { bankName: '', accountNumber: '' };
    if (item.bankName && item.bankName !== 'UNKNOWN' && item.accountNumber) {
      return { bankName: item.bankName, accountNumber: item.accountNumber };
    }
    if (item.bankInfo) {
      const parsed = parseBankInfo(item.bankInfo);
      if (parsed.bankName && parsed.bankName !== 'UNKNOWN') {
        return parsed;
      }
      return {
        bankName: item.bankName && item.bankName !== 'UNKNOWN' ? item.bankName : parsed.bankName,
        accountNumber: item.accountNumber || parsed.accountNumber
      };
    }
    return {
      bankName: item.bankName || '',
      accountNumber: item.accountNumber || ''
    };
  };

  // Payout Approval handler
  const handleApprovePayout = async (payoutId) => {
    if (!window.confirm(`Bạn có chắc chắn muốn phê duyệt lệnh rút tiền này không?`)) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/payouts/${payoutId}/approve`, {
        method: 'POST',
        credentials: 'include'
      });
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        return;
      }
      if (!res.ok) {
        const errMsg = await res.text();
        throw new Error(errMsg || 'Phê duyệt thất bại');
      }
      showToast('Đã phê duyệt giao dịch thành công!', 'success');
      fetchData(token, user); // Refresh data
    } catch (err) {
      showToast(`Lỗi: ${err.message}`, 'error');
    }
  };

  // Upload file import handler
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const handleImportFile = async () => {
    if (!importFile) return;
    const formData = new FormData();
    formData.append('file', importFile);
    setImportLoading(true);
    setImportResult(null);
    try {
      const res = await fetch(`${API_URL_ROOT}/api/admin/import-excel`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text);
      setImportResult({ success: true, message: text });
      showToast('Import file Excel thành công: ' + text, 'success');
      setImportFile(null);
      fetchData(token, user); // Refresh toàn bộ data
    } catch (err) {
      setImportResult({ success: false, message: err.message });
      showToast('Lỗi Import Excel: ' + err.message, 'error');
    } finally {
      setImportLoading(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.zaloName?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.zaloId?.includes(userSearch)
  );

  const filteredOrders = orders.filter(o => 
    o.orderId?.toLowerCase().includes(orderSearch.toLowerCase()) ||
    o.zaloId?.toLowerCase().includes(orderSearch.toLowerCase()) ||
    o.productName?.toLowerCase().includes(orderSearch.toLowerCase())
  );

  const filteredPayouts = payouts.filter(p => {
    const user = users.find(u => u.zaloId === p.zaloId);
    const name = user ? user.zaloName : 'UNKNOWN';
    return name.toLowerCase().includes(payoutSearch.toLowerCase()) ||
           p.zaloId.includes(payoutSearch) ||
           String(p.id).includes(payoutSearch);
  });

  const toastElement = toast && (
    <div className="custom-toast-popup" style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderLeft: '4px solid #f97316',
      borderRadius: '14px',
      boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1)',
      top: '72px'
    }}>
      {/* Icon Badge */}
      <div style={{
        width: '40px',
        height: '40px',
        minWidth: '40px',
        borderRadius: '50%',
        background: '#fff7ed',
        border: '1.5px solid #fed7aa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 0 14px rgba(249,115,22,0.15)'
      }}>
        {toast.type === 'success' ? (
          <svg style={{ width: '18px', height: '18px', color: '#ea580c' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"></path>
          </svg>
        ) : toast.type === 'error' ? (
          <svg style={{ width: '18px', height: '18px', color: '#ef4444' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"></path>
          </svg>
        ) : (
          <svg style={{ width: '18px', height: '18px', color: '#ea580c' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.085 1.085l-1.086 1.086L10.5 13.5H12.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, textAlign: 'left' }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '700',
          color: '#0f172a',
          marginBottom: '3px',
          letterSpacing: '0.1px'
        }}>
          {toast.type === 'success' ? '✓  Thành công' : (toast.type === 'error' ? '⚠  Có lỗi xảy ra' : 'ℹ  Thông báo')}
        </div>
        <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.45' }}>
          {toast.message}
        </div>
      </div>

      {/* Close Button */}
      <button
        onClick={() => setToast(null)}
        style={{
          background: '#f1f5f9',
          border: '1px solid #cbd5e1',
          color: '#64748b',
          fontSize: '14px',
          cursor: 'pointer',
          padding: '4px 7px',
          lineHeight: 1,
          borderRadius: '6px',
          alignSelf: 'flex-start',
          transition: 'all 0.2s',
          flexShrink: 0
        }}
        onMouseEnter={e => { e.currentTarget.style.background='#fff7ed'; e.currentTarget.style.color='#ea580c'; }}
        onMouseLeave={e => { e.currentTarget.style.background='#f1f5f9'; e.currentTarget.style.color='#64748b'; }}
      >
        ✕
      </button>
      {/* Progress Bar */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: '2px',
        borderRadius: '0 0 14px 14px',
        background: 'linear-gradient(90deg, #f97316, #ea580c)',
        animation: 'toastProgress 4s linear forwards'
      }} />
    </div>
  );

  if (view === 'lookup') {
    const totalCommission = lookupResult 
      ? (lookupResult.wallet.completedCommission + lookupResult.wallet.pendingCommission) 
      : 0;

    // Local filter of orders
    const searchedOrders = lookupResult
      ? lookupResult.orders.filter(o => {
          const matchesQuery = o.orderId?.toLowerCase().includes(lookupLocalFilter.toLowerCase()) || o.productName?.toLowerCase().includes(lookupLocalFilter.toLowerCase());
          const matchesPlatform = platformFilter === 'ALL' || o.platform === platformFilter || (platformFilter === 'Shopee' && (!o.platform || o.platform === 'Shopee'));
          return matchesQuery && matchesPlatform;
        })
      : [];

    return (
      <div className="lookup-page-container">
        <RunningCatMascot />
        <style dangerouslySetInnerHTML={{__html: `

          .lookup-page-container {
            min-height: 100vh;
            width: 100%;
            background: #f8fafc;
            color: #1e293b;
            font-family: 'Inter', system-ui, sans-serif;
            padding: 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
            overflow: hidden;
          }
          /* Animated gradient orbs */
          .lookup-page-container::before {
            content: '';
            position: absolute;
            top: -15%;
            left: -10%;
            width: 700px;
            height: 700px;
            background: radial-gradient(circle, rgba(249, 115, 22, 0.1) 0%, rgba(234, 88, 12, 0.03) 40%, transparent 70%);
            z-index: 1;
            pointer-events: none;
            animation: lookupFloatOrb1 8s ease-in-out infinite;
          }
          .lookup-page-container::after {
            content: '';
            position: absolute;
            bottom: -20%;
            right: -10%;
            width: 600px;
            height: 600px;
            background: radial-gradient(circle, rgba(249, 115, 22, 0.08) 0%, rgba(234, 88, 12, 0.02) 40%, transparent 70%);
            z-index: 1;
            pointer-events: none;
            animation: lookupFloatOrb2 10s ease-in-out infinite;
          }
          @keyframes lookupFloatOrb1 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(40px, 30px) scale(1.1); }
          }
          @keyframes lookupFloatOrb2 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(-30px, -40px) scale(1.05); }
          }
          /* Ensure universal border-box box-sizing inside lookup card so all edges align perfectly */
          .lookup-card, .lookup-card * {
            box-sizing: border-box !important;
          }
          /* Ensure child content stays on top of orbs */
          .lookup-header, .lookup-card, .stats-container, .orders-container, .lookup-error {
            position: relative;
            z-index: 2;
          }
          .lookup-header {
            width: 100%;
            max-width: 600px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
            padding-bottom: 12px;
            border-bottom: 1px solid #e2e8f0;
          }
          .lookup-logo {
            font-size: 18px;
            font-weight: 800;
            color: #0f172a;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .lookup-logo span {
            color: #0f172a;
          }
          .lookup-logo img {
            border: 1px solid #e2e8f0;
          }
          .lookup-admin-link {
            font-size: 13px;
            color: #0f172a;
            text-decoration: none;
            background: #ffffff;
            padding: 6px 14px;
            border-radius: 20px;
            border: 1.5px solid #94a3b8;
            font-weight: 700;
            transition: all 0.2s ease;
          }
          .lookup-admin-link:hover {
            background: #fff7ed;
            color: #ea580c;
            border-color: #f97316;
          }
          .lookup-card {
            width: 100%;
            max-width: 600px;
            box-sizing: border-box !important;
            background: #ffffff;
            border: 1.5px solid #cbd5e1;
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 10px 30px -5px rgba(0,0,0,0.08);
            margin-bottom: 24px;
            overflow: hidden;
          }
          .lookup-title {
            font-size: 22px;
            font-weight: 800;
            text-align: center;
            color: #0f172a;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }
          .lookup-subtitle {
            font-size: 13.5px;
            color: #334155;
            font-weight: 600;
            text-align: center;
            margin-bottom: 24px;
          }
          .lookup-tabs {
            display: flex;
            background: #e2e8f0;
            border: 1.5px solid #cbd5e1;
            padding: 4px;
            border-radius: 8px;
            margin-bottom: 16px;
          }
          .lookup-tab {
            flex: 1;
            text-align: center;
            padding: 10px;
            font-size: 13.5px;
            font-weight: 700;
            border-radius: 6px;
            cursor: pointer;
            background: transparent;
            border: none;
            color: #475569;
            transition: all 0.2s ease;
          }
          .lookup-tab.active {
            background: linear-gradient(135deg, #f97316, #ea580c);
            color: #ffffff;
            box-shadow: 0 4px 14px rgba(249, 115, 22, 0.35);
          }
          .lookup-input-group {
            margin-bottom: 16px;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          .lookup-label {
            display: block;
            font-size: 12px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .lookup-input {
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            background: #ffffff;
            border: 1.5px solid #94a3b8;
            border-radius: 8px;
            padding: 12px 14px;
            color: #0f172a;
            font-size: 15px;
            font-weight: 600;
            outline: none;
            transition: all 0.2s ease;
            display: block !important;
            -webkit-appearance: none;
            appearance: none;
          }
          input[type="date"].lookup-input {
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            display: block !important;
          }
          .lookup-input:focus {
            border-color: #ea580c;
            background: #ffffff;
            box-shadow: 0 0 12px rgba(249, 115, 22, 0.25);
          }
          .lookup-date-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 20px;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          @media (max-width: 768px) {
            .lookup-date-grid {
              display: flex !important;
              flex-direction: column !important;
              gap: 16px !important;
              width: 100% !important;
            }
            .lookup-date-grid .lookup-input-group {
              width: 100% !important;
              margin-bottom: 0 !important;
            }
          }
          .lookup-btn {
            width: 100%;
            max-width: 100% !important;
            box-sizing: border-box !important;
            background: linear-gradient(135deg, #f97316, #ea580c);
            background-size: 200% auto;
            color: #ffffff;
            font-size: 15px;
            font-weight: 800;
            border: none;
            border-radius: 8px;
            padding: 14px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            box-shadow: 0 4px 15px rgba(249, 115, 22, 0.35);
          }
          .lookup-btn:hover {
            background-position: right center;
            box-shadow: 0 6px 20px rgba(249, 115, 22, 0.5);
            transform: translateY(-1px);
          }
          .lookup-btn:disabled {
            background: #94a3b8;
            color: #ffffff;
            cursor: not-allowed;
            box-shadow: none;
            transform: none;
          }
          .recent-searches {
            margin-top: 16px;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 8px;
            font-size: 12.5px;
            color: #334155;
            font-weight: 600;
          }
          .recent-tag {
            background: #ffffff;
            border: 1.5px solid #cbd5e1;
            border-radius: 12px;
            padding: 4px 10px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s ease;
            color: #0f172a;
            font-weight: 700;
          }
          .recent-tag:hover {
            border-color: #ea580c;
            background: #fff7ed;
            color: #ea580c;
          }
          .recent-close {
            font-size: 12px;
            color: #dc2626;
            font-weight: bold;
          }
          .lookup-error {
            width: 100%;
            max-width: 600px;
            background: #fef2f2;
            border: 1.5px solid #f87171;
            color: #991b1b;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 14px;
            font-weight: 700;
          }
          .stats-container {
            width: 100%;
            max-width: 600px;
            margin-bottom: 24px;
          }
          .stats-section-title {
            font-size: 17px;
            font-weight: 800;
            margin-bottom: 12px;
            color: #0f172a;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .stats-cards-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          .stats-cards-grid > :first-child {
            grid-column: span 2;
          }
          .stat-card-item {
            border-radius: 12px;
            padding: 16px;
            border: 1.5px solid var(--border-color, #cbd5e1);
            display: flex;
            flex-direction: column;
            box-shadow: 0 4px 12px rgba(0,0,0,0.04);
            background: var(--bg-card, #ffffff);
          }
          .stat-card-item.total {
            background: linear-gradient(135deg, rgba(254,215,170,0.4) 0%, var(--bg-card, #ffffff) 100%);
            border-color: #fdba74;
          }
          .stat-card-item.pending {
            background: linear-gradient(135deg, rgba(253,230,138,0.4) 0%, var(--bg-card, #ffffff) 100%);
            border-color: #fcd34d;
          }
          .stat-card-item.completed {
            background: linear-gradient(135deg, rgba(167,243,208,0.4) 0%, var(--bg-card, #ffffff) 100%);
            border-color: #6ee7b7;
          }
          .stat-card-item.withdrawable {
            background: linear-gradient(135deg, rgba(254,215,170,0.4) 0%, var(--bg-card, #ffffff) 100%);
            border-color: #fdba74;
          }
          .stat-card-item.received {
            background: linear-gradient(135deg, rgba(187,247,208,0.4) 0%, var(--bg-card, #ffffff) 100%);
            border-color: #86efac;
          }
          .stat-card-label {
            font-size: 11.5px;
            text-transform: uppercase;
            color: var(--text-muted, #334155);
            margin-bottom: 4px;
            font-weight: 700;
            letter-spacing: 0.5px;
          }
          .stat-card-value {
            font-size: 24px;
            font-weight: 900;
            color: var(--text-bright, #0f172a);
          }
          .stat-card-value.primary {
            color: #ea580c;
          }
          .orders-container {
            width: 100%;
            max-width: 600px;
          }
          .order-card-item {
            background: var(--bg-card, #ffffff);
            border: 1.5px solid var(--border-color, #cbd5e1);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.04);
          }
          .order-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            font-size: 12.5px;
            color: var(--text-muted, #334155);
            font-weight: 600;
          }
          .order-id-badge {
            font-family: monospace;
            font-weight: 800;
            color: #c2410c;
            font-size: 13px;
          }
          .order-card-title {
            font-size: 14.5px;
            font-weight: 700;
            color: var(--text-bright, #0f172a);
            margin-bottom: 10px;
            line-height: 1.4;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          }
          .order-card-commission-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-top: 1px dashed #cbd5e1;
            padding-top: 10px;
          }
          .order-commission-label {
            font-size: 12.5px;
            color: #334155;
            font-weight: 600;
          }
          .order-commission-val {
            font-size: 16px;
            font-weight: 800;
            color: #047857;
          }
          .order-status-badge {
            font-size: 11.5px;
            padding: 4px 10px;
            border-radius: 20px;
            font-weight: 800;
          }
          .order-status-badge.completed {
            background: #d1fae5;
            color: #047857;
            border: 1px solid #6ee7b7;
          }
          .order-status-badge.pending {
            background: #ffedd5;
            color: #c2410c;
            border: 1px solid #fdba74;
          }
          .order-status-badge.cancelled {
            background: #fee2e2;
            color: #b91c1c;
            border: 1px solid #fca5a5;
          }
          .lookup-spinner {
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255,255,255,0.3);
            border-top-color: #fff;
            border-radius: 50%;
            animation: lookup-spin 1s linear infinite;
          }
          @keyframes lookup-spin {
            to { transform: rotate(360deg); }
          }
          .lookup-banner-section {
            position: relative;
            width: 100%;
            max-width: 600px;
            margin: 32px 0 8px;
            display: flex;
            flex-direction: column;
            align-items: center;
            z-index: 2;
          }
          .lookup-banner-section h4 {
            font-size: 13px;
            color: #64748b;
            margin: 0 0 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            text-align: center;
            padding: 0 16px;
            line-height: 1.4;
          }
          .lookup-banner-img-wrap {
            position: relative;
            width: 260px;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(0,0,0,0.08), 0 0 20px rgba(249, 115, 22, 0.15);
            border: 2px solid #fed7aa;
            animation: banner-float 4s ease-in-out infinite;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          .lookup-banner-img-wrap:hover {
            transform: scale(1.03) translateY(-4px);
            box-shadow: 0 12px 40px rgba(0,0,0,0.12), 0 0 30px rgba(249, 115, 22, 0.3);
          }
          .lookup-banner-img-wrap img {
            width: 100%;
            display: block;
          }
          .lookup-banner-close {
            position: absolute;
            top: 6px;
            right: 6px;
            background: rgba(0,0,0,0.6);
            color: #fff;
            border: none;
            border-radius: 50%;
            width: 22px;
            height: 22px;
            font-size: 14px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
            backdrop-filter: blur(4px);
          }
          @keyframes banner-float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }
          @keyframes toastSlideIn {
            from { opacity: 0; transform: translate(50px, -10px) scale(0.95); }
            to { opacity: 1; transform: translate(0, 0) scale(1); }
          }
          @keyframes toastProgress {
            from { width: 100%; }
            to { width: 0%; }
          }
          @media (max-width: 480px) {
            .stats-cards-grid {
              grid-template-columns: 1fr;
            }
            .stats-cards-grid > :first-child {
              grid-column: span 1;
            }
            .lookup-card {
              padding: 16px;
            }
            .stat-card-value {
              font-size: 20px;
            }
            .lookup-banner-img-wrap {
              width: 100%;
              max-width: 280px;
            }
          }
        `}} />

        {/* Custom Toast Notification Top-Right */}
        {toastElement}

        {/* Lookup Header Bar */}
        <header className="lookup-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 12px', flexWrap: 'nowrap', gap: '6px', boxSizing: 'border-box' }}>
          <div className="lookup-logo" onClick={() => setView('home')} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 1, minWidth: 0, whiteSpace: 'nowrap', cursor: 'pointer' }}>
            <img src="/1111.png" alt="Logo" style={{ width: '32px', height: '32px', maxWidth: '32px', maxHeight: '32px', flexShrink: 0, objectFit: 'contain' }} />

            <span className="lookup-logo-text" style={{ fontWeight: '800', lineHeight: 1, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', letterSpacing: '0.2px' }}>
              <span>28Symues&nbsp;</span>
              <span style={{ color: '#f97316', whiteSpace: 'nowrap', display: 'inline' }}>Affiliate</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, whiteSpace: 'nowrap' }}>
            <ThemeToggle />
            <button
              className="lookup-admin-link"
              onClick={() => { setView('home'); window.history.pushState({}, '', '/'); }}
              style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0, cursor: 'pointer' }}
            >
              <i className="fa-solid fa-house" style={{ color: '#ea580c', flexShrink: 0 }}></i>
              <span style={{ whiteSpace: 'nowrap', display: 'inline' }}>Trang chủ</span>
            </button>
          </div>
        </header>

        {/* Search Panel Card */}
        <div className="lookup-card">
          <h2 className="lookup-title">
            <i className="fa-thin fa-magnifying-glass" style={{ marginRight: '8px' }}></i> Tra Cứu Đơn Hàng Shopee & TikTok Shop
          </h2>
          <p className="lookup-subtitle">Nhập mã đơn hàng Shopee hoặc TikTok Shop để kiểm tra trạng thái và hoa hồng</p>

          <div className="lookup-input-group">
            <label className="lookup-label">
              Mã đơn hàng (Shopee / TikTok Shop)
            </label>
            <input 
              type="text"
              className="lookup-input"
              value={lookupQuery}
              onChange={(e) => setLookupQuery(e.target.value)}
              placeholder="Ví dụ: 260606C8W7YARK (Shopee) hoặc 585592697583797863 (TikTok)..."
              onKeyDown={(e) => e.key === 'Enter' && handlePublicLookup(null, 'ORDER_ID')}
            />
          </div>

          <button 
            className="lookup-btn"
            onClick={() => handlePublicLookup(null, 'ORDER_ID')}
            disabled={lookupLoading}
          >
            {lookupLoading ? (
              <>
                <div className="lookup-spinner"></div>
                Đang tìm kiếm...
              </>
            ) : (
              'Tra cứu đơn hàng'
            )}
          </button>

          {/* Recent Searches */}
          {lookupRecentSearches.filter(item => item.searchType === 'ORDER_ID').length > 0 && (
            <div className="recent-searches">
              <span>Lịch sử:</span>
              {lookupRecentSearches.filter(item => item.searchType === 'ORDER_ID').map((item, idx) => (
                <div 
                  key={idx} 
                  className="recent-tag"
                  onClick={() => {
                    setLookupQuery(item.query);
                    setLookupSearchType(item.searchType);
                    handlePublicLookup(item.query, item.searchType);
                  }}
                >
                  <span>🛒 {item.query.length > 15 ? item.query.substring(0, 15) + '...' : item.query}</span>
                  <span className="recent-close" onClick={(e) => removeRecentSearch(e, idx)}>&times;</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Results Panel */}
        {lookupResult && (
          <>
            {/* 0. Bank Info Card */}
            <div className="lookup-card" style={{ marginBottom: '24px' }}>
              <h3 className="stats-section-title bank-card-header-title">
                <span className="bank-card-title-text">🏦 Thông Tin Ngân Hàng Nhận Tiền</span>
                {!isEditingBank && (
                  <button 
                    className="bank-edit-btn" 
                    onClick={() => {
                      setEditBankName(lookupResult.bankName || '');
                      setEditAccountNumber(lookupResult.accountNumber || '');
                      setBankSaveError('');
                      setIsEditingBank(true);
                    }}
                  >
                    <i className="fa-regular fa-pen-to-square" style={{ fontSize: '12px' }}></i>
                    <span>{lookupResult.bankName ? 'Sửa' : 'Cài đặt'}</span>
                  </button>
                )}
              </h3>
                  
                  {isEditingBank ? (
                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div className="lookup-date-grid" style={{ marginBottom: '4px' }}>
                        <div className="lookup-input-group" style={{ marginBottom: 0 }}>
                          <label className="lookup-label">Tên Ngân Hàng</label>
                          <input 
                            type="text" 
                            className="lookup-input" 
                            placeholder="Ví dụ: MB, Techcombank..." 
                            value={editBankName}
                            onChange={(e) => setEditBankName(e.target.value)}
                          />
                        </div>
                        <div className="lookup-input-group" style={{ marginBottom: 0 }}>
                          <label className="lookup-label">Số Tài Khoản</label>
                          <input 
                            type="text" 
                            className="lookup-input" 
                            placeholder="Số tài khoản..." 
                            value={editAccountNumber}
                            onChange={(e) => setEditAccountNumber(e.target.value)}
                          />
                        </div>
                      </div>
                      {bankSaveError && <div style={{ color: '#ef4444', fontSize: '12px' }}>⚠️ {bankSaveError}</div>}
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                        <button 
                          className="lookup-admin-link" 
                          style={{ padding: '6px 14px', background: 'var(--bg-main)', color: 'var(--text-muted)' }}
                          onClick={() => setIsEditingBank(false)}
                          disabled={bankSaveLoading}
                        >
                          Hủy
                        </button>
                        <button 
                          className="lookup-btn" 
                          style={{ width: 'auto', padding: '6px 16px', fontSize: '13px' }}
                          onClick={() => sendOtpToUser('BANK')}
                          disabled={bankSaveLoading}
                        >
                          {bankSaveLoading ? 'Đang lưu...' : 'Lưu thông tin'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bank-info-display-box">
                      <div>
                        <span className="bank-info-label">NGÂN HÀNG</span>
                        <strong className="bank-info-val">{lookupResult.bankName || 'Chưa thiết lập'}</strong>
                      </div>
                      <div>
                        <span className="bank-info-label">SỐ TÀI KHOẢN</span>
                        <strong className="bank-info-val">{lookupResult.accountNumber || 'Chưa thiết lập'}</strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* 1. Wallet Stats */}
                <div className="stats-container">
                  <h3 className="stats-section-title">
                    💰 Thống Kê Hoa Hồng của: <span style={{ color: '#ea580c' }}>{lookupResult.zaloName}</span>
                  </h3>
                  <div className="stats-cards-grid">
                    <div className="stat-card-item total">
                      <span className="stat-card-label">Tổng tích lũy (Hoàn thành + Chờ)</span>
                      <span className="stat-card-value primary">{formatMoney(totalCommission)}</span>
                    </div>
                    <div className="stat-card-item pending">
                      <span className="stat-card-label">Đang chờ xử lý</span>
                      <span style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Đang vận chuyển hoặc chưa xác nhận</span>
                      <span className="stat-card-value">{formatMoney(lookupResult.wallet.pendingCommission)}</span>
                    </div>
                    <div className="stat-card-item completed">
                      <span className="stat-card-label">Đã hoàn thành</span>
                      <span style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Đã ấn giao hàng thành công</span>
                      <span className="stat-card-value">{formatMoney(lookupResult.wallet.completedCommission)}</span>
                    </div>
                    <div className="stat-card-item withdrawable">
                      <span className="stat-card-label">Có thể rút ngay (Khả dụng)</span>
                      <span style={{ fontSize: '11px', color: '#ea580c', marginBottom: '4px' }}>Sau 3 ngày • Đã trừ thuế & chia 8-2</span>
                      <span className="stat-card-value" style={{ color: '#ea580c' }}>{formatMoney(lookupResult.wallet.withdrawableCommission)}</span>
                    </div>
                    <div className="stat-card-item received">
                      <span className="stat-card-label">Đã nhận (Đã thanh toán)</span>
                      <span style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Tổng tiền đã rút về tài khoản</span>
                      <span className="stat-card-value" style={{ color: '#16a34a' }}>{formatMoney(lookupResult.wallet.receivedCommission)}</span>
                    </div>
                  </div>
                </div>

                {/* 1.5. Payout Request Card */}
                <div className="lookup-card" style={{ marginBottom: '24px' }}>
                  <h3 className="stats-section-title" style={{ margin: 0, marginBottom: '12px' }}>
                    <span>💸 Rút Tiền Hoa Hồng Khả Dụng</span>
                  </h3>
                  <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 16px 0', lineHeight: '1.4' }}>
                    Tiền hoa hồng của đơn "Hoàn thành" sau 3 ngày sẽ tự động chuyển xuống ví khả dụng để rút (đã trừ thuế Shopee và chia 8-2). Lệnh rút tiền sau khi gửi sẽ được duyệt thủ công bởi Trưởng nhóm Phạm Thắng.
                  </p>

                  {lookupResult.wallet.withdrawableCommission > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div className="lookup-input-group" style={{ marginBottom: 0 }}>
                        <label className="lookup-label">Số Tiền Muốn Rút (đ)</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <input 
                            type="text" 
                            className="lookup-input" 
                            placeholder={`Tối đa: ${formatMoney(lookupResult.wallet.withdrawableCommission)}`}
                            value={payoutAmount}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^\d]/g, '');
                              if (val) {
                                setPayoutAmount(new Intl.NumberFormat('vi-VN').format(parseFloat(val)));
                              } else {
                                setPayoutAmount('');
                              }
                            }}
                          />
                          <button 
                            className="lookup-admin-link"
                            style={{ position: 'absolute', right: '8px', fontSize: '11px', padding: '4px 8px', background: '#fff7ed', color: '#ea580c', borderColor: '#fed7aa' }}
                            onClick={() => setPayoutAmount(new Intl.NumberFormat('vi-VN').format(lookupResult.wallet.withdrawableCommission))}
                          >
                            Rút hết
                          </button>
                        </div>
                      </div>
                      
                      {payoutSaveError && <div style={{ color: '#ef4444', fontSize: '12px' }}>⚠️ {payoutSaveError}</div>}
                      
                      <button 
                        className="lookup-btn" 
                        onClick={() => sendOtpToUser('PAYOUT')}
                        disabled={payoutSaveLoading || !payoutAmount}
                        style={{ marginTop: '4px' }}
                      >
                        {payoutSaveLoading ? (
                          <>
                            <div className="lookup-spinner"></div>
                            Đang gửi yêu cầu...
                          </>
                        ) : (
                          'Gửi yêu cầu rút tiền'
                        )}
                      </button>
                    </div>
                  ) : (
                    <div style={{ padding: '16px', background: '#fef2f2', border: '1px dashed #fca5a5', borderRadius: '8px', textAlign: 'center', color: '#b91c1c', fontSize: '13px' }}>
                      🔒 Số dư khả dụng của sếp hiện đang là 0đ. Chưa thể rút tiền lúc này.
                    </div>
                  )}
                </div>

            {/* 2. Orders Cards List */}
            <div className="orders-container">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '10px', marginBottom: '16px', width: '100%' }}>
                <h3 className="stats-section-title" style={{ marginBottom: 0, width: '100%', fontSize: '16px', fontWeight: '700', color: 'var(--text-bright)' }}>
                  {`🛒 Đơn hàng đã mua (${searchedOrders.length})`}
                </h3>
                {lookupResult && lookupResult.orders && lookupResult.orders.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginBottom: '4px' }}>
                    <div className="lookup-tabs" style={{ marginBottom: 0 }}>
                      <button className={`lookup-tab ${platformFilter === 'ALL' ? 'active' : ''}`} onClick={() => setPlatformFilter('ALL')}>Tất cả ({lookupResult.orders.length})</button>
                      <button className={`lookup-tab ${platformFilter === 'Shopee' ? 'active' : ''}`} onClick={() => setPlatformFilter('Shopee')}>🟠 Shopee ({lookupResult.orders.filter(o => !o.platform || o.platform === 'Shopee').length})</button>
                      <button className={`lookup-tab ${platformFilter === 'TikTok Shop' ? 'active' : ''}`} onClick={() => setPlatformFilter('TikTok Shop')}>🎵 TikTok Shop ({lookupResult.orders.filter(o => o.platform === 'TikTok Shop').length})</button>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Lọc nhanh theo tên / mã đơn..." 
                      className="lookup-input"
                      style={{ width: '100%', maxWidth: '100%', padding: '8px 12px', fontSize: '13px', borderRadius: '8px', margin: 0 }}
                      value={lookupLocalFilter}
                      onChange={(e) => setLookupLocalFilter(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {searchedOrders.length === 0 ? (
                <div className="lookup-card" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                  📭 Không tìm thấy đơn hàng nào khớp điều kiện lọc.
                </div>
              ) : (
                searchedOrders.map((o) => (
                  <div key={o.id} className="order-card-item">
                    <div className="order-card-header">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontWeight: '700',
                          background: o.platform === 'TikTok Shop' ? 'rgba(0,0,0,0.06)' : 'rgba(234,88,12,0.1)',
                          color: o.platform === 'TikTok Shop' ? 'var(--text-bright)' : '#ea580c',
                          border: `1px solid ${o.platform === 'TikTok Shop' ? 'var(--border-color)' : '#fed7aa'}`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {o.platform === 'TikTok Shop' ? '🎵 TikTok Shop' : '🟠 Shopee'}
                        </span>
                        <span>{formatDateTime(o.purchaseTime)}</span>
                      </span>
                      <span>Mã đơn: <span className="order-id-badge">{o.orderId}</span></span>
                    </div>
                    <div className="order-card-title" title={o.productName}>
                      {o.productName}
                    </div>
                    <div className="order-card-commission-row">
                      <span className="order-status-badge completed" style={{ 
                        background: o.status === 'Hoàn thành' ? '#ecfdf5' : 
                                    o.status === 'Hủy' ? '#fef2f2' : '#fff7ed',
                        color: o.status === 'Hoàn thành' ? '#059669' : 
                               o.status === 'Hủy' ? '#dc2626' : '#ea580c',
                        border: `1px solid ${o.status === 'Hoàn thành' ? '#a7f3d0' : 
                                              o.status === 'Hủy' ? '#fca5a5' : '#fed7aa'}`
                      }}>
                        {o.status}
                      </span>
                      <div style={{ textAlign: 'right' }}>
                        <span className="order-commission-label">Hoa hồng: </span>
                        <span className="order-commission-val">{formatMoney(o.commission)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* OTP Verification Modal */}
        {otpModalOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px'
          }}>
            <div className="lookup-card" style={{
              width: '100%',
              maxWidth: '400px',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
              borderRadius: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
              background: '#ffffff',
              padding: '32px 24px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Glowing Lock Badge */}
              <div style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                background: '#fff7ed',
                border: '1px solid #fed7aa',
                boxShadow: '0 0 25px rgba(249, 115, 22, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px',
                fontSize: '36px'
              }}>
                🔒
              </div>

              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '8px', letterSpacing: '-0.3px' }}>
                Xác Thực Bảo Mật OTP
              </h3>
              <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: '1.5', marginBottom: '16px', padding: '0 8px' }}>
                Mã xác thực 6 số vừa được gửi đến <span style={{ color: '#ea580c', fontWeight: '600' }}>tin nhắn riêng Zalo</span> của bạn.
              </p>

              {/* Alert Info Box */}
              <div style={{
                background: '#fff7ed',
                border: '1px solid #fed7aa',
                borderRadius: '12px',
                padding: '10px 12px',
                fontSize: '12.5px',
                color: '#c2410c',
                marginBottom: '22px',
                lineHeight: '1.4',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '16px' }}>💡</span>
                <span>Chưa nhận được mã hoặc mã lỗi? Hãy bấm nút <b>Gửi lại mã OTP</b> bên dưới nhé!</span>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <input
                  type="text"
                  maxLength="6"
                  placeholder="• • • • • •"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^\d]/g, ''))}
                  style={{
                    width: '100%',
                    padding: '14px 12px',
                    fontSize: '22px',
                    textAlign: 'center',
                    letterSpacing: '8px',
                    fontWeight: '800',
                    borderRadius: '14px',
                    border: '1.5.px solid #f97316',
                    background: '#f8fafc',
                    color: '#ea580c',
                    outline: 'none',
                    boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.05)'
                  }}
                />
              </div>

              {otpError && (
                <div style={{ color: '#dc2626', fontSize: '13px', marginBottom: '18px', background: '#fef2f2', border: '1px solid #fca5a5', padding: '10px', borderRadius: '10px', fontWeight: '500' }}>
                  ⚠️ {otpError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginBottom: '22px' }}>
                <button
                  onClick={() => setOtpModalOpen(false)}
                  style={{ flex: 1, padding: '13px', borderRadius: '12px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: 'all 0.2s' }}
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={() => {
                    if (!otpCode || otpCode.length !== 6) {
                      setOtpError('Vui lòng nhập đủ 6 số OTP');
                      return;
                    }
                    if (otpActionType === 'BANK') handleSaveBankInfo(otpCode);
                    if (otpActionType === 'PAYOUT') handleRequestPayout(otpCode);
                  }}
                  disabled={bankSaveLoading || payoutSaveLoading}
                  style={{ flex: 1.4, padding: '13px', borderRadius: '12px', fontSize: '14.5px', background: 'linear-gradient(135deg, #f97316, #ea580c)', color: '#ffffff', border: 'none', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 6px 20px rgba(249, 115, 22, 0.35)', transition: 'all 0.2s' }}
                >
                  {(bankSaveLoading || payoutSaveLoading) ? 'Đang kiểm tra...' : 'Xác nhận ngay'}
                </button>
              </div>

              {/* Pill Button Gửi lại mã OTP - Dùng SVG thay thế emoji để không bao giờ bị lỗi font ô vuông */}
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '18px' }}>
                <button
                  onClick={() => sendOtpToUser(otpActionType)}
                  disabled={otpSending || otpCountdown > 0}
                  style={{
                    background: (otpSending || otpCountdown > 0) ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    borderRadius: '20px',
                    padding: '8px 18px',
                    color: (otpSending || otpCountdown > 0) ? '#64748b' : '#e2e8f0',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: (otpSending || otpCountdown > 0) ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
                  {otpSending ? 'Đang gửi lại...' : (otpCountdown > 0 ? `Gửi lại mã sau (${otpCountdown}s)` : 'Gửi lại mã OTP (Miễn phí)')}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* QR Banner — dưới cùng trang tra cứu */}
        {showBanner && (
          <div className="lookup-banner-section">
            <h4>🌟 Tham gia nhóm Zalo nhận hoàn tiền</h4>
            <div className="lookup-banner-img-wrap">
              <button
                className="lookup-banner-close"
                onClick={(e) => { e.stopPropagation(); setShowBanner(false); }}
              >
                ×
              </button>
              <img src="/banner.jpg" alt="Tham gia Zalo Group nhận hoa hồng" />
            </div>
          </div>
        )}
        {renderMobileBottomNav()}
      </div>
    );
  }

  if (view === 'login') {
    const calculatedWidth = Math.max(200, Math.min(336, windowWidth - 64));
    const isMobile = windowWidth < 768;
    
    const handleGoogleLoginMobile = () => {
      const clientId = '195858897824-4h5ffebs0djtuncmhod98o0ca495ju71.apps.googleusercontent.com';
      const redirectUri = window.location.origin;
      const nonce = Math.random().toString(36).substring(2) + Date.now();
      const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=id_token&scope=openid%20profile%20email&nonce=${nonce}`;
      window.location.href = url;
    };

    return (
      <div className="login-page-split">
        <style dangerouslySetInnerHTML={{__html: `
          .login-page-split {
            min-height: 100vh;
            width: 100%;
            background: #f8fafc;
            display: flex;
            flex-direction: column;
            position: relative;
            overflow-y: auto;
            box-sizing: border-box;
            color: #1e293b;
          }
          .login-page-split::before {
            content: '';
            position: absolute;
            top: -10%;
            left: -10%;
            width: 500px;
            height: 500px;
            background: radial-gradient(circle, rgba(249, 115, 22, 0.1) 0%, rgba(234, 88, 12, 0.03) 40%, transparent 70%);
            z-index: 1;
            pointer-events: none;
            animation: floatOrb1 12s ease-in-out infinite;
          }
          .login-page-split::after {
            content: '';
            position: absolute;
            bottom: -10%;
            right: -10%;
            width: 500px;
            height: 500px;
            background: radial-gradient(circle, rgba(249, 115, 22, 0.08) 0%, rgba(234, 88, 12, 0.02) 40%, transparent 70%);
            z-index: 1;
            pointer-events: none;
            animation: floatOrb2 15s ease-in-out infinite;
          }
          .login-split-header {
            height: 70px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 40px;
            z-index: 10;
            width: 100%;
            box-sizing: border-box;
          }
          .login-split-logo {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .login-split-logo img {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border: 1px solid rgba(249, 115, 22, 0.35);
            object-fit: cover;
          }
          .login-split-logo span {
            font-family: var(--font-heading);
            font-size: 20px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: 0.5px;
          }
          .login-split-nav {
            display: flex;
            align-items: center;
            gap: 24px;
          }
          .login-split-nav a {
            color: #64748b;
            font-size: 14.5px;
            transition: color 0.2s;
            text-decoration: none;
            cursor: pointer;
          }
          .login-split-nav a:hover {
            color: #ea580c;
          }
          .login-split-nav .btn-back {
            background: #ffffff;
            border: 1px solid #cbd5e1;
            color: #334155;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 13.5px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
          }
          .login-split-nav .btn-back:hover {
            background: #fff7ed;
            border-color: #f97316;
            color: #ea580c;
          }
          .login-split-content {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 80px;
            max-width: 1200px;
            margin: 0 auto;
            width: 100%;
            gap: 60px;
            z-index: 10;
            box-sizing: border-box;
          }
          .login-split-left {
            flex: 1.1;
            text-align: left;
          }
          .login-split-left .badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #fff7ed;
            border: 1px solid #ffedd5;
            color: #ea580c;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            margin-bottom: 24px;
          }
          .login-split-left h1 {
            font-family: var(--font-heading);
            font-size: 40px;
            font-weight: 800;
            color: #0f172a;
            line-height: 1.3;
            margin: 0 0 20px;
          }
          .login-split-left p {
            font-size: 16px;
            color: #475569;
            line-height: 1.6;
            margin: 0;
          }
          .login-split-right {
            flex: 0.9;
            display: flex;
            justify-content: flex-end;
            width: 100%;
          }
          .login-split-card {
            background: #ffffff;
            backdrop-filter: blur(25px);
            -webkit-backdrop-filter: blur(25px);
            border: 1px solid #e2e8f0;
            border-radius: 24px;
            width: 100%;
            max-width: 440px;
            padding: 28px 32px;
            box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.08);
            box-sizing: border-box;
          }
          .login-split-card h2 {
            font-family: var(--font-heading);
            font-size: 28px;
            font-weight: 800;
            color: #0f172a;
            margin: 0 0 8px;
            text-align: left;
          }
          .login-split-card .subtitle {
            font-size: 13.5px;
            color: #64748b;
            margin-bottom: 16px;
            text-align: left;
          }
          .form-label {
            display: block;
            text-align: left;
            font-size: 13px;
            font-weight: 600;
            color: #334155;
            margin-bottom: 8px;
          }
          .form-input-wrapper {
            position: relative;
            margin-bottom: 10px;
          }
          .form-input {
            width: 100%;
            padding: 13px 16px;
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 12px;
            color: #0f172a;
            font-size: 14.5px;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            box-sizing: border-box;
          }
          .form-input:focus {
            outline: none;
            border-color: #f97316;
            background: #ffffff;
            box-shadow: 0 0 16px rgba(249, 115, 22, 0.2);
          }
          
          /* Simulated Cloudflare Turnstile CSS */
          .cf-turnstile-sim {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-height: 58px;
            margin: 16px 0 20px;
            box-sizing: border-box;
            color: #1e293b;
            user-select: none;
          }
          .cf-verifying {
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;
            font-size: 13px;
            color: #64748b;
            text-align: left;
          }
          .cf-spinner {
            width: 20px;
            height: 20px;
            border: 2px solid rgba(0,0,0,0.1);
            border-top-color: #f97316;
            border-radius: 50%;
            animation: cfSpin 0.8s linear infinite;
            flex-shrink: 0;
          }
          @keyframes cfSpin {
            to { transform: rotate(360deg); }
          }
          .cf-success {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
          }
          .cf-success-left {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .cf-check-circle {
            width: 24px;
            height: 24px;
            background: #22c55e;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-size: 12px;
          }
          .cf-success-left span {
            font-size: 14px;
            font-weight: 600;
            color: #1e293b;
          }
          .cf-success-right {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 1px;
            line-height: 1;
          }
          .cf-cloud-svg {
            width: 20px;
            height: 12px;
          }
          .cf-brand-text {
            font-size: 7px;
            font-weight: 800;
            letter-spacing: 0.8px;
            color: #64748b;
          }
          .cf-links {
            display: flex;
            gap: 6px;
            margin-top: 1px;
          }
          .cf-links a {
            font-size: 8px;
            color: #94a3b8;
            text-decoration: underline;
          }
          .cf-links a:hover {
            color: #475569;
          }

          .login-split-footer {
            text-align: center;
            margin-top: 24px;
            font-size: 13.5px;
            color: #64748b;
          }
          .login-split-footer a {
            color: #ea580c;
            text-decoration: underline;
          }

          @media (max-width: 992px) {
            .login-page-split {
              height: auto;
              min-height: 100vh;
              overflow-y: visible;
              display: flex;
              flex-direction: column;
            }
            .login-split-header {
              padding: 12px 16px !important;
              height: auto !important;
              display: flex !important;
              flex-wrap: nowrap !important;
              align-items: center !important;
              justify-content: space-between !important;
              gap: 6px !important;
            }
            .login-split-logo {
              gap: 6px !important;
              flex-shrink: 1 !important;
              min-width: 0 !important;
            }
            .login-split-logo img {
              width: 28px !important;
              height: 28px !important;
              flex-shrink: 0 !important;
            }
            .login-logo-text {
              font-size: 14px !important;
              white-space: nowrap !important;
            }
            .login-split-nav {
              gap: 6px !important;
              flex-shrink: 0 !important;
            }
            .login-split-nav .btn-back {
              padding: 4px 8px !important;
              font-size: 11.5px !important;
              white-space: nowrap !important;
            }
            .btn-back-text {
              white-space: nowrap !important;
            }
            .login-split-content {
              flex-direction: column;
              padding: 20px 20px 60px;
              gap: 30px;
              justify-content: center;
              flex: 1;
            }
            .login-split-left {
              text-align: center;
              max-width: 100%;
            }
            .login-split-left h1 {
              font-size: 28px;
              margin-bottom: 12px;
            }
            .login-split-left p {
              font-size: 14px;
            }
            .login-split-right {
              justify-content: center;
              width: 100%;
            }
            .login-split-card {
              padding: 24px 20px;
              width: 100%;
              max-width: 100%;
            }
          }
          @media (max-width: 480px) {
            .login-split-header {
              padding: 10px 10px !important;
            }
            .login-split-logo img {
              width: 24px !important;
              height: 24px !important;
            }
            .login-logo-text {
              font-size: 13px !important;
              white-space: nowrap !important;
            }
            .login-split-nav .btn-back {
              padding: 3px 7px !important;
              font-size: 11px !important;
              white-space: nowrap !important;
            }
            .login-split-left h1 {
              font-size: 24px;
            }
            .login-split-card h2 {
              font-size: 22px;
            }
          }
        `}} />

        {/* Header */}
        <header className="login-split-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 12px', flexWrap: 'nowrap', gap: '6px', boxSizing: 'border-box' }}>
          <div className="login-split-logo" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 1, minWidth: 0, whiteSpace: 'nowrap' }}>
            <img src="/1111.png" alt="Logo" style={{ width: '32px', height: '32px', maxWidth: '32px', maxHeight: '32px', flexShrink: 0, objectFit: 'contain' }} />

            <span className="login-logo-text" style={{ fontWeight: '800', lineHeight: 1, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', letterSpacing: '0.2px' }}>
              <span>28Symues&nbsp;</span>
              <span style={{ color: '#f97316', whiteSpace: 'nowrap', display: 'inline' }}>Affiliate</span>
            </span>
          </div>
          <div className="login-split-nav" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, whiteSpace: 'nowrap' }}>
            <ThemeToggle />
            <button 
              className="btn-back" 
              onClick={() => {
                setView('home');
                window.history.pushState({}, '', '/');
              }}
              style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0, cursor: 'pointer' }}
            >
              <i className="fa-solid fa-house" style={{ color: '#ea580c', flexShrink: 0 }}></i>
              <span className="btn-back-text" style={{ whiteSpace: 'nowrap', display: 'inline' }}>Trang chủ</span>
            </button>
          </div>
        </header>

        {/* Main Content split */}
        <div className="login-split-content">
          <div className="login-split-left">
            <div className="badge">
              <i className="fa-thin fa-robot" style={{ fontSize: '14px' }}></i> 28Symues <span style={{ color: '#ea580c' }}>Affiliate</span>
            </div>
            <h1>Đăng nhập tài khoản</h1>
            <p>
              Đăng nhập để theo dõi trạng thái đơn hàng Shopee, xem thống kê doanh số hoa hồng tạm tính và duyệt yêu cầu rút tiền tự động của các thành viên trong hệ thống.
            </p>
          </div>

          <div className="login-split-right">
            <div className="login-split-card">
              <h2>Đăng nhập</h2>
              <p className="subtitle">Phiên đăng nhập được lưu trên trình duyệt hiện tại.</p>

              {loginError && <div className="login-error-msg">{loginError}</div>}

              <form onSubmit={handleLocalLogin}>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">Username</label>
                  <div className="form-input-wrapper">
                    <input 
                      type="email" 
                      className="form-input" 
                      placeholder="Email của bạn"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">Password</label>
                  <div className="form-input-wrapper">
                    <input 
                      type="password" 
                      className="form-input" 
                      placeholder="••••••••••••"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                  </div>
                </div>

                {/* Terms Acceptance checkbox */}
                <div className="terms-checkbox-wrapper" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', textAlign: 'left', margin: '16px 0 10px', fontSize: '13px', color: '#64748b' }}>
                  <input 
                    type="checkbox" 
                    id="accept-terms" 
                    required 
                    style={{ marginTop: '3px', cursor: 'pointer' }}
                  />
                  <label htmlFor="accept-terms" style={{ cursor: 'pointer', lineHeight: '1.4' }}>
                    Tôi đồng ý với <a href="#" onClick={(e) => e.preventDefault()} style={{ color: '#ea580c', textDecoration: 'underline' }}>Điều khoản dịch vụ</a> và <a href="#" onClick={(e) => e.preventDefault()} style={{ color: '#ea580c', textDecoration: 'underline' }}>Chính sách bảo mật</a>.
                  </label>
                </div>

                {/* Simulated Cloudflare Turnstile Widget */}
                <div className="cf-turnstile-sim">
                  {cfStatus === 'verifying' ? (
                    <div className="cf-verifying">
                      <div className="cf-spinner"></div>
                      <span>Đang kiểm tra an toàn kết nối...</span>
                    </div>
                  ) : (
                    <div className="cf-success">
                      <div className="cf-success-left">
                        <div className="cf-check-circle">
                          <i className="fa-solid fa-check"></i>
                        </div>
                        <span>Thành công!</span>
                      </div>
                      <div className="cf-success-right">
                        <svg className="cf-cloud-svg" viewBox="0 0 24 24">
                          <path fill="#f38020" d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
                        </svg>
                        <span className="cf-brand-text">CLOUDFLARE</span>
                        <div className="cf-links">
                          <a href="#" onClick={(e) => e.preventDefault()}>Quyền riêng tư</a>
                          <a href="#" onClick={(e) => e.preventDefault()}>Giúp đỡ</a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button type="submit" className="modal-login-btn" disabled={loginLoading || cfStatus === 'verifying'} style={{ marginTop: '0px' }}>
                  {loginLoading ? 'Đang xác thực...' : 'Đăng nhập'}
                </button>
              </form>

              <div className="modal-divider">Hoặc</div>

              <div className="modal-google-container" style={{ 
                position: 'relative', 
                width: '100%', 
                minHeight: '44px', 
                margin: '0 auto 12px auto' 
              }}>
                <button 
                  className="btn-google-custom" 
                  onClick={handleGoogleLoginMobile}
                  style={{
                    width: '100%',
                    height: '44px',
                    background: '#ffffff',
                    color: '#0f172a',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#fff7ed';
                    e.currentTarget.style.borderColor = '#f97316';
                    e.currentTarget.style.color = '#ea580c';
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(249, 115, 22, 0.2)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.color = '#0f172a';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.28-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  Đăng nhập bằng Google
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'home') {
    return (
      <div className="landing-container">
        {/* Global Fixed Running Cat Mascot Screen Animation */}
        <RunningCatMascot />


        <header className="landing-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '14px 18px', flexWrap: 'nowrap', gap: '8px', boxSizing: 'border-box' }}>
          <div className="landing-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 1, minWidth: 0, whiteSpace: 'nowrap' }}>
            <img src="/1111.png" alt="Logo" style={{ width: '32px', height: '32px', maxWidth: '32px', maxHeight: '32px', flexShrink: 0, objectFit: 'contain' }} />

            <span className="landing-logo-text" style={{ fontWeight: '800', lineHeight: 1, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', letterSpacing: '0.2px' }}>
              <span>28Symues&nbsp;</span>
              <span style={{ color: '#f97316', whiteSpace: 'nowrap', display: 'inline' }}>Affiliate</span>
            </span>
          </div>
          <nav className={`landing-nav${mobileMenuOpen ? ' open' : ''}`}>
            <a href="#home" onClick={() => setMobileMenuOpen(false)}>Trang chủ</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Tính năng</a>
            <a href="#steps" onClick={() => setMobileMenuOpen(false)}>Hướng dẫn</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Bảng giá</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setView('lookup'); window.history.pushState({}, '', '/?view=lookup'); setMobileMenuOpen(false); }} style={{ color: '#ea580c', fontWeight: '700' }}><i className="fa-thin fa-magnifying-glass" style={{ marginRight: '6px' }}></i>Tra cứu đơn hàng</a>
            {/* Mobile-only actions inside nav */}
            <div className="mobile-nav-actions">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: 'var(--bg-main)', borderRadius: '10px', marginBottom: '8px' }}>
                <span style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-main)' }}>Giao diện Dark/Light</span>
                <ThemeToggle />
              </div>
              {token ? (
                <>
                  <div className="user-widget">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Avatar" referrerPolicy="no-referrer" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                    ) : (
                      <div className="user-widget-avatar">{(user?.fullName || 'U').substring(0,1).toUpperCase()}</div>
                    )}
                    <span className="user-widget-name">{user?.fullName}</span>
                  </div>
                  {isAdmin && (
                    <button 
                      onClick={() => { setView('admin'); sessionStorage.setItem('adminView','admin'); setMobileMenuOpen(false); }}
                      style={{
                        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.25), rgba(234, 88, 12, 0.15))',
                        border: '1px solid rgba(249, 115, 22, 0.45)',
                        color: '#ffffff',
                        fontSize: '14.5px',
                        fontWeight: '700',
                        padding: '8px 18px',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 15px rgba(249, 115, 22, 0.15)',
                        transition: 'all 0.25s ease'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #f97316, #ea580c)';
                        e.currentTarget.style.color = '#ffffff';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(249, 115, 22, 0.4)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(249, 115, 22, 0.25), rgba(234, 88, 12, 0.15))';
                        e.currentTarget.style.color = '#ffffff';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(249, 115, 22, 0.15)';
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', flexShrink: 0 }}>
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M19 8a3 3 0 0 1 0 6" />
                        <circle cx="18" cy="18" r="2.5" />
                        <path d="M18 14.5v1M18 20.5v1M14.5 18h1M20.5 18h1" />
                      </svg>
                      Trang Quản Trị
                    </button>
                  )}
                  <button className="btn" onClick={() => { handleLogout(); setMobileMenuOpen(false); }} style={{ border: '1px solid #cbd5e1' }}>
                    Đăng xuất
                  </button>
                </>
              ) : (
                <button className="btn btn-glow" onClick={() => {
                  setLoginError('');
                  setView('login');
                  window.history.pushState({}, '', '/?view=login');
                  setMobileMenuOpen(false);
                }}>
                  Đăng nhập
                </button>
              )}
            </div>
          </nav>
          <div className="landing-actions">
            <ThemeToggle style={{ marginRight: '8px' }} />
            {token ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div className="user-widget">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" referrerPolicy="no-referrer" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                  ) : (
                    <div className="user-widget-avatar">{(user?.fullName || 'U').substring(0,1).toUpperCase()}</div>
                  )}
                  <span className="user-widget-name">{user?.fullName}</span>
                </div>
                
                {isAdmin && (
                  <button 
                    onClick={() => { setView('admin'); sessionStorage.setItem('adminView','admin'); }}
                    style={{
                      background: 'linear-gradient(135deg, #f97316, #ea580c)',
                      border: '1px solid #ea580c',
                      color: '#ffffff',
                      fontSize: '14.5px',
                      fontWeight: '700',
                      padding: '8px 18px',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 15px rgba(249, 115, 22, 0.3)',
                      transition: 'all 0.25s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #ea580c, #c2410c)';
                      e.currentTarget.style.color = '#ffffff';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(249, 115, 22, 0.45)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #f97316, #ea580c)';
                      e.currentTarget.style.color = '#ffffff';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(249, 115, 22, 0.3)';
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', flexShrink: 0 }}>
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M19 8a3 3 0 0 1 0 6" />
                      <circle cx="18" cy="18" r="2.5" />
                      <path d="M18 14.5v1M18 20.5v1M14.5 18h1M20.5 18h1" />
                    </svg>
                    Trang Quản Trị
                  </button>
                )}
                
                <button className="btn" onClick={handleLogout} style={{ border: '1px solid #cbd5e1' }}>
                  Đăng xuất
                </button>
              </div>
            ) : (
              <button className="btn btn-glow" onClick={() => {
                setLoginError('');
                setView('login');
                window.history.pushState({}, '', '/?view=login');
              }}>
                Đăng nhập
              </button>
            )}
          </div>
          {/* Hamburger button - mobile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <button
              className={`hamburger${mobileMenuOpen ? ' active' : ''}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </header>
        {/* Mobile menu overlay */}
        {mobileMenuOpen && <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)}></div>}

        {/* Container 1: Top Hero Banner Container */}
        <section id="home" className="landing-block-container hero-showcase-container reveal-on-scroll" style={{ marginTop: '24px', textAlign: 'center' }}>
          <div className="section-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '30px', background: 'rgba(249, 115, 22, 0.12)', color: '#ea580c', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
            ⚡ HỆ THỐNG AUTOMATION AFFILIATE 4.0
          </div>
          <h1 className="hero-title" style={{ fontSize: '38px', fontWeight: '900', color: 'var(--text-bright)', marginBottom: '14px', lineHeight: '1.2' }}>
            Tự Động Hóa Shopee Affiliate Với 28Symues
          </h1>
          <p className="hero-subtitle" style={{ color: 'var(--text-muted)', fontSize: '16px', maxWidth: '780px', margin: '0 auto 28px', lineHeight: '1.6' }}>
            Biến mọi liên kết mua sắm trong nhóm chat Zalo của bạn thành nguồn thu nhập thụ động chỉ trong vài giây. Tiện lợi, tự động, ghi nhận sub_id chuẩn xác và hoàn toàn minh bạch.
          </p>
          <div className="hero-buttons" style={{ justifyContent: 'center', marginBottom: '36px' }}>
            <a href="#zalo-demo" className="btn btn-hero-1">Bắt đầu ngay</a>
            <button onClick={() => { setView('lookup'); window.history.pushState({}, '', '/?view=lookup'); }} className="btn btn-hero-2">
              <i className="fa-thin fa-magnifying-glass"></i> Tra cứu đơn hàng
            </button>
            <a href="#features" className="btn btn-hero-3">Tìm hiểu tính năng</a>
          </div>

          {/* Big Hero Yellow Cat Banner Image Showcase Card */}
          <div className="banner-showcase-card" style={{ marginTop: '0', borderRadius: '24px' }}>

            <img 
              src="/ChatGPT Image 16_03_45 30 thg 7, 2026.png" 
              alt="Zalo Bot Affiliate System Top Banner Showcase" 
              className="banner-showcase-img" 
            />
          </div>

          {/* Advantage Badges Grid */}
          <div className="banner-badge-grid" style={{ marginTop: '28px' }}>
            <div className="banner-badge-item">
              <div className="banner-badge-icon"><i className="fa-regular fa-link"></i></div>
              <div>
                <div className="banner-badge-title">Tự Động Đổi Link Affiliated</div>
                <div className="banner-badge-desc">Gắn chính xác SubID của người gửi link trong nhóm chat Zalo.</div>
              </div>
            </div>

            <div className="banner-badge-item">
              <div className="banner-badge-icon"><i className="fa-solid fa-bolt"></i></div>
              <div>
                <div className="banner-badge-title">Tốc Độ Phản Hồi &lt; 0.5s</div>
                <div className="banner-badge-desc">Bot trả lời ngay lập tức, kích thích nhu cầu chốt đơn săn sale.</div>
              </div>
            </div>

            <div className="banner-badge-item">
              <div className="banner-badge-icon"><i className="fa-regular fa-wallet"></i></div>
              <div>
                <div className="banner-badge-title">Ví Tích Lũy & Rút Tiền</div>
                <div className="banner-badge-desc">Thành viên tự xem ví và gõ lệnh `/rut-tien` thanh toán nhanh gọn.</div>
              </div>
            </div>

            <div className="banner-badge-item">
              <div className="banner-badge-icon"><i className="fa-brands fa-bots"></i></div>
              <div>
                <div className="banner-badge-title">AI GPT-4o Soạn Lời Chào</div>
                <div className="banner-badge-desc">Tương tác tự nhiên, vui vẻ, tăng tỷ lệ mua hàng vượt trội.</div>
              </div>
            </div>
          </div>
        </section>

        {/* Container 2: Live Zalo Bot Chat Showcase (Desktop PC Version) */}
        <section id="zalo-demo" className="landing-block-container hero-section reveal-on-scroll">
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div className="section-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '30px', background: 'rgba(249, 115, 22, 0.12)', color: '#ea580c', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
              💬 TRẢI NGHIỆM CHATBOT ZALO REALTIME
            </div>
            <h2 className="section-title" style={{ fontSize: '30px', fontWeight: '800', marginBottom: '8px' }}>Tương Tác & Chuyển Đổi Link Tự Động</h2>
            <p className="section-subtitle" style={{ fontSize: '15px' }}>Giao diện đối soát đơn hàng và tự động phản hồi link hoa hồng trực tiếp trên Zalo Desktop</p>
          </div>

          {/* Large Crisp Native Zalo PC Desktop Form with Animated Floating Badges */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '1180px', margin: '0 auto' }}>
            {/* Glowing Animated Floating Badges */}
            <div className="floating-badge badge-top-right">
              <span className="badge-icon">⚡</span>
              <span className="badge-text" style={{ color: '#fb923c' }}>Tốc độ &lt; 0.5s</span>
            </div>

            <div className="floating-badge badge-mid-left">
              <span className="badge-icon">💰</span>
              <span className="badge-text" style={{ color: '#34d399' }}>+18.500đ Vừa ghi nhận</span>
            </div>

            <div className="floating-badge badge-bot-right">
              <span className="badge-icon">🤖</span>
              <span className="badge-text" style={{ color: '#38bdf8' }}>AI GPT-4o Tự Động</span>
            </div>

            <div className="zalo-pc-live-card">
            {/* Zalo PC Topbar */}
            <div className="zalo-pc-topbar">
              <div className="zalo-pc-topbar-left">
                <img src="/MAIN.png" alt="Group Logo" className="zalo-pc-topbar-avatar" />
                <div>
                  <div className="zalo-pc-topbar-title">HOÀN TIỀN HOA HỒNG SHOPPE + ĐẶT ĐƠN NGƯỜI MỚI</div>
                  <div className="zalo-pc-topbar-sub">Cộng đồng • 👤 87 thành viên • Bot 28Symues đang hoạt động</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', color: '#94a3b8', fontSize: '15px', alignItems: 'center' }}>
                <i className="fa-regular fa-user-plus" title="Thêm thành viên"></i>
                <i className="fa-regular fa-magnifying-glass" title="Tìm kiếm"></i>
                <i className="fa-regular fa-sidebar" title="Menu nhóm"></i>
              </div>
            </div>

            {/* Zalo PC Pinned Strip */}
            <div className="zalo-pc-pin-strip">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#f97316', fontWeight: 'bold' }}>📌 Ghi chú:</span>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '680px' }}>
                  📌 CÁCH THỰC HIỆN MUA SẮM & NHẬN HOÀN TIỀN TỰ ĐỘNG Bước 1: Gửi link sản phẩm hoặc...
                </span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 10px', borderRadius: '6px', fontSize: '11px', color: '#94a3b8' }}>+1 ghim ▾</div>
            </div>

            {/* Zalo PC Chat Messages Area */}
            <div className="zalo-pc-chat-main">
              <div className="zalo-pc-divider">04:50 13/08/2026</div>

              {/* Member Message: Phạm Thắng */}
              <div className="zalo-pc-msg-item">
                <img src="/MAIN.png" alt="Phạm Thắng Avatar" className="zalo-pc-msg-avatar-img" />
                <div className="zalo-pc-msg-body">
                  <div className="zalo-pc-author">Phạm Thắng</div>
                  <div className="zalo-pc-bubble">
                    <div style={{ color: '#0284c7', wordBreak: 'break-all', marginBottom: '8px', fontWeight: '600' }}>https://s.shopee.vn/2qTix9i9pp</div>
                    <div className="zalo-pc-link-preview-box">
                      <div className="zalo-pc-link-preview-title">gói lẻ 1kg Phân nền thủy sinh Senda công nghệ Nhật...</div>
                      <div className="zalo-pc-link-preview-desc">Mua gói lẻ 1kg Phân nền thủy sinh Senda công nghệ Nhật, phân nền thủy sinh cá tép cảnh, phụ kiện thủy sinh giá tốt...</div>
                      <div style={{ fontSize: '11.5px', color: '#0284c7' }}>s.shopee.vn</div>
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px', textAlign: 'right' }}>04:50</div>
                  </div>
                </div>
              </div>

              {/* Bot Reply Message: 28Symues Bot */}
              <div className="zalo-pc-msg-item">
                <img src="/MAIN.png" alt="28Symues Bot Avatar" className="zalo-pc-msg-avatar-img" style={{ border: '1px solid #f97316' }} />
                <div className="zalo-pc-msg-body" style={{ maxWidth: '92%' }}>
                  <div className="zalo-pc-author" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#ea580c' }}>28Symues Bot</span>
                    <span style={{ background: '#ea580c', color: '#ffffff', fontSize: '9.5px', padding: '1px 5px', borderRadius: '4px', fontWeight: '800' }}>BOT</span>
                  </div>
                  <div className="zalo-pc-bubble" style={{ borderLeft: '4px solid #ea580c' }}>
                    {/* Quoted Card */}
                    <div className="zalo-pc-quote">
                      <div className="zalo-pc-quote-name">Phạm Thắng</div>
                      <div style={{ color: '#64748b' }}>[Link] https://s.shopee.vn/2qTix9i9pp</div>
                    </div>

                    <div style={{ fontWeight: '600', marginBottom: '8px' }}>Hi <span style={{ color: '#0284c7' }}>@Phạm Thắng</span>, link của bạn đây ạ:</div>
                    <div style={{ marginBottom: '6px' }}>📦 <b>Gói lẻ 1kg Phân nền thủy sinh Senda công nghệ Nhật, phân nền thủy sinh cá tép cảnh, phụ kiện thủy sinh giá tốt</b></div>
                    <div style={{ marginBottom: '6px' }}>💵 <b>Giá tham khảo:</b> <span style={{ color: '#10b981' }}>đ34.000</span></div>
                    <div style={{ marginBottom: '6px', wordBreak: 'break-all' }}>🔗 <b>Link:</b> <span style={{ color: '#0284c7' }}>https://s.shopee.vn/an_redir?origin_link=https%3A%2F%2Fshop...d=17361610405&sub_id=PhamThang_99&deep_and_deferred=1</span></div>
                    <div style={{ marginBottom: '6px' }}>💵 <b>Tổng hoa hồng:</b> <span style={{ color: '#ea580c', fontWeight: 'bold' }}>3% (đ1.020)</span> [Shop: 3% (đ1.020)]</div>
                    <div className="zalo-pc-warning-note">
                      ⚠️ <b>Lưu ý:</b> Click xong mua ngay trong ngày (nếu bấm link lần 2 trước khi đặt hàng để tăng tỷ lệ chuyển đổi), không xem Video/Live, xóa giỏ trước khi click.
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '6px', textAlign: 'right' }}>04:50</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Zalo PC Bottom Toolbar */}
            <div className="zalo-pc-bottom-bar">
              <div className="zalo-pc-icons-mobile-hide" style={{ display: 'flex', gap: '14px', color: '#94a3b8', fontSize: '16px' }}>
                <i className="fa-regular fa-smile"></i>
                <i className="fa-regular fa-image"></i>
                <i className="fa-regular fa-paperclip"></i>
                <i className="fa-regular fa-address-card"></i>
                <i className="fa-regular fa-crop-simple"></i>
                <i className="fa-regular fa-font"></i>
              </div>
              <div className="zalo-pc-input-placeholder">
                Nhập @, tin nhắn tới HOÀN TIỀN HOA HỒNG SHOPPE + ĐẶT ĐƠN NGƯỜI MỚI...
              </div>
              <div style={{ display: 'flex', gap: '12px', color: '#f97316', fontSize: '18px' }}>
                <i className="fa-regular fa-face-smile"></i>
                <i className="fa-solid fa-thumbs-up"></i>
              </div>
            </div>
          </div>
        </div>
      </section>

        {/* Features Section Container */}
        <section id="features" className="landing-block-container features-section reveal-on-scroll">
          <h2 className="section-title">Tính Năng Nổi Bật</h2>
          <p className="section-subtitle">Mọi thứ bạn cần để vận hành hệ thống săn sale hoa hồng tự động</p>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon"><i className="fa-regular fa-link"></i></div>
              <h3 className="feature-title">Chuyển Đổi Link Tự Động</h3>
              <p className="feature-desc">
                Tự động nhận diện link Shopee, Lazada, TikTok Shop và chuyển đổi thành link affiliate có gắn Zalo ID của người gửi làm sub_id.
              </p>
            </div>
            <div className="feature-card success">
              <div className="feature-icon"><i className="fa-brands fa-bots"></i></div>
              <h3 className="feature-title">Tương Tác Bằng AI</h3>
              <p className="feature-desc">
                Sử dụng mô hình AI GPT-4o để tự động soạn thảo lời phản hồi vui nhộn, hấp dẫn, nâng cao tỷ lệ nhấn click mua sản phẩm.
              </p>
            </div>
            <div className="feature-card warning">
              <div className="feature-icon"><i className="fa-regular fa-chart-area"></i></div>
              <h3 className="feature-title">Thống Kê Chi Tiết</h3>
              <p className="feature-desc">
                Theo dõi đầy đủ lịch sử đơn hàng đã mua, phần trăm hoa hồng tạm tính và doanh số rút tiền của từng thành viên trong hệ thống.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><i className="fa-brands fa-cc-apple-pay"></i></div>
              <h3 className="feature-title">Rút Tiền Tự Động</h3>
              <p className="feature-desc">
                Thành viên yêu cầu rút tiền trực tiếp bằng cú pháp `/rut-tien` trong nhóm Zalo. Admin phê duyệt nhanh chóng trên Dashboard.
              </p>
            </div>
          </div>
        </section>

        {/* Steps Section Container */}
        <section id="steps" className="landing-block-container instructions-section reveal-on-scroll">
          <h2 className="section-title">3 Bước Bắt Đầu Đơn Giản</h2>
          <p className="section-subtitle">Chỉ mất 5 phút để thiết lập và khởi chạy chatbot trong nhóm của bạn</p>
          <div className="instructions-grid">
            <div className="instruction-step">
              <div className="step-num">1</div>
              <h3 className="step-title">Quét QR Kết Nối</h3>
              <p className="step-desc">Quét mã QR Zalo từ client bot để kết nối tài khoản phụ làm bot săn sale tự động.</p>
            </div>
            <div className="instruction-step">
              <div className="step-num">2</div>
              <h3 className="step-title">Thêm Vào Nhóm Chat</h3>
              <p className="step-desc">Thêm Bot vào nhóm săn sale của bạn. Bot sẽ tự động chào và lắng nghe các link sản phẩm.</p>
            </div>
            <div className="instruction-step">
              <div className="step-num">3</div>
              <h3 className="step-title">Mua Sắm & Nhận Tiền</h3>
              <p className="step-desc">Mọi đơn hàng thành công sẽ được đối soát và cộng dồn ví hoa hồng, rút nhanh qua lệnh chat.</p>
            </div>
          </div>
        </section>

        {/* Pricing Section Container */}
        <section id="pricing" className="landing-block-container pricing-section reveal-on-scroll" style={{ textAlign: 'center' }}>
          <h2 className="section-title" style={{ fontSize: '36px', fontWeight: '800', color: 'var(--text-bright)', marginBottom: '12px' }}>Bảng Giá Dịch Vụ</h2>
          <p className="section-subtitle" style={{ color: 'var(--text-muted)', fontSize: '16px', marginBottom: '48px' }}>Chi phí tối ưu, hiệu quả tối đa cho nhóm Zalo săn sale của bạn</p>
          
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '24px',
            width: '100%',
            margin: '0 auto'
          }}>
            
            {/* Gói Thường */}
            <div className="pricing-card" style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '24px',
              padding: '40px 32px',
              width: '100%',
              maxWidth: '360px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.05)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.3s ease'
            }}>
              <div>
                <h3 style={{ fontSize: '22px', color: '#0f172a', marginBottom: '8px', fontWeight: '700' }}>Zalo Bot Affiliate</h3>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>Tự động chuyển đổi link mua sắm cơ bản trong nhóm chat</p>
                
                <div style={{ marginBottom: '32px' }}>
                  <span style={{ fontSize: '42px', fontWeight: '800', color: '#0f172a', fontFamily: 'var(--font-heading)' }}>199.000đ</span>
                  <span style={{ color: '#64748b', fontSize: '15px' }}> / tháng</span>
                </div>
                
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#334155', fontSize: '14px' }}>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> Tự động đổi link nhận hoa hồng: Khách gửi link Shopee, Lazada... bot tự đổi thành link của sếp ngay lập tức.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#334155', fontSize: '14px' }}>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> Tự nhận biết người gửi: Ghi nhận chính xác ai gửi link để sếp tính doanh số cho họ.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#334155', fontSize: '14px' }}>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> Hoạt động liên tục 24/7: Tự trả lời tin nhắn trong nhóm chat bất kể ngày đêm, sếp không cần trực máy.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#334155', fontSize: '14px' }}>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> Tin nhắn phản hồi lịch sự: Mẫu tin nhắn ngắn gọn, rõ ràng, kích thích người mua bấm link.
                  </li>
                </ul>
              </div>
              
              <a 
                href="http://zaloapp.com/qr/p/fd2gcjcjfuof"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-glow-active" 
                onClick={() => {
                  showToast("Đang kết nối tới Zalo Phạm Thắng...", 'info');
                }}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '15px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', boxSizing: 'border-box' }}
              >
                Mua Ngay
              </a>
            </div>

            {/* Gói Pro - Phổ biến nhất */}
            <div className="pricing-card" style={{
              background: '#ffffff',
              border: '2px solid #f97316',
              borderRadius: '24px',
              padding: '40px 32px',
              width: '100%',
              maxWidth: '360px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 20px 40px -15px rgba(249, 115, 22, 0.15)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.3s ease',
              transform: windowWidth >= 768 ? 'scale(1.03)' : 'none',
              zIndex: 2
            }}>
              <div style={{
                position: 'absolute',
                top: '0',
                right: '0',
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                color: '#ffffff',
                padding: '6px 20px',
                borderBottomLeftRadius: '16px',
                fontSize: '11px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Phổ Biến Nhất
              </div>
              <div>
                <h3 style={{ fontSize: '22px', color: '#0f172a', marginBottom: '8px', fontWeight: '700', marginTop: '10px' }}>Zalo Bot Affiliate Pro</h3>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>Có trang quản trị riêng cho sếp và trang tự tra cứu cho khách</p>
                
                <div style={{ marginBottom: '32px' }}>
                  <span style={{ fontSize: '42px', fontWeight: '800', color: '#0f172a', fontFamily: 'var(--font-heading)' }}>299.000đ</span>
                  <span style={{ color: '#64748b', fontSize: '15px' }}> / tháng</span>
                </div>
                
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#334155', fontSize: '14px' }}>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> Tự động đổi link mua sắm Shopee, Lazada, TikTok Shop mượt mà.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#334155', fontSize: '14px' }}>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> Trang quản trị doanh thu riêng: Theo dõi toàn bộ đơn hàng và quản lý cực kỳ nhàn hạ.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#334155', fontSize: '14px' }}>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> Khách tự tra cứu trên Web: Thành viên có thể tự vào xem đơn và hoa hồng mình tích lũy.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#334155', fontSize: '14px' }}>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> Chạy cùng lúc nhiều nhóm: Bot hoạt động trên nhiều nhóm chat và gom số liệu về một nơi.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#334155', fontSize: '14px' }}>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> Báo cáo hoa hồng chính xác: Tự tính tiền chuẩn sau thuế và lọc bỏ các đơn trùng lặp.
                  </li>
                </ul>
              </div>
              
              <a 
                href="http://zaloapp.com/qr/p/fd2gcjcjfuof"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-glow-active" 
                onClick={() => {
                  showToast("Đang kết nối tới Zalo Phạm Thắng...", 'info');
                }}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '15px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', boxSizing: 'border-box' }}
              >
                Mua Ngay
              </a>
            </div>

            {/* Gói Pro Max */}
            <div className="pricing-card" style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '24px',
              padding: '40px 32px',
              width: '100%',
              maxWidth: '360px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.05)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.3s ease'
            }}>
              <div>
                <h3 style={{ fontSize: '22px', color: '#0f172a', marginBottom: '8px', fontWeight: '700' }}>Zalo Bot Affiliate Pro Max</h3>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>Hệ thống ví tiền tự động và rút tiền qua tin nhắn chat</p>
                
                <div style={{ marginBottom: '32px' }}>
                  <span style={{ fontSize: '42px', fontWeight: '800', color: '#0f172a', fontFamily: 'var(--font-heading)' }}>399.000đ</span>
                  <span style={{ color: '#64748b', fontSize: '15px' }}> / tháng</span>
                </div>
                
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#334155', fontSize: '14px' }}>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> Đầy đủ toàn bộ tính năng cao cấp của bản Pro.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#334155', fontSize: '14px' }}>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> Ví tích lũy tiền tự động: Tự động cộng dồn tiền hoa hồng sau khi đơn hàng thành công.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#334155', fontSize: '14px' }}>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> Rút tiền nhanh bằng tin nhắn: Khách tự gõ lệnh `/rut-tien` trong nhóm để yêu cầu thanh toán.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#334155', fontSize: '14px' }}>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> Đường truyền riêng siêu tốc: Chạy trên máy chủ VPS riêng, phản hồi ngay lập tức không trễ lag.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#334155', fontSize: '14px' }}>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> Hỗ trợ kỹ thuật ưu tiên 24/7: Xử lý nhanh chóng mọi yêu cầu và sự cố phát sinh.
                  </li>
                </ul>
              </div>
              
              <a 
                href="http://zaloapp.com/qr/p/fd2gcjcjfuof"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-glow-active" 
                onClick={() => {
                  showToast("Đang kết nối tới Zalo Phạm Thắng...", 'info');
                }}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '15px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', boxSizing: 'border-box' }}
              >
                Mua Ngay
              </a>
            </div>

          </div>
        </section>

        {/* QR Banner Section trên Trang Chủ */}
        {showBanner && (
          <section className="landing-block-container community-container reveal-on-scroll" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            margin: '24px auto',
            position: 'relative',
            zIndex: 2,
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '18px', color: '#0f172a', marginBottom: '16px', fontWeight: '800', textAlign: 'center', padding: '0 16px', lineHeight: '1.4' }}>
              🌟 Quét QR Tham Gia Nhóm Zalo Nhận Hoàn Tiền Ngay
            </h3>
            <div style={{
              position: 'relative',
              width: '280px',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 12px 40px rgba(0,0,0,0.1), 0 0 30px rgba(249, 115, 22, 0.2)',
              border: '2px solid #fed7aa',
              transition: 'transform 0.3s ease'
            }}>
              <button
                onClick={(e) => { e.stopPropagation(); setShowBanner(false); }}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '26px',
                  height: '26px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 5
                }}
              >
                ×
              </button>
              <img src="/banner.jpg" alt="Tham gia Zalo Group nhận hoa hồng" style={{ width: '100%', display: 'block' }} />
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="landing-footer">
          <div className="footer-container">
            <div className="footer-info">
              <div className="footer-logo">
                <img src="/logo.jpg" alt="Logo" />
                <span>28Symues Affiliate</span>
              </div>
              <p className="footer-slogan">
                Hệ thống Zalo Bot chuyên nghiệp hỗ trợ tăng doanh số affiliate tự động 24/7 trên Shopee, Lazada và TikTok Shop.
              </p>
            </div>
            
            <div className="footer-links">
              <h4>Liên Kết Nhanh</h4>
              <ul>
                <li><a href="#features">Tính Năng</a></li>
                <li><a href="#steps">Cách Hoạt Động</a></li>
                <li><a href="#pricing">Bảng Giá</a></li>
                <li><a href="http://zaloapp.com/qr/p/fd2gcjcjfuof" target="_blank" rel="noopener noreferrer">Hỗ Trợ Kỹ Thuật</a></li>
              </ul>
            </div>
            
            <div className="footer-contact">
              <h4>Liên Hệ Đăng Ký</h4>
              <div className="footer-contact-list">
                <div className="footer-contact-item">
                  <span style={{ color: '#f97316' }}>💬</span>
                  <span>Zalo Admin: <a href="http://zaloapp.com/qr/p/fd2gcjcjfuof" target="_blank" rel="noopener noreferrer">Phạm Thắng</a></span>
                </div>
                <div className="footer-contact-item">
                  <span style={{ color: '#f97316' }}>🌐</span>
                  <span>Cộng đồng hỗ trợ & hướng dẫn kiếm tiền</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>© 2026 28Symues Affiliate. All rights reserved.</p>
            <div className="footer-bottom-links">
              <a href="#privacy">Chính Sách Bảo Mật</a>
              <a href="#terms">Điều Khoản Sử Dụng</a>
            </div>
          </div>
        </footer>
        {renderMobileBottomNav()}
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Custom Toast Notification Top-Right in Admin Panel */}
      {toastElement}

      {/* Mobile sidebar overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}
      {/* Sidebar Navigation */}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src="/logo.jpg" alt="Logo" style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #fed7aa' }} />
            <span>28Symues Admin</span>
          </div>
        </div>
        <ul className="sidebar-menu">
          <li 
            className="menu-item"
            onClick={() => { setView('home'); sessionStorage.removeItem('adminView'); setSidebarOpen(false); }}
            style={{ 
              background: '#fff7ed', 
              color: '#ea580c', 
              fontWeight: '600', 
              borderLeft: '3px solid #f97316', 
              marginBottom: '4px',
              fontSize: '14px'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}><path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z"/><path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a.465.465 0 0 0 .091-.086L12 5.43Z"/></svg>
            Về Trang Chủ
          </li>
          <li 
            className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setActiveTab('dashboard'); sessionStorage.setItem('adminTab','dashboard'); sessionStorage.setItem('adminView','admin'); setSidebarOpen(false); }}
          >
            {/* icon: arrow-up-right-dots / chart trending */}
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
              <polyline points="16 7 22 7 22 13"/>
            </svg>
            Tổng quan
          </li>
          <li 
            className={`menu-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => { setActiveTab('users'); sessionStorage.setItem('adminTab','users'); sessionStorage.setItem('adminView','admin'); setSidebarOpen(false); }}
          >
            {/* icon: user */}
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Thành viên
          </li>
          <li 
            className={`menu-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => { setActiveTab('orders'); sessionStorage.setItem('adminTab','orders'); sessionStorage.setItem('adminView','admin'); setSidebarOpen(false); }}
          >
            {/* icon: cart-arrow-down */}
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              <polyline points="14 10 12 14 10 10"/>
            </svg>
            Đơn hàng
          </li>
          <li 
            className={`menu-item ${activeTab === 'payouts' ? 'active' : ''}`}
            onClick={() => { setActiveTab('payouts'); sessionStorage.setItem('adminTab','payouts'); sessionStorage.setItem('adminView','admin'); setSidebarOpen(false); }}
            style={{ display: 'flex', alignItems: 'center' }}
          >
            {/* icon: credit-card */}
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            <span style={{ flex: 1 }}>Rút tiền</span>
            {stats.pendingPayoutsCount > 0 && (
              <span style={{
                background: '#ef4444',
                color: '#fff',
                fontSize: '10px',
                padding: '2px 7px',
                borderRadius: '20px',
                fontWeight: 'bold',
                lineHeight: '1.4'
              }}>{stats.pendingPayoutsCount}</span>
            )}
          </li>
        </ul>

        {/* Sidebar Footer */}
        <div className="sidebar-footer" style={{ padding: '12px 16px 16px', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', padding: '10px 12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            {user?.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt="Avatar" 
                referrerPolicy="no-referrer"
                style={{ width: '34px', height: '34px', borderRadius: '50%', border: '2px solid #fed7aa', flexShrink: 0 }} 
              />
            ) : (
              <div className="avatar" style={{ margin: 0, width: '34px', height: '34px', fontSize: '12px', flexShrink: 0 }}>{(user?.fullName || 'PT').substring(0, 2).toUpperCase()}</div>
            )}
            <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.fullName}</div>
              <div style={{ fontSize: '10px', color: '#ea580c', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{user?.role}</div>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            style={{ 
              width: '100%', 
              fontSize: '13px', 
              padding: '10px', 
              background: '#fff7ed', 
              color: '#ea580c', 
              border: '1px solid #fed7aa', 
              borderRadius: '8px', 
              cursor: 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              transition: 'all 0.2s',
              letterSpacing: '0.2px'
            }}
            onMouseEnter={e => { e.currentTarget.style.background='#ffedd5'; e.currentTarget.style.borderColor='#fdba74'; }}
            onMouseLeave={e => { e.currentTarget.style.background='#fff7ed'; e.currentTarget.style.borderColor='#fed7aa'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="main-content">
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
            <ThemeToggle style={{ marginRight: '8px' }} />
            <span className="admin-name">{user?.fullName || 'Admin'}</span>
            {user?.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt="Avatar" 
                referrerPolicy="no-referrer"
                style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #cbd5e1' }} 
              />
            ) : (
              <div className="avatar">{(user?.fullName || 'PT').substring(0, 2).toUpperCase()}</div>
            )}
            <button 
              className="btn btn-refresh" 
              onClick={(e) => {
                const svg = e.currentTarget.querySelector('svg');
                if (svg) {
                  svg.style.transform = 'rotate(360deg)';
                  svg.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                  setTimeout(() => {
                    svg.style.transform = 'none';
                    svg.style.transition = 'none';
                  }, 600);
                }
                fetchData(token, user);
              }} 
              style={{ 
                marginLeft: '12px', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '8px 16px',
                background: '#fff7ed',
                color: '#ea580c',
                border: '1px solid #fed7aa',
                fontWeight: '600',
                fontSize: '13.5px',
                borderRadius: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.5s ease' }}>
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l.73-.73"/>
              </svg>
              Làm mới
            </button>
          </div>
        </header>

        <section className="content-body">
          {error && (
            <div style={{
              background: 'rgba(248, 113, 113, 0.1)',
              border: '1px solid var(--color-danger)',
              color: 'var(--color-danger)',
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '24px',
              fontWeight: '500'
            }}>
              ⚠️ Lỗi: {error}. Vui lòng kiểm tra backend server đang chạy ở cổng 8080!
            </div>
          )}

          {loading ? (
            <div className="spinner-container">
              <div className="spinner"></div>
            </div>
          ) : (
            <>
              {/* Tab 1: DASHBOARD STATS */}
              {activeTab === 'dashboard' && (
                <div>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      </div>
                      <span className="stat-label">Tổng thành viên</span>
                      <span className="stat-val">{stats.totalMembers}</span>
                    </div>
                    <div className="stat-card success">
                      <div className="stat-icon success">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                      </div>
                      <span className="stat-label">Tổng đơn hàng</span>
                      <span className="stat-val">{stats.totalOrders}</span>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon info">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                      </div>
                      <span className="stat-label">Doanh thu hoa hồng</span>
                      <span className="stat-val">{formatMoney(stats.totalCommission)}</span>
                    </div>
                    <div className="stat-card warning">
                      <div className="stat-icon warning">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      </div>
                      <span className="stat-label">Chờ duyệt rút tiền</span>
                      <span className="stat-val" style={{ color: stats.pendingPayoutsCount > 0 ? '#ea580c' : 'inherit' }}>
                        {stats.pendingPayoutsCount}
                      </span>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                      </div>
                      <span className="stat-label">Đã thanh toán (Thực tế)</span>
                      <span className="stat-val">{formatMoney(stats.totalWithdrawn)}</span>
                    </div>
                  </div>

                  {/* Quick table of recent pending payouts */}
                  <div className="data-card">
                    <div className="card-header">
                      <h2 className="card-title">
                        <i className="fa-solid fa-money-check-dollar" style={{ color: '#f97316', marginRight: '8px' }}></i> Yêu Cầu Rút Tiền Chờ Duyệt Gần Đây
                      </h2>
                    </div>
                    <div className="table-container">
                      <table>
                        <thead>
                          <tr>
                            <th>Mã GD</th>
                            <th>Thành viên</th>
                            <th>Ngân hàng</th>
                            <th>Số tài khoản</th>
                            <th>Số tiền</th>
                            <th>Thời gian gửi</th>
                            <th>Hành động</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payouts.filter(p => p.status === 'PENDING').length === 0 ? (
                            <tr className="empty-row">
                              <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                                  <i className="fa-solid fa-money-check-dollar" style={{ fontSize: '1.2em', color: '#f97316' }}></i> Không có yêu cầu rút tiền nào đang chờ duyệt!
                                </span>
                              </td>
                            </tr>
                          ) : (
                            payouts.filter(p => p.status === 'PENDING').slice(0, 5).map(p => {
                              const user = users.find(u => u.zaloId === p.zaloId);
                              const bankAndAcc = getBankAndAccount(p);
                              return (
                                <tr key={p.id}>
                                  <td data-label="Mã GD"><strong>PT_{p.id}</strong></td>
                                  <td data-label="Thành viên">{user ? user.zaloName : p.zaloId}</td>
                                  <td data-label="Ngân hàng">{bankAndAcc.bankName || 'Chưa cấu hình'}</td>
                                  <td data-label="Số tài khoản"><code>{bankAndAcc.accountNumber || 'Chưa cấu hình'}</code></td>
                                  <td data-label="Số tiền" style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>{formatMoney(p.amount)}</td>
                                  <td data-label="Thời gian gửi">{formatDateTime(p.createdAt)}</td>
                                  <td data-label="Hành động">
                                    <button 
                                      className="btn btn-success"
                                      onClick={() => handleApprovePayout(p.id)}
                                    >
                                      ✓ Phê duyệt
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: MEMBERS MANAGEMENT */}
              {activeTab === 'users' && (
                <div className="data-card">
                  <div className="search-container">
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Tìm kiếm thành viên (Tên/Zalo ID)..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                    />
                  </div>
                  <div className="table-container">
                    <table style={{ tableLayout: 'fixed', width: '100%' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '130px' }}>Tên thành viên</th>
                          <th style={{ width: '110px' }}>Zalo ID</th>
                          <th style={{ width: '150px' }}>Tài khoản nhận tiền</th>
                          <th style={{ width: '95px', textAlign: 'right' }} title="Đơn đang chờ Shopee đối soát">Chờ xử lý</th>
                          <th style={{ width: '150px', textAlign: 'right' }}>Tích lũy hoàn thành</th>
                          <th style={{ width: '105px', textAlign: 'right' }} title="Số tiền có thể rút ngay (đơn hoàn thành quá 3 ngày, trừ đã rút)">Khả dụng rút</th>
                          <th style={{ width: '90px', textAlign: 'right' }}>Đã rút</th>
                          <th style={{ width: '70px', textAlign: 'center' }}>Chi tiết</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.length === 0 ? (
                          <tr className="empty-row">
                            <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                              Không tìm thấy thành viên phù hợp
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map(u => {
                            const bankAndAcc = getBankAndAccount(u);
                            return (
                              <tr key={u.zaloId}>
                                <td data-label="Tên thành viên" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  <strong title={u.zaloName}>{u.zaloName || 'Vô danh (Chờ đồng bộ)'}</strong>
                                </td>
                                <td data-label="Zalo ID" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  <code style={{ color: 'var(--text-muted)', fontSize: '11.5px' }} title={u.zaloId}>{u.zaloId}</code>
                                </td>
                                <td data-label="Tài khoản nhận tiền">
                                  <div style={{ fontSize: '13px', fontWeight: '500' }}>{bankAndAcc.bankName || '⚠️ Chưa cập nhật'}</div>
                                  {bankAndAcc.accountNumber && <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}><code>{bankAndAcc.accountNumber}</code></div>}
                                </td>
                                <td data-label="Chờ xử lý" style={{ color: 'var(--color-warning)', textAlign: 'right', fontWeight: '500' }}>
                                  {formatMoney(u.wallet?.pendingCommission)}
                                </td>
                                <td data-label="Tích lũy hoàn thành" style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Gốc: {formatMoney(u.wallet?.completedCommission)}</div>
                                  <div style={{ fontSize: '11.5px', color: 'var(--color-warning)', marginTop: '2px' }}>Sau thuế: {formatMoney((u.wallet?.completedCommission || 0) * 0.9)}</div>
                                  <div style={{ fontSize: '11.5px', color: 'var(--color-success)', marginTop: '2px', fontWeight: '600' }}>Khách: {formatMoney((u.wallet?.completedCommission || 0) * 0.9 * 0.8)}</div>
                                </td>
                                <td data-label="Khả dụng rút" style={{ color: 'var(--color-success)', fontWeight: '700', textAlign: 'right' }}>
                                  {formatMoney(u.wallet?.withdrawableCommission)}
                                </td>
                                <td data-label="Đã rút" style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                                  {formatMoney(u.wallet?.receivedCommission)}
                                </td>
                                <td data-label="Chi tiết" style={{ textAlign: 'center' }}>
                                  <button
                                    className="btn"
                                    onClick={() => setSelectedUser(u)}
                                    style={{ padding: '4px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  >
                                    <i className="fa-regular fa-eye"></i> Xem
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 3: ORDERS LIST */}
              {activeTab === 'orders' && <OrdersTab />}


              {/* Tab 4: PAYOUTS LIST */}
              {activeTab === 'payouts' && (
                <div className="data-card">
                  <div className="search-container">
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Tìm kiếm lệnh rút (Tên/Zalo ID/Mã GD)..."
                      value={payoutSearch}
                      onChange={(e) => setPayoutSearch(e.target.value)}
                    />
                  </div>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Mã giao dịch</th>
                          <th>Thành viên</th>
                          <th>Ngân hàng</th>
                          <th>Số tài khoản</th>
                          <th>Số tiền yêu cầu</th>
                          <th>Ngày yêu cầu</th>
                          <th>Ngày phê duyệt</th>
                          <th>Trạng thái</th>
                          <th>Duyệt nhanh</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPayouts.length === 0 ? (
                          <tr className="empty-row">
                            <td colSpan="9" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                              Không tìm thấy yêu cầu rút tiền nào
                            </td>
                          </tr>
                        ) : (
                          filteredPayouts.map(p => {
                            const user = users.find(u => u.zaloId === p.zaloId);
                            const bankAndAcc = getBankAndAccount(p);
                            return (
                              <tr key={p.id}>
                                <td data-label="Mã GD"><strong>PT_{p.id}</strong></td>
                                <td data-label="Thành viên">{user ? user.zaloName : p.zaloId}</td>
                                <td data-label="Ngân hàng">{bankAndAcc.bankName || 'Chưa cấu hình'}</td>
                                <td data-label="Số tài khoản" style={{ fontSize: '13px' }}><code>{bankAndAcc.accountNumber || 'Chưa cấu hình'}</code></td>
                                <td data-label="Số tiền" style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>{formatMoney(p.amount)}</td>
                                <td data-label="Ngày gửi">{formatDateTime(p.createdAt)}</td>
                                <td data-label="Phê duyệt">{formatDateTime(p.completedAt)}</td>
                                <td data-label="Trạng thái">
                                  <span className={`badge ${
                                    p.status === 'COMPLETED' ? 'badge-completed' : 'badge-pending'
                                  }`}>
                                    {p.status === 'COMPLETED' ? 'Đã thanh toán' : 'Chờ duyệt'}
                                  </span>
                                </td>
                                <td data-label="Thao tác">
                                  {p.status === 'PENDING' ? (
                                    <button 
                                      className="btn btn-success"
                                      onClick={() => handleApprovePayout(p.id)}
                                    >
                                      ✓ Duyệt
                                    </button>
                                  ) : (
                                    <span style={{ color: 'var(--color-success)', fontSize: '18px' }}>✓</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-content user-detail-modal" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header" style={{ marginBottom: '20px' }}>
              <h2 className="modal-title" style={{ fontSize: '24px' }}>👤 Chi Tiết Thành Viên</h2>
              <button className="modal-close" onClick={() => setSelectedUser(null)} style={{ fontSize: '28px' }}>&times;</button>
            </header>
            <div className="modal-body">
              <div className="member-detail-grid">
                <div className="detail-item" style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="detail-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', color: 'var(--text-muted)' }}>Tên thành viên</div>
                  <div className="detail-value" style={{ color: 'var(--color-primary)', fontSize: '22px', fontWeight: '700' }}>{selectedUser.zaloName || 'Vô danh'}</div>
                </div>
                <div className="detail-item" style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="detail-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', color: 'var(--text-muted)' }}>Zalo ID</div>
                  <div className="detail-value" style={{ fontSize: '16px', wordBreak: 'break-all', fontFamily: 'monospace', color: '#fff' }}>{selectedUser.zaloId}</div>
                </div>
                <div className="detail-item" style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="detail-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', color: 'var(--text-muted)' }}>Ngân hàng nhận tiền</div>
                  <div className="detail-value" style={{ fontSize: '20px', fontWeight: '600', color: '#fff' }}>{getBankAndAccount(selectedUser).bankName || '⚠️ Chưa cập nhật'}</div>
                </div>
                <div className="detail-item" style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="detail-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', color: 'var(--text-muted)' }}>Số tài khoản</div>
                  <div className="detail-value"><code style={{ fontSize: '20px', letterSpacing: '2px', fontWeight: '700', color: 'var(--color-success)' }}>{getBankAndAccount(selectedUser).accountNumber || '⚠️ Chưa cập nhật'}</code></div>
                </div>
              </div>

              {/* Mini user wallet stats */}
              <div className="stats-grid modal-stats-grid">
                <div className="stat-card" style={{ padding: '16px' }}>
                  <span className="stat-label">Chờ xử lý</span>
                  <span className="stat-val" style={{ fontSize: '22px' }}>{formatMoney(selectedUser.wallet?.pendingCommission)}</span>
                </div>
                <div className="stat-card success" style={{ padding: '16px' }}>
                  <span className="stat-label">Đã hoàn thành</span>
                  <span className="stat-val" style={{ fontSize: '22px' }}>{formatMoney(selectedUser.wallet?.completedCommission)}</span>
                </div>
                <div className="stat-card warning" style={{ padding: '16px' }}>
                  <span className="stat-label">Sau thuế</span>
                  <span className="stat-val" style={{ fontSize: '22px', color: 'var(--color-warning)' }}>{formatMoney((selectedUser.wallet?.completedCommission || 0) * 0.9)}</span>
                </div>
                <div className="stat-card success" style={{ padding: '16px' }}>
                  <span className="stat-label">Thực nhận</span>
                  <span className="stat-val" style={{ fontSize: '22px', color: 'var(--color-success)' }}>{formatMoney((selectedUser.wallet?.completedCommission || 0) * 0.9 * 0.8)}</span>
                </div>
                <div className="stat-card warning" style={{ padding: '16px' }}>
                  <span className="stat-label">Có thể rút</span>
                  <span className="stat-val" style={{ fontSize: '22px', color: 'var(--color-success)' }}>{formatMoney(selectedUser.wallet?.withdrawableCommission)}</span>
                </div>
                <div className="stat-card" style={{ padding: '16px' }}>
                  <span className="stat-label">Đã rút</span>
                  <span className="stat-val" style={{ fontSize: '22px' }}>{formatMoney(selectedUser.wallet?.receivedCommission)}</span>
                </div>
              </div>

              {/* List of recent orders for this user */}
              <h3 style={{ marginBottom: '12px', fontSize: '16px' }}>🛒 Đơn hàng gần đây</h3>
              <div className="table-container" style={{ maxHeight: '240px', overflowY: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Sản phẩm</th>
                      <th>HH Gốc</th>
                      <th title="Sau thuế 10%">Sau thuế</th>
                      <th title="Sau thuế & trừ 20%">Thực nhận</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.filter(o => o.zaloId === selectedUser.zaloId).length === 0 ? (
                      <tr className="empty-row">
                        <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có đơn hàng nào.</td>
                      </tr>
                    ) : (
                      orders.filter(o => o.zaloId === selectedUser.zaloId).slice(0, 10).map(o => {
                        const afterTax = (o.commission || 0) * 0.9;
                        const afterDeduction = afterTax * 0.8;
                        return (
                          <tr key={o.id}>
                            <td data-label="Mã đơn" style={{ fontSize: '11px' }}>{o.orderId}</td>
                            <td data-label="Sản phẩm" style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.productName}</td>
                            <td data-label="HH Gốc" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{formatMoney(o.commission)}</td>
                            <td data-label="Sau thuế" style={{ color: 'var(--color-warning)', fontSize: '12px' }}>{formatMoney(afterTax)}</td>
                            <td data-label="Thực nhận" style={{ color: 'var(--color-success)', fontWeight: '700', fontSize: '12px' }}>{formatMoney(afterDeduction)}</td>
                            <td data-label="Trạng thái">
                              <span className={`badge ${
                                o.status === 'Hoàn thành' ? 'badge-completed' :
                                o.status === 'Hủy' ? 'badge-cancelled' : 'badge-pending'
                              }`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                                {o.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <footer className="modal-footer">
              <button className="btn" onClick={() => setSelectedUser(null)}>Đóng lại</button>
            </footer>
          </div>
        </div>
      )}
      {renderMobileBottomNav()}
    </div>
  );
}

export default App;
