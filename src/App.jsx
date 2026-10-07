import { useEffect, useState } from 'react';
import { useApp } from './context/AppContext';
import ThemeToggle from './components/common/ThemeToggle';
import RunningCatMascot from './components/common/RunningCatMascot';
import OrdersTab from './components/dashboard/OrdersTab';
import UsersTab from './components/dashboard/UsersTab';
import PayoutsTab from './components/dashboard/PayoutsTab';
import OrderLookupView from './components/views/OrderLookupView';
import FloatingZaloContact from './components/common/FloatingZaloContact';
import { ProductLandingView } from './components/ProductLandingView';
import CopyButton from './components/common/CopyButton';

const API_URL_ROOT = import.meta.env.PROD ? "" : (import.meta.env.VITE_API_URL || 'http://localhost:8080');

const API_BASE = `${API_URL_ROOT}/api/admin`;

function App() {
  const { view, setView } = useApp();
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

  // Public Lookup States
  const [lookupSearchType, setLookupSearchType] = useState('ORDER_ID');
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupStartDate, setLookupStartDate] = useState('');
  const [lookupEndDate, setLookupEndDate] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/s/')) {
      const code = path.split('/s/')[1]?.split('?')[0]?.trim();
      if (code) {
        fetch(`${API_URL_ROOT}/api/public/short-link/${code}`)
          .then(res => res.json())
          .then(resData => {
            if (resData && resData.data) {
              window.location.replace(resData.data);
            } else {
              window.location.replace('https://28symues.store/lookup');
            }
          })
          .catch(() => {
            window.location.replace('https://28symues.store/lookup');
          });
      }
    }
  }, []);

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
        threshold: 0.1,
        rootMargin: '0px 0px -30px 0px'
      };

      const observer = new IntersectionObserver(observerCallback, observerOptions);
      const elements = document.querySelectorAll('.reveal-on-scroll, .scroll-reveal, .zigzag-row, .zalo-pc-live-card, .pricing-card');
      elements.forEach(el => observer.observe(el));

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

        <a 
          href="https://zalo.me/g/0p083nqqoordpki9zgvy" 
          target="_blank" 
          rel="noreferrer"
          className="mobile-bottom-nav-item"
          title="Nhắn tin với Bot Zalo hoàn tiền"
        >
          <div className="nav-icon-wrap">
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
  const formatDateTime = (val) => {
    if (!val) return '-';
    try {
      if (Array.isArray(val)) {
        const [year, month, day, hour = 0, minute = 0] = val;
        const dStr = String(day).padStart(2, '0');
        const mStr = String(month).padStart(2, '0');
        const hStr = String(hour).padStart(2, '0');
        const minStr = String(minute).padStart(2, '0');
        return `${dStr}/${mStr} ${hStr}:${minStr}`;
      }
      const strVal = String(val).trim();
      if (strVal.includes(',')) {
        const parts = strVal.split(',').map(n => parseInt(n.trim(), 10));
        if (parts.length >= 3 && !parts.some(isNaN)) {
          const [year, month, day, hour = 0, minute = 0] = parts;
          const dStr = String(day).padStart(2, '0');
          const mStr = String(month).padStart(2, '0');
          const hStr = String(hour).padStart(2, '0');
          const minStr = String(minute).padStart(2, '0');
          return `${dStr}/${mStr} ${hStr}:${minStr}`;
        }
      }
      if (/^\d{10,14}$/.test(strVal) && strVal.startsWith('2026')) {
        const year = strVal.substring(0, 4);
        const rest = strVal.substring(4);
        if (rest.startsWith('8')) {
          const month = '08';
          const dayRest = rest.substring(1);
          if (dayRest.length >= 6) {
            const day = dayRest.length === 7 ? dayRest.substring(0, 2) : '0' + dayRest.substring(0, 1);
            const timeRest = dayRest.length === 7 ? dayRest.substring(2) : dayRest.substring(1);
            const hour = timeRest.length >= 4 ? timeRest.substring(0, 2) : '0' + timeRest.substring(0, 1);
            const minRest = timeRest.length >= 4 ? timeRest.substring(2) : timeRest.substring(1);
            const min = minRest.substring(0, 2);
            return `${day}/${month} ${hour}:${min}`;
          }
        }
      }
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${day}/${month} ${hours}:${minutes}`;
      }
      return strVal.replace('T', ' ').substring(0, 16);
    } catch (e) {
      return String(val);
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

  const [productCode, setProductCode] = useState(() => {
    try {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      if (path.includes('/p/')) {
        return path.split('/p/')[1]?.split('?')[0]?.trim();
      }
      return params.get('p') || params.get('code') || '';
    } catch (e) {
      return '';
    }
  });

  useEffect(() => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const pCode = path.includes('/p/') ? path.split('/p/')[1]?.split('?')[0]?.split('#')[0]?.split('/')[0]?.trim() : (params.get('p') || params.get('code'));
    if (pCode) {
      setProductCode(pCode);
    }
  }, []);

  if (productCode || view === 'product_landing') {
    return <ProductLandingView code={productCode} apiRoot={API_URL_ROOT} />;
  }

  if (view === 'lookup') {
    return (
      <>
        <OrderLookupView setView={setView} />
        <FloatingZaloContact />
      </>
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
            min-height: 80px;
            height: auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 40px;
            z-index: 10;
            width: 100%;
            box-sizing: border-box;
          }
          .login-split-logo {
            display: flex;
            align-items: center;
            gap: 12px;
            cursor: pointer;
          }
          .login-split-logo img {
            width: auto;
            height: 90px;
            max-width: 420px;
            max-height: 100px;
            border-radius: 0;
            object-fit: contain;
            border: none;
          }
          .login-split-logo span,
          .login-logo-text {
            display: none !important;
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
              height: 100vh;
              height: 100dvh;
              min-height: 100vh;
              min-height: 100dvh;
              overflow-y: auto;
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
            }
            .login-split-header {
              padding: 10px 14px !important;
              height: auto !important;
              display: flex !important;
              flex-wrap: nowrap !important;
              align-items: center !important;
              justify-content: space-between !important;
              gap: 6px !important;
              flex-shrink: 0 !important;
            }
            .login-split-logo {
              gap: 6px !important;
              flex-shrink: 0 !important;
              min-width: 0 !important;
            }
            .login-split-logo img {
              width: auto !important;
              height: 85px !important;
              max-width: 320px !important;
              max-height: 95px !important;
              flex-shrink: 0 !important;
              border-radius: 0 !important;
              border: none !important;
              object-fit: contain !important;
            }
            .login-logo-text {
              display: none !important;
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
              padding: 8px 16px 16px !important;
              gap: 0 !important;
              justify-content: center !important;
              align-items: center !important;
              flex: 1;
              box-sizing: border-box;
            }
            .login-split-left {
              display: none !important;
            }
            .login-split-right {
              justify-content: center;
              width: 100%;
              max-width: 420px;
            }
            .login-split-card {
              padding: 20px 18px !important;
              width: 100%;
              max-width: 100%;
              box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important;
              border-radius: 20px !important;
            }
            .login-split-card h2 {
              font-size: 22px !important;
              margin-bottom: 4px !important;
            }
            .login-split-card .subtitle {
              font-size: 12.5px !important;
              margin-bottom: 12px !important;
            }
            .login-split-card .form-group {
              margin-bottom: 10px !important;
            }
            .login-split-card .form-label {
              font-size: 12px !important;
              margin-bottom: 4px !important;
            }
            .login-split-card .form-input {
              padding: 10px 14px !important;
              font-size: 14px !important;
              border-radius: 10px !important;
            }
            .login-split-card .terms-checkbox-wrapper {
              margin: 8px 0 6px !important;
              font-size: 12px !important;
            }
            .login-split-card .cf-turnstile-sim {
              margin: 8px 0 12px !important;
              min-height: 48px !important;
              padding: 8px 12px !important;
            }
            .login-split-card .modal-login-btn {
              padding: 11px 16px !important;
              font-size: 15px !important;
              border-radius: 12px !important;
            }
            .login-split-card .modal-divider {
              margin: 10px 0 !important;
              font-size: 12px !important;
            }
            .login-split-card .modal-google-container {
              margin: 0 auto 8px auto !important;
              min-height: 40px !important;
            }
            .login-split-card .btn-google-custom {
              height: 40px !important;
              font-size: 14px !important;
              border-radius: 10px !important;
            }
            .login-split-card .login-split-footer {
              margin-top: 10px !important;
              font-size: 12px !important;
            }
          }
          @media (max-width: 480px) {
            .login-split-header {
              padding: 8px 10px !important;
              min-height: 80px !important;
              height: auto !important;
            }
            .login-split-logo {
              flex-shrink: 0 !important;
            }
            .login-split-logo img {
              width: auto !important;
              height: 80px !important;
              max-width: 260px !important;
              max-height: 85px !important;
              flex-shrink: 0 !important;
              border-radius: 0 !important;
              border: none !important;
              object-fit: contain !important;
            }
            .login-logo-text {
              display: none !important;
            }
            .login-split-nav .btn-back {
              padding: 3px 7px !important;
              font-size: 11px !important;
              white-space: nowrap !important;
            }
            .login-split-content {
              padding: 4px 12px 12px !important;
            }
            .login-split-card {
              padding: 16px 14px !important;
            }
            .login-split-card h2 {
              font-size: 20px !important;
            }
          }
        `}} />

        {/* Header */}
        <header className="login-split-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 12px', flexWrap: 'nowrap', gap: '6px', boxSizing: 'border-box' }}>
          <div className="login-split-logo" onClick={() => { setView('home'); window.history.pushState({}, '', '/'); }} style={{ display: 'flex', alignItems: 'center', flexShrink: 0, minWidth: 0, cursor: 'pointer' }}>
            <img src="/28symueslogomanin.png?v=7" alt="28Symues Affiliate Logo" style={{ height: 'clamp(80px, 18vw, 110px)', width: 'auto', maxWidth: '380px', flexShrink: 0, objectFit: 'contain' }} />
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
            <h1>Đăng nhập tài khoản</h1>
            <p>Đăng nhập để theo dõi trạng thái đơn hàng Shopee & TikTok Shop, xem thống kê hoa hồng và duyệt rút tiền tự động hệ thống.</p>
            
            <div className="login-illustration-box">
              <img 
                src="/111.png" 
                alt="Minh họa Zalo Bot Affiliate" 
                className="login-illustration-img" 
              />
            </div>
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
          <div className="landing-logo" style={{ display: 'flex', alignItems: 'center', flexShrink: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src="/28symueslogomanin.png?v=7" alt="28Symues Affiliate Logo" style={{ height: 'clamp(84px, 18vw, 110px)', width: 'auto', maxWidth: '440px', flexShrink: 0, objectFit: 'contain' }} />
          </div>
          <nav className={`landing-nav${mobileMenuOpen ? ' open' : ''}`}>
            <a href="#home" onClick={() => setMobileMenuOpen(false)}>Trang chủ</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Tính năng</a>
            <a href="#steps" onClick={() => setMobileMenuOpen(false)}>Hướng dẫn</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Bảng giá</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setView('lookup'); window.history.pushState({}, '', '/?view=lookup'); setMobileMenuOpen(false); }} style={{ color: '#ea580c', fontWeight: '700' }}><i className="fa-thin fa-magnifying-glass" style={{ marginRight: '6px' }}></i>Tra cứu đơn hàng</a>
            {/* Mobile-only actions inside nav */}
            <div className="mobile-nav-actions">
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
          <div className="mobile-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <ThemeToggle className="mobile-header-theme-toggle" />
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
        {mobileMenuOpen && <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)}></div>}
        <section id="home" className="landing-block-container hero-showcase-container reveal-on-scroll" style={{ marginTop: '12px', marginBottom: '0px', paddingBottom: '0px', paddingTop: '10px', textAlign: 'center' }}>

          <h1 className="hero-title" style={{ fontSize: '38px', fontWeight: '900', color: 'var(--text-bright)', marginBottom: '14px', lineHeight: '1.2' }}>
            Cho Thuê Zalo Bot Affiliate - Tự Động Đổi Link Shopee, TikTok Shop & Lazada 24/7
          </h1>
          <p className="hero-subtitle" style={{ color: 'var(--text-muted)', fontSize: '16px', maxWidth: '780px', margin: '0 auto 16px', lineHeight: '1.6' }}>
            Biến mọi liên kết mua sắm trong nhóm chat Zalo của bạn thành nguồn thu nhập thụ động chỉ trong vài giây. Tiện lợi, tự động, ghi nhận sub_id chuẩn xác và hoàn toàn minh bạch.
          </p>
          <div className="hero-buttons" style={{ justifyContent: 'center', marginBottom: '0px' }}>
            <a href="#automation-features" className="btn btn-hero-1">Bắt đầu ngay</a>
            <button onClick={() => { setView('lookup'); window.history.pushState({}, '', '/?view=lookup'); }} className="btn btn-hero-2">
              <i className="fa-thin fa-magnifying-glass"></i> Tra cứu đơn hàng
            </button>
            <a href="#pricing" className="btn btn-hero-3">Xem bảng giá</a>
          </div>
        </section>
        <section id="automation-features" className="landing-block-container reveal-on-scroll" style={{ padding: '0px 20px 24px', marginTop: '0px', marginBottom: '16px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px', marginTop: '0px' }}>
            <h2 className="section-title" style={{ fontSize: '32px', fontWeight: '800', marginBottom: '12px' }}>Hệ Thống Tự Động Hóa Affiliate Toàn Diện</h2>
            <p className="section-subtitle" style={{ fontSize: '15px' }}>Giải pháp mượt mà, tối ưu nhất giúp sếp quản lý nhóm săn sale nhàn hạ 100%</p>
          </div>
          <div className="zigzag-row">
            <div className="zigzag-media">
              <div className="zigzag-img-card">
                <img src="/anh1.png" alt="Tự Động Đổi Link" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '24px' }} />
              </div>
            </div>
            <div className="zigzag-content">

              <h3 className="zigzag-title">Tự Động Đổi Link Shopee, TikTok Shop & Lazada</h3>
              <p className="zigzag-desc">
                Thành viên trong nhóm chat Zalo chỉ cần dán link mua sắm sản phẩm. Zalo Bot tự động nhận biết người gửi, chuyển đổi thành link affiliate có gắn SubID chuẩn xác và phản hồi lại ngay lập tức.
              </p>
              <a href="#zalo-demo" className="zigzag-btn">
                <span>Trải nghiệm ngay</span>
                <i className="fa-solid fa-arrow-right"></i>
              </a>
            </div>
          </div>
          {/* Dashed Curved Line 1: Connects Image 1 (left) to Image 2 (right) */}
          <svg className="zigzag-connector-svg" viewBox="0 0 1000 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M 220 2 C 220 50, 780 30, 780 78" stroke="#2dd4bf" strokeWidth="3" strokeDasharray="7 7" fill="none" opacity="0.85" />
            <circle cx="220" cy="2" r="5" fill="#2dd4bf" />
            <circle cx="780" cy="78" r="5" fill="#2dd4bf" />
          </svg>
          <div className="zigzag-row reverse">
            <div className="zigzag-media">
              <div className="zigzag-img-card" style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
                <img src="/anh2.png" alt="Trang Web Tra Cứu Đơn Hàng" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '24px', filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.08))' }} />
              </div>
            </div>
            <div className="zigzag-content">
              <span className="zigzag-category-badge">MINH BẠCH &amp; TIỆN LỢI</span>
              <h3 className="zigzag-title">Trang Web Tra Cứu Đơn Hàng & Hoa Hồng Tự Động</h3>
              <p className="zigzag-desc">
                Cung cấp trang Tra Cứu Web Portal riêng cho từng nhóm săn sale. Thành viên chủ động truy cập kiểm tra danh sách đơn hàng đã mua, số tiền hoa hồng được cộng dồn và trạng thái đơn minh bạch.
              </p>
              <button onClick={() => { setView('lookup'); window.history.pushState({}, '', '/?view=lookup'); }} className="zigzag-btn">
                <span>Xem demo tra cứu</span>
                <i className="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          </div>
          {/* Dashed Curved Line 2: Connects Image 2 (right) to Image 3 (left) */}
          <svg className="zigzag-connector-svg" viewBox="0 0 1000 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M 780 2 C 780 50, 220 30, 220 78" stroke="#2dd4bf" strokeWidth="3" strokeDasharray="7 7" fill="none" opacity="0.85" />
            <circle cx="780" cy="2" r="5" fill="#2dd4bf" />
            <circle cx="220" cy="78" r="5" fill="#2dd4bf" />
          </svg>
          <div className="zigzag-row">
            <div className="zigzag-media">
              <div className="zigzag-img-card" style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
                <img src="/anh3.png" alt="Ví Tích Lũy Hoa Hồng & Yêu Cầu Rút Tiền Siêu Tốc" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '24px', filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.08))' }} />
              </div>
            </div>
            <div className="zigzag-content">
              <span className="zigzag-category-badge">RÚT TIỀN TỰ ĐỘNG</span>
              <h3 className="zigzag-title">Ví Tích Lũy Hoa Hồng & Yêu Cầu Rút Tiền Siêu Tốc</h3>
              <p className="zigzag-desc">
                Tích hợp hệ thống ví điện tử nội bộ tự động cộng dồn hoa hồng khi đơn hoàn thành. Thành viên dễ dàng gửi yêu cầu rút tiền qua lệnh chat hoặc trang Web, Admin nhận thông báo và phê duyệt 1-click nhàn hạ.
              </p>
              <a href="#pricing" className="zigzag-btn">
                <span>Xem bảng giá dịch vụ</span>
                <i className="fa-solid fa-arrow-right"></i>
              </a>
            </div>
          </div>
        </section>
        <section id="zalo-demo" className="landing-block-container hero-section reveal-on-scroll">
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div className="section-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '8px 20px', borderRadius: '30px', background: 'rgba(249, 115, 22, 0.12)', color: '#ea580c', fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
              <i className="fa-regular fa-envelope" style={{ fontSize: '18px', flexShrink: 0 }}></i>
              <span>TRẢI NGHIỆM CHATBOT ZALO REALTIME</span>
            </div>
            <h2 className="section-title" style={{ fontSize: '30px', fontWeight: '800', marginBottom: '8px' }}>Tương Tác & Chuyển Đổi Link Tự Động</h2>
            <p className="section-subtitle" style={{ fontSize: '15px' }}>Giao diện đối soát đơn hàng và tự động phản hồi link hoa hồng trực tiếp trên Zalo Desktop</p>
          </div>
          <div style={{ position: 'relative', width: '100%', maxWidth: '1360px', margin: '0 auto' }}>
            <div className="floating-badge badge-top-right">
              <span className="badge-icon"><i className="fa-solid fa-bolt" style={{ color: '#fb923c' }}></i></span>
              <span className="badge-text" style={{ color: '#fb923c', fontSize: '15px', fontWeight: '800' }}>Tốc độ &lt; 0.5s</span>
            </div>
            <div className="floating-badge badge-mid-left">
              <span className="badge-icon">💰</span>
              <span className="badge-text" style={{ color: '#34d399', fontSize: '15px', fontWeight: '800' }}>+18.500đ Vừa ghi nhận</span>
            </div>
            <div className="floating-badge badge-bot-right">
              <span className="badge-icon">
                <img src="/robot-icon.png" alt="AI Robot" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
              </span>
              <span className="badge-text" style={{ color: '#38bdf8', fontSize: '15px', fontWeight: '800' }}>AI GPT-4o Tự Động</span>
            </div>
            <div className="zalo-pc-live-card">
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
              <div className="zalo-pc-pin-strip">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#f97316', fontWeight: 'bold' }}>📌 Ghi chú:</span>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '680px' }}>
                    📌 CÁCH THỰC HIỆN MUA SẮM & NHẬN HOÀN TIỀN TỰ ĐỘNG Bước 1: Gửi link sản phẩm hoặc...
                  </span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 10px', borderRadius: '6px', fontSize: '11px', color: '#94a3b8' }}>+1 ghim ▾</div>
              </div>
              <div className="zalo-pc-chat-main">
                <div className="zalo-pc-divider">04:50 13/08/2026</div>
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
                <div className="zalo-pc-msg-item">
                  <img src="/MAIN.png" alt="28Symues Bot Avatar" className="zalo-pc-msg-avatar-img" style={{ border: '1px solid #f97316' }} />
                  <div className="zalo-pc-msg-body" style={{ maxWidth: '92%' }}>
                    <div className="zalo-pc-author" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: '#ea580c' }}>28Symues Bot</span>
                      <span style={{ background: '#ea580c', color: '#ffffff', fontSize: '9.5px', padding: '1px 5px', borderRadius: '4px', fontWeight: '800' }}>BOT</span>
                    </div>
                    <div className="zalo-pc-bubble" style={{ borderLeft: '4px solid #ea580c' }}>
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
            
            {/* Gói Cơ Bản 199k */}
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
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>Tự động chuyển đổi link tiếp thị liên kết 24/7 trực tiếp trong nhóm Zalo</p>
                
                <div style={{ marginBottom: '32px' }}>
                  <span style={{ fontSize: '42px', fontWeight: '800', color: '#0f172a', fontFamily: 'var(--font-heading)' }}>199.000đ</span>
                  <span style={{ color: '#64748b', fontSize: '15px' }}> / tháng</span>
                </div>
                
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#334155', fontSize: '14px' }}>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> Tự động đổi link mua sắm Shopee, Lazada, TikTok Shop sang link nhận hoa hồng của bạn.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#334155', fontSize: '14px' }}>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> Hoạt động 24/7 trong nhóm chat, tự động trả lời tin nhắn ngay lập tức không cần trực máy.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#334155', fontSize: '14px' }}>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> Tự nhận biết người gửi link: Ghi nhận chính xác ai gửi link trong nhóm để bạn theo dõi doanh số.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#334155', fontSize: '14px' }}>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> Phản hồi siêu tốc 24/7: Bot trả lời tin nhắn tức thì, bạn không cần túc trực máy tính.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#334155', fontSize: '14px' }}>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> Tin nhắn tối ưu mua hàng: Mẫu phản hồi lịch sự, ngắn gọn, gắn thẻ khách hàng kích thích bấm mua.
                  </li>
                </ul>
              </div>
              
              <a 
                href="https://zalo.me/0888728256"
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
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>Bot Zalo + Nền tảng SaaS: Trang tra cứu ví hoa hồng cho khách & Dashboard quản trị cho chủ nhóm</p>
                
                <div style={{ marginBottom: '32px' }}>
                  <span style={{ fontSize: '42px', fontWeight: '800', color: '#0f172a', fontFamily: 'var(--font-heading)' }}>399.000đ</span>
                  <span style={{ color: '#64748b', fontSize: '15px' }}> / tháng</span>
                </div>
                
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#334155', fontSize: '14px' }}>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> Bao gồm toàn bộ tính năng của bản Cơ Bản.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#334155', fontSize: '14px' }}>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> Trang Tra Cứu Khách Hàng (SaaS): Khách tự tra cứu đơn hàng, ví tích lũy, số dư khả dụng và tạo lệnh rút tiền.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#334155', fontSize: '14px' }}>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> Dashboard Quản Trị Trưởng Nhóm: Đăng nhập xem toàn bộ đơn hàng, quản lý thành viên và duyệt thanh toán 1-click.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#334155', fontSize: '14px' }}>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> Tùy Chỉnh Kênh SaaS Riêng: Tự cài đặt tỷ lệ chia hoa hồng (%), thuế TNCN (%) và số ngày giữ tiền (Holding days).
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#334155', fontSize: '14px' }}>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> Tra cứu hoa hồng qua Zalo: Khách hàng gõ lệnh `/vitien` hoặc `/donhang` ngay trong nhóm để xem số dư tự động.
                  </li>
                </ul>
              </div>
              
              <a 
                href="https://zalo.me/0888728256"
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
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>Giải pháp độc quyền: Sở hữu Website riêng biệt, tên miền riêng & bản sắc thương hiệu riêng cho chủ nhóm</p>
                
                <div style={{ marginBottom: '32px' }}>
                  <span style={{ fontSize: '42px', fontWeight: '800', color: '#0f172a', fontFamily: 'var(--font-heading)' }}>499.000đ</span>
                  <span style={{ color: '#64748b', fontSize: '15px' }}> / tháng</span>
                </div>
                
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#334155', fontSize: '14px' }}>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> Bao gồm toàn bộ tính năng cao cấp của gói Pro (SaaS).
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#334155', fontSize: '14px' }}>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> Website Riêng Biệt & Tên Miền Riêng: Cài đặt Web chạy trên tên miền thương hiệu riêng của bạn (VD: domaincuaban.com).
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#334155', fontSize: '14px' }}>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> Nhận Diện Thương Hiệu Độc Quyền 100%: Logo, màu sắc giao diện, thông tin giới thiệu mang bản sắc riêng của sếp.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#334155', fontSize: '14px' }}>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> Hạ Tầng & Cơ Sở Dữ Liệu Riêng: Tốc độ tải trang siêu tốc, bảo mật tuyệt đối, vận hành ổn định không lo nghẽn mạng.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#334155', fontSize: '14px' }}>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> Tùy Biến Mẫu Tin Nhắn Bot Độc Quyền: Cá nhân hóa 15 mẫu tin nhắn Zalo bot và quy tắc ví theo yêu cầu riêng.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#334155', fontSize: '14px' }}>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> Hỗ Trợ Kỹ Thuật VIP 1-1: Ưu tiên cập nhật tính năng mới nhất và được hỗ trợ kỹ thuật trực tiếp 24/7.
                  </li>
                </ul>
              </div>
              
              <a 
                href="https://zalo.me/0888728256"
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
                <img src="/28symueslogomanin.png?v=7" alt="28Symues Affiliate Logo" style={{ height: '90px', width: 'auto', maxWidth: '450px', objectFit: 'contain' }} />
              </div>
              <p className="footer-slogan">
                Giải pháp cho thuê Chatbot Zalo tự động nhận diện và chuyển đổi liên kết mua sắm Shopee, TikTok Shop & Lazada 24/7, gắn SubID chuẩn xác và quản lý ví hoa hồng tích lũy minh bạch cho chủ nhóm.
              </p>
              <div className="footer-platform-badges">
                <span className="footer-platform-chip">🛒 Shopee Affiliate</span>
                <span className="footer-platform-chip">🎵 TikTok Shop</span>
                <span className="footer-platform-chip">🛍️ Lazada Affiliate</span>
              </div>
            </div>

            <div className="footer-links">
              <h4>Điều Hướng Nhanh</h4>
              <ul>
                <li><a href="#automation-features">✨ Tính Năng Độc Bản</a></li>
                <li><a href="#zalo-demo">💬 Trải Nghiệm Zalo Bot</a></li>
                <li><button onClick={() => { setView('lookup'); window.history.pushState({}, '', '/?view=lookup'); }} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px', fontWeight: 500, fontFamily: 'inherit' }}>📊 Tra Cứu Đơn Hàng Web</button></li>
                <li><a href="#pricing">💎 Bảng Giá Dịch Vụ</a></li>
              </ul>
            </div>

            <div className="footer-contact">
              <h4>Liên Hệ & Hỗ Trợ Kỹ Thuật</h4>
              <div className="footer-contact-list">
                <div className="footer-contact-item">
                  <i className="fa-solid fa-user-gear" style={{ color: '#f97316' }}></i>
                  <span>Zalo Admin: Phạm Thắng - SĐT 0888728256</span>
                </div>
                <div className="footer-contact-item">
                  <i className="fa-solid fa-comments" style={{ color: '#059669' }}></i>
                  <span>Cộng đồng hỗ trợ & Hướng dẫn sử dụng Zalo Bot</span>
                </div>
                <div className="footer-contact-item">
                  <i className="fa-solid fa-shield-check" style={{ color: '#0284c7' }}></i>
                  <span>Bảo mật dữ liệu & Đương quyền SubID chuẩn 100%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© 2026 Cho Thuê Zalo Bot Affiliate - 28Symues. All rights reserved.</p>
            <div className="footer-bottom-links">
              <a href="#privacy">Chính Sách Bảo Mật</a>
              <a href="#terms">Điều Khoản Sử Dụng</a>
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="btn-back-to-top">
                <i className="fa-solid fa-arrow-up"></i> Lên Đầu Trang
              </button>
            </div>
          </div>
        </footer>
        <FloatingZaloContact />
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
            <img src="/28symueslogomanin.png?v=7" alt="28Symues Admin Logo" style={{ height: '64px', width: 'auto', maxWidth: '100%', objectFit: 'contain' }} />
          </div>
        </div>
        <ul className="sidebar-menu">
          <li 
            className="menu-item sidebar-home-item"
            onClick={() => { setView('home'); sessionStorage.removeItem('adminView'); setSidebarOpen(false); }}
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
        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="sidebar-user-avatar-wrap">
              {user?.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt={user?.fullName || 'Avatar'} 
                  referrerPolicy="no-referrer"
                  className="sidebar-user-avatar"
                />
              ) : (
                <div className="sidebar-user-avatar-placeholder">
                  {(user?.fullName || 'PT').substring(0, 2).toUpperCase()}
                </div>
              )}
              <span className="sidebar-user-status-dot" title="Đang trực tuyến"></span>
            </div>

            <div className="sidebar-user-info">
              <div className="sidebar-user-name" title={user?.fullName || 'Tài khoản'}>
                {user?.fullName || 'Thắng Phạm'}
              </div>
              <div className="sidebar-user-role-badge">
                <span className="sidebar-user-role-icon">✦</span>
                <span>{user?.role || 'SUPER_ADMIN'}</span>
              </div>
            </div>
          </div>

          <div className="sidebar-footer-actions">
            <ThemeToggle className="sidebar-theme-toggle" />
            <button 
              className="sidebar-logout-btn"
              onClick={handleLogout}
              title="Đăng xuất khỏi hệ thống"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span>Đăng xuất</span>
            </button>
          </div>
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
              className="btn btn-refresh-header" 
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
                      <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      </div>
                      <span className="stat-label">Tổng thành viên</span>
                      <span className="stat-val">{stats.totalMembers}</span>
                    </div>
                    {/* Shopee Orders Card */}
                    <div className="stat-card stat-shopee">
                      <div className="stat-icon" style={{ background: 'rgba(238, 77, 45, 0.12)', color: '#ee4d2d' }}>
                        <svg viewBox="0 0 109.59 122.88" style={{ width: '18px', height: '18px', fill: '#ee4d2d' }}>
                          <path d="M74.98,91.98C76.15,82.36,69.96,76.22,53.6,71c-7.92-2.7-11.66-6.24-11.57-11.12 c0.33-5.4,5.36-9.34,12.04-9.47c4.63,0.09,9.77,1.22,14.76,4.56c0.59,0.37,1.01,0.32,1.35-0.2c0.46-0.74,1.61-2.53,2-3.17 c0.26-0.42,0.31-0.96-0.35-1.44c-0.95-0.7-3.6-2.13-5.03-2.72c-3.88-1.62-8.23-2.64-12.86-2.63c-9.77,0.04-17.47,6.22-18.12,14.47 c-0.42,5.95,2.53,10.79,8.86,14.47c1.34,0.78,8.6,3.67,11.49,4.57c9.08,2.83,13.8,7.9,12.69,13.81c-1.01,5.36-6.65,8.83-14.43,8.93 c-6.17-0.24-11.71-2.75-16.02-6.1c-0.11-0.08-0.65-0.5-0.72-0.56c-0.53-0.42-1.11-0.39-1.47,0.15c-0.26,0.4-1.92,2.8-2.34,3.43 c-0.39,0.55-0.18,0.86,0.23,1.2c1.8,1.5,4.18,3.14,5.81,3.97c4.47,2.28,9.32,3.53,14.48,3.72c3.32,0.22,7.5-0.49,10.63-1.81 C70.63,102.67,74.25,97.92,74.98,91.98L74.98,91.98z M54.79,7.18c-10.59,0-19.22,9.98-19.62,22.47h39.25 C74.01,17.16,65.38,7.18,54.79,7.18z M94.99,122.88l-0.41,0l-80.82-0.01h0c-5.5-0.21-9.54-4.66-10.09-10.19l-0.05-1 l-3.61-79.5v0C0,32.12,0,32.06,0,32c0-1.28,1.03-2.33,2.3-2.35l0,0h25.48C28.41,13.15,40.26,0,54.79,0s26.39,13.15,27.01,29.65 h25.4h0.04c1.3,0,2.35,1.05,2.35,2.35c0,0.04,0,0.08,0,0.12v0l-3.96,79.81l-0.04,0.68C105.12,118.21,100.59,122.73,94.99,122.88 L94.99,122.88z" />
                        </svg>
                      </div>
                      <span className="stat-label">Đơn Hàng Shopee</span>
                      <span className="stat-val" style={{ color: '#ee4d2d' }}>
                        {stats.shopeeOrdersCount !== undefined ? stats.shopeeOrdersCount : (orders || []).filter(o => !o.platform || o.platform === 'Shopee').length}{' '}
                        <small style={{ fontSize: '13px', fontWeight: '400', opacity: 0.85 }}>
                          ({formatMoney(stats.shopeeCommission !== undefined ? stats.shopeeCommission : (orders || []).filter(o => !o.platform || o.platform === 'Shopee').reduce((sum, o) => sum + (o.commission || 0), 0))})
                        </small>
                      </span>
                    </div>

                    {/* TikTok Orders Card */}
                    <div className="stat-card stat-tiktok">
                      <div className="stat-icon" style={{ background: 'rgba(0, 200, 230, 0.12)', color: '#0284c7' }}>
                        <svg viewBox="0 0 1024 1024" style={{ width: '18px', height: '18px', fill: 'currentColor' }}>
                          <path d="M800 112.962C800 50.575 749.425 0 687.038 0H112.962C50.575 0 0 50.575 0 112.962v574.076C0 749.426 50.575 800 112.962 800h574.076C749.425 800 800 749.426 800 687.038zM662.759 348.916c-51.615.577-99.71-15.027-141.938-43.927v202.874c0 90.166-61.72 167.62-148.996 187.848-119.068 27.165-219.864-58.954-232.577-161.835-13.294-102.884 52.322-193.051 152.892-213.281 19.651-4.045 49.209-4.045 64.458-.577v108.661c-4.692-1.153-9.086-2.31-13.709-2.888-39.304-6.937-77.371 12.715-92.977 48.55-15.605 35.838-5.16 77.451 26.629 101.73 26.586 20.806 56.085 23.694 86.14 9.822 30.057-13.291 46.21-37.567 49.676-70.512.578-4.622.546-9.826.546-15.028V110.206c0-10.981.086-10.502 11.068-10.502h86.12c6.36 0 8.673.915 9.25 8.433 4.621 67.047 55.526 124.147 120.838 132.818 6.937 1.155 14.369 1.613 22.58 2.19z" transform="translate(112 112)"/>
                        </svg>
                      </div>
                      <span className="stat-label">Đơn Hàng TikTok</span>
                      <span className="stat-val" style={{ color: '#38bdf8' }}>
                        {stats.tiktokOrdersCount !== undefined ? stats.tiktokOrdersCount : (orders || []).filter(o => o.platform === 'TikTok Shop').length}{' '}
                        <small style={{ fontSize: '13px', fontWeight: '400', opacity: 0.85 }}>
                          ({formatMoney(stats.tiktokCommission !== undefined ? stats.tiktokCommission : (orders || []).filter(o => o.platform === 'TikTok Shop').reduce((sum, o) => sum + (o.commission || 0), 0))})
                        </small>
                      </span>
                    </div>
                    <div className="stat-card stat-commission">
                      <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                      </div>
                      <span className="stat-label">Doanh thu hoa hồng</span>
                      <span className="stat-val" style={{ color: '#10b981' }}>{formatMoney(stats.totalCommission)}</span>
                    </div>
                    <div className="stat-card stat-pending">
                      <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#d97706' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      </div>
                      <span className="stat-label">Chờ duyệt rút tiền</span>
                      <span className="stat-val" style={{ color: stats.pendingPayoutsCount > 0 ? '#ea580c' : 'inherit' }}>
                        {stats.pendingPayoutsCount}
                      </span>
                    </div>
                    <div className="stat-card stat-withdrawn">
                      <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#4f46e5' }}>
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
              {activeTab === 'users' && <UsersTab />}

              {/* Tab 3: ORDERS LIST */}
              {activeTab === 'orders' && <OrdersTab />}

              {/* Tab 4: PAYOUTS LIST */}
              {activeTab === 'payouts' && <PayoutsTab />}
            </>
          )}
        </section>
      </main>
      <FloatingZaloContact />
      {renderMobileBottomNav()}
    </div>
  );
}

export default App;
