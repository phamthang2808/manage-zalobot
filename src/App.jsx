import { useEffect, useState } from 'react';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cfStatus, setCfStatus] = useState('verifying');

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

  const [windowWidth, setWindowWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 375);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      background: 'linear-gradient(135deg, rgba(17, 14, 4, 0.97), rgba(26, 20, 5, 0.99))',
      border: '1px solid rgba(251, 191, 36, 0.3)',
      borderLeft: '4px solid #fbbf24',
      borderRadius: '14px',
      boxShadow: '0 20px 50px -8px rgba(0,0,0,0.8), 0 0 35px rgba(245,158,11,0.12)',
      top: '72px'
    }}>
      {/* Icon Badge */}
      <div style={{
        width: '40px',
        height: '40px',
        minWidth: '40px',
        borderRadius: '50%',
        background: 'rgba(245, 158, 11, 0.15)',
        border: '1.5px solid rgba(251, 191, 36, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 0 14px rgba(245,158,11,0.2)'
      }}>
        {toast.type === 'success' ? (
          <svg style={{ width: '18px', height: '18px', color: '#fbbf24' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"></path>
          </svg>
        ) : toast.type === 'error' ? (
          <svg style={{ width: '18px', height: '18px', color: '#fbbf24' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"></path>
          </svg>
        ) : (
          <svg style={{ width: '18px', height: '18px', color: '#fbbf24' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.085 1.085l-1.086 1.086L10.5 13.5H12.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, textAlign: 'left' }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '700',
          color: '#fbbf24',
          marginBottom: '3px',
          letterSpacing: '0.1px'
        }}>
          {toast.type === 'success' ? '✓  Thành công' : (toast.type === 'error' ? '⚠  Có lỗi xảy ra' : 'ℹ  Thông báo')}
        </div>
        <div style={{ fontSize: '13px', color: '#a8946a', lineHeight: '1.45' }}>
          {toast.message}
        </div>
      </div>

      {/* Close Button */}
      <button
        onClick={() => setToast(null)}
        style={{
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.15)',
          color: '#92764a',
          fontSize: '14px',
          cursor: 'pointer',
          padding: '4px 7px',
          lineHeight: 1,
          borderRadius: '6px',
          alignSelf: 'flex-start',
          transition: 'all 0.2s',
          flexShrink: 0
        }}
        onMouseEnter={e => { e.currentTarget.style.background='rgba(245,158,11,0.18)'; e.currentTarget.style.color='#fbbf24'; }}
        onMouseLeave={e => { e.currentTarget.style.background='rgba(245,158,11,0.08)'; e.currentTarget.style.color='#92764a'; }}
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
        background: 'linear-gradient(90deg, #fbbf24, #d97706)',
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
      ? lookupResult.orders.filter(o => 
          o.orderId?.toLowerCase().includes(lookupLocalFilter.toLowerCase()) ||
          o.productName?.toLowerCase().includes(lookupLocalFilter.toLowerCase())
        )
      : [];

    return (
      <div className="lookup-page-container">
        <style dangerouslySetInnerHTML={{__html: `
          .lookup-page-container {
            min-height: 100vh;
            width: 100%;
            background: transparent;
            color: #e2e8f0;
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
            background: radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, rgba(251, 191, 36, 0.05) 40%, transparent 70%);
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
            background: radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, rgba(251, 191, 36, 0.04) 40%, transparent 70%);
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
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          }
          .lookup-logo {
            font-size: 18px;
            font-weight: 800;
            color: #fff;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .lookup-logo span {
            color: #fff;
          }
          .lookup-logo img {
            border: 1px solid rgba(255, 255, 255, 0.15);
          }
          .lookup-admin-link {
            font-size: 13px;
            color: #9ca3af;
            text-decoration: none;
            background: rgba(255, 255, 255, 0.05);
            padding: 6px 12px;
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            transition: all 0.2s ease;
          }
          .lookup-admin-link:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
            border-color: #fbbf24;
          }
          .lookup-card {
            width: 100%;
            max-width: 600px;
            box-sizing: border-box !important;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);
            margin-bottom: 24px;
            overflow: hidden;
          }
          .lookup-title {
            font-size: 22px;
            font-weight: 700;
            text-align: center;
            color: #fff;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }
          .lookup-subtitle {
            font-size: 13px;
            color: #a8a29e;
            text-align: center;
            margin-bottom: 24px;
          }
          .lookup-tabs {
            display: flex;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.06);
            padding: 4px;
            border-radius: 8px;
            margin-bottom: 16px;
          }
          .lookup-tab {
            flex: 1;
            text-align: center;
            padding: 10px;
            font-size: 13px;
            font-weight: 600;
            border-radius: 6px;
            cursor: pointer;
            background: transparent;
            border: none;
            color: #94a3b8;
            transition: all 0.2s ease;
          }
          .lookup-tab.active {
            background: linear-gradient(135deg, #fbbf24, #d97706);
            color: #0b0f17;
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
          }
          .lookup-input-group {
            margin-bottom: 16px;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          .lookup-label {
            display: block;
            font-size: 11px;
            font-weight: 600;
            color: #d6d3d1;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .lookup-input {
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 8px;
            padding: 12px 14px;
            color: #fff;
            font-size: 15px;
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
            border-color: #fbbf24;
            background: rgba(255, 255, 255, 0.05);
            box-shadow: 0 0 12px rgba(245, 158, 11, 0.15);
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
            background: linear-gradient(135deg, #fbbf24, #d97706);
            background-size: 200% auto;
            color: #0b0f17;
            font-size: 15px;
            font-weight: 700;
            border: none;
            border-radius: 8px;
            padding: 14px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
          }
          .lookup-btn:hover {
            background-position: right center;
            box-shadow: 0 6px 20px rgba(245, 158, 11, 0.5), 0 0 12px rgba(245, 158, 11, 0.2);
            transform: translateY(-1px);
          }
          .lookup-btn:disabled {
            background: #475569;
            color: #94a3b8;
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
            font-size: 12px;
            color: #a8a29e;
          }
          .recent-tag {
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            padding: 4px 10px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s ease;
            color: #d6d3d1;
          }
          .recent-tag:hover {
            border-color: #fbbf24;
            background: rgba(255, 255, 255, 0.08);
            color: #fff;
          }
          .recent-close {
            font-size: 12px;
            color: #ef4444;
            font-weight: bold;
          }
          .lookup-error {
            width: 100%;
            max-width: 600px;
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid #ef4444;
            color: #fca5a5;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 14px;
          }
          .stats-container {
            width: 100%;
            max-width: 600px;
            margin-bottom: 24px;
          }
          .stats-section-title {
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 12px;
            color: #fff;
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
            border: 1px solid rgba(255,255,255,0.06);
            display: flex;
            flex-direction: column;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          }
          .stat-card-item.total {
            background: linear-gradient(135deg, #7c2d12 0%, #1c1917 100%);
            border-color: #ea580c;
          }
          .stat-card-item.pending {
            background: linear-gradient(135deg, #78350f 0%, #1c1917 100%);
            border-color: #d97706;
          }
          .stat-card-item.completed {
            background: linear-gradient(135deg, #064e3b 0%, #1c1917 100%);
            border-color: #059669;
          }
          .stat-card-item.withdrawable {
            background: linear-gradient(135deg, #0b1120 0%, #1c1917 100%);
            border-color: #fbbf24;
          }
          .stat-card-item.received {
            background: linear-gradient(135deg, #1e1008 0%, #1c1917 100%);
            border-color: #d97706;
          }
          .stat-card-label {
            font-size: 11px;
            text-transform: uppercase;
            color: #a8a29e;
            margin-bottom: 4px;
            font-weight: 600;
          }
          .stat-card-value {
            font-size: 22px;
            font-weight: 800;
            color: #fff;
          }
          .stat-card-value.primary {
            color: #fdba74;
          }
          .orders-container {
            width: 100%;
            max-width: 600px;
          }
          .order-card-item {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 12px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
          }
          .order-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            font-size: 12px;
            color: #a8a29e;
          }
          .order-id-badge {
            font-family: monospace;
            font-weight: 700;
            color: #f97316;
          }
          .order-card-title {
            font-size: 14px;
            font-weight: 600;
            color: #fff;
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
            border-top: 1px dashed rgba(255,255,255,0.08);
            padding-top: 10px;
          }
          .order-commission-label {
            font-size: 12px;
            color: #a8a29e;
          }
          .order-commission-val {
            font-size: 15px;
            font-weight: 700;
            color: #10b981;
          }
          .order-status-badge {
            font-size: 11px;
            padding: 3px 8px;
            border-radius: 20px;
            font-weight: 700;
          }
          .order-status-badge.completed {
            background: rgba(16, 185, 129, 0.15);
            color: #10b981;
            border: 1px solid rgba(16, 185, 129, 0.3);
          }
          .order-status-badge.pending {
            background: rgba(245, 158, 11, 0.15);
            color: #f59e0b;
            border: 1px solid rgba(245, 158, 11, 0.3);
          }
          .order-status-badge.cancelled {
            background: rgba(239, 68, 68, 0.15);
            color: #ef4444;
            border: 1px solid rgba(239, 68, 68, 0.3);
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
            color: #94a3b8;
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
            box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(245, 158, 11, 0.15);
            border: 2px solid rgba(245, 158, 11, 0.25);
            animation: banner-float 4s ease-in-out infinite;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          .lookup-banner-img-wrap:hover {
            transform: scale(1.03) translateY(-4px);
            box-shadow: 0 12px 40px rgba(0,0,0,0.6), 0 0 30px rgba(245, 158, 11, 0.3);
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

        {/* Top Navbar */}
        <header className="lookup-header">
          <div className="lookup-logo">
            <img src="/logo.jpg" alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
            <span>28Symues <span style={{ color: '#fbbf24' }}>Affiliate</span></span>
          </div>
          <button 
            className="lookup-admin-link" 
            onClick={() => {
              setView('home');
              sessionStorage.setItem('adminView', 'home');
              window.location.hash = '';
            }}
          >
            <i className="fa-solid fa-house" style={{ marginRight: '6px' }}></i> Về Trang Chủ
          </button>
        </header>

        {/* Search Panel Card */}
        <div className="lookup-card">
          <h2 className="lookup-title">
            <i className="fa-thin fa-magnifying-glass" style={{ marginRight: '8px' }}></i> Tra Cứu Đơn Hàng Shopee
          </h2>
          <p className="lookup-subtitle">Nhập mã đơn hàng để kiểm tra trạng thái và hoa hồng</p>

          <div className="lookup-input-group">
            <label className="lookup-label">
              Nhập mã đơn hàng (Shopee)
            </label>
            <input 
              type="text"
              className="lookup-input"
              value={lookupQuery}
              onChange={(e) => setLookupQuery(e.target.value)}
              placeholder="Ví dụ: 260606C8W7YARK..."
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
              'Tra cứu ngay'
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
            {lookupSearchType !== 'ORDER_ID' && (
              <>
                {/* 0. Bank Info Card */}
                <div className="lookup-card" style={{ marginBottom: '24px' }}>
                  <h3 className="stats-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fa-regular fa-building-columns" style={{ fontSize: '18px' }}></i>
                      Thông Tin Ngân Hàng Nhận Tiền
                    </span>
                    {!isEditingBank && (
                      <button 
                        className="lookup-admin-link" 
                        style={{ fontSize: '12px', padding: '4px 10px', background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.25)', display: 'flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => {
                          setEditBankName(lookupResult.bankName || '');
                          setEditAccountNumber(lookupResult.accountNumber || '');
                          setBankSaveError('');
                          setIsEditingBank(true);
                        }}
                      >
                        <i className="fa-regular fa-pen-to-square" style={{ fontSize: '14px' }}></i>
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
                      {bankSaveError && <div style={{ color: '#f87171', fontSize: '12px' }}>⚠️ {bankSaveError}</div>}
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                        <button 
                          className="lookup-admin-link" 
                          style={{ padding: '6px 14px', background: 'rgba(255, 255, 255, 0.05)', color: '#9ca3af' }}
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
                    <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(255, 255, 255, 0.02)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <div>
                        <span className="lookup-label" style={{ fontSize: '10px', color: '#94a3b8' }}>Ngân Hàng</span>
                        <strong style={{ fontSize: '15px', color: '#fff' }}>{lookupResult.bankName || 'Chưa thiết lập'}</strong>
                      </div>
                      <div>
                        <span className="lookup-label" style={{ fontSize: '10px', color: '#94a3b8' }}>Số Tài Khoản</span>
                        <strong style={{ fontSize: '15px', color: '#fff' }}>{lookupResult.accountNumber || 'Chưa thiết lập'}</strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* 1. Wallet Stats */}
                <div className="stats-container">
                  <h3 className="stats-section-title">
                    💰 Thống Kê Hoa Hồng của: <span style={{ color: '#fbbf24' }}>{lookupResult.zaloName}</span>
                  </h3>
                  <div className="stats-cards-grid">
                    <div className="stat-card-item total">
                      <span className="stat-card-label">Tổng tích lũy (Hoàn thành + Chờ)</span>
                      <span className="stat-card-value primary">{formatMoney(totalCommission)}</span>
                    </div>
                    <div className="stat-card-item pending">
                      <span className="stat-card-label">Đang chờ xử lý</span>
                      <span style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Đang vận chuyển hoặc chưa xác nhận</span>
                      <span className="stat-card-value">{formatMoney(lookupResult.wallet.pendingCommission)}</span>
                    </div>
                    <div className="stat-card-item completed">
                      <span className="stat-card-label">Đã hoàn thành</span>
                      <span style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Đã ấn giao hàng thành công</span>
                      <span className="stat-card-value">{formatMoney(lookupResult.wallet.completedCommission)}</span>
                    </div>
                    <div className="stat-card-item withdrawable">
                      <span className="stat-card-label">Có thể rút ngay (Khả dụng)</span>
                      <span style={{ fontSize: '11px', color: '#fbbf24', marginBottom: '4px' }}>Sau 3 ngày • Đã trừ thuế & chia 8-2</span>
                      <span className="stat-card-value" style={{ color: '#fbbf24' }}>{formatMoney(lookupResult.wallet.withdrawableCommission)}</span>
                    </div>
                    <div className="stat-card-item received">
                      <span className="stat-card-label">Đã nhận (Đã thanh toán)</span>
                      <span style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Tổng tiền đã rút về tài khoản</span>
                      <span className="stat-card-value" style={{ color: '#d97706' }}>{formatMoney(lookupResult.wallet.receivedCommission)}</span>
                    </div>
                  </div>
                </div>

                {/* 1.5. Payout Request Card */}
                <div className="lookup-card" style={{ marginBottom: '24px' }}>
                  <h3 className="stats-section-title" style={{ margin: 0, marginBottom: '12px' }}>
                    <span>💸 Rút Tiền Hoa Hồng Khả Dụng</span>
                  </h3>
                  <p style={{ fontSize: '12.5px', color: '#a8a29e', margin: '0 0 16px 0', lineHeight: '1.4' }}>
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
                            style={{ position: 'absolute', right: '8px', fontSize: '11px', padding: '4px 8px', background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.2)' }}
                            onClick={() => setPayoutAmount(new Intl.NumberFormat('vi-VN').format(lookupResult.wallet.withdrawableCommission))}
                          >
                            Rút hết
                          </button>
                        </div>
                      </div>
                      
                      {payoutSaveError && <div style={{ color: '#f87171', fontSize: '12px' }}>⚠️ {payoutSaveError}</div>}
                      
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
                    <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.05)', border: '1px dashed rgba(239, 68, 68, 0.2)', borderRadius: '8px', textAlign: 'center', color: '#fca5a5', fontSize: '13px' }}>
                      🔒 Số dư khả dụng của sếp hiện đang là 0đ. Chưa thể rút tiền lúc này.
                    </div>
                  )}
                </div>
              </>
            )}

            {/* 2. Orders Cards List */}
            <div className="orders-container">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '10px', marginBottom: '16px', width: '100%' }}>
                <h3 className="stats-section-title" style={{ marginBottom: 0, width: '100%', fontSize: '16px', fontWeight: '700', color: '#fff' }}>
                  {lookupSearchType === 'ORDER_ID' ? '🛒 Kết Quả Tra Cứu Đơn Hàng' : `🛒 Đơn hàng đã mua (${searchedOrders.length})`}
                </h3>
                {lookupSearchType !== 'ORDER_ID' && (
                  <input 
                    type="text" 
                    placeholder="Lọc nhanh đơn hàng..." 
                    className="lookup-input"
                    style={{ width: '100%', maxWidth: '100%', padding: '8px 12px', fontSize: '13px', borderRadius: '8px', margin: 0 }}
                    value={lookupLocalFilter}
                    onChange={(e) => setLookupLocalFilter(e.target.value)}
                  />
                )}
              </div>

              {searchedOrders.length === 0 ? (
                <div className="lookup-card" style={{ padding: '24px', textAlign: 'center', color: '#a8a29e' }}>
                  📭 Không tìm thấy đơn hàng nào khớp điều kiện lọc.
                </div>
              ) : (
                searchedOrders.map((o) => (
                  <div key={o.id} className="order-card-item">
                    <div className="order-card-header">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <i className="fa-regular fa-calendar" style={{ color: '#94a3b8', fontSize: '13px' }}></i>
                        <span>{formatDateTime(o.purchaseTime)}</span>
                      </span>
                      <span>Mã đơn: <span className="order-id-badge">{o.orderId}</span></span>
                    </div>
                    <div className="order-card-title" title={o.productName}>
                      {o.productName}
                    </div>
                    <div className="order-card-commission-row">
                      <span className="order-status-badge completed" style={{ 
                        background: o.status === 'Hoàn thành' ? 'rgba(16, 185, 129, 0.15)' : 
                                    o.status === 'Hủy' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: o.status === 'Hoàn thành' ? '#10b981' : 
                               o.status === 'Hủy' ? '#ef4444' : '#f59e0b',
                        border: `1px solid ${o.status === 'Hoàn thành' ? 'rgba(16, 185, 129, 0.3)' : 
                                              o.status === 'Hủy' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
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
            background: 'rgba(0, 0, 0, 0.8)',
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
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 45px rgba(245, 158, 11, 0.15)',
              background: 'linear-gradient(145deg, #0d1117, #0b0f17)',
              padding: '32px 24px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Glowing Lock Badge */}
              <div style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(251, 191, 36, 0.1))',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                boxShadow: '0 0 25px rgba(245, 158, 11, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px',
                fontSize: '36px'
              }}>
                🔒
              </div>

              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.3px' }}>
                Xác Thực Bảo Mật OTP
              </h3>
              <p style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: '1.5', marginBottom: '16px', padding: '0 8px' }}>
                Mã xác thực 6 số vừa được gửi đến <span style={{ color: '#fbbf24', fontWeight: '600' }}>tin nhắn riêng Zalo</span> của bạn.
              </p>

              {/* Alert Info Box thay cho văn bản có emoji dễ lỗi */}
              <div style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.22)',
                borderRadius: '12px',
                padding: '10px 12px',
                fontSize: '12.5px',
                color: '#fde68a',
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
                    border: '1.5px solid rgba(245, 158, 11, 0.45)',
                    background: 'rgba(0, 0, 0, 0.5)',
                    color: '#fbbf24',
                    outline: 'none',
                    boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5)'
                  }}
                />
              </div>

              {otpError && (
                <div style={{ color: '#f87171', fontSize: '13px', marginBottom: '18px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px', borderRadius: '10px', fontWeight: '500' }}>
                  ⚠️ {otpError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginBottom: '22px' }}>
                <button
                  onClick={() => setOtpModalOpen(false)}
                  style={{ flex: 1, padding: '13px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.06)', color: '#cbd5e1', border: '1px solid rgba(255, 255, 255, 0.12)', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: 'all 0.2s' }}
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
                  style={{ flex: 1.4, padding: '13px', borderRadius: '12px', fontSize: '14.5px', background: 'linear-gradient(135deg, #fbbf24, #d97706)', color: '#0b0f17', border: 'none', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 6px 20px rgba(245, 158, 11, 0.4)', transition: 'all 0.2s' }}
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
            background: transparent;
            display: flex;
            flex-direction: column;
            position: relative;
            overflow-y: auto;
            box-sizing: border-box;
            color: #e2e8f0;
          }
          .login-page-split::before {
            content: '';
            position: absolute;
            top: -10%;
            left: -10%;
            width: 500px;
            height: 500px;
            background: radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, rgba(251, 191, 36, 0.05) 40%, transparent 70%);
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
            background: radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, rgba(251, 191, 36, 0.03) 40%, transparent 70%);
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
            border: 1px solid rgba(245, 158, 11, 0.35);
            object-fit: cover;
          }
          .login-split-logo span {
            font-family: var(--font-heading);
            font-size: 20px;
            font-weight: 800;
            color: #fff;
            letter-spacing: 0.5px;
          }
          .login-split-nav {
            display: flex;
            align-items: center;
            gap: 24px;
          }
          .login-split-nav a {
            color: var(--text-muted);
            font-size: 14.5px;
            transition: color 0.2s;
            text-decoration: none;
            cursor: pointer;
          }
          .login-split-nav a:hover {
            color: #fff;
          }
          .login-split-nav .btn-back {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #fff;
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
            background: rgba(255, 255, 255, 0.12);
            border-color: rgba(255, 255, 255, 0.2);
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
            background: rgba(245, 158, 11, 0.15);
            border: 1px solid rgba(245, 158, 11, 0.3);
            color: #fbbf24;
            padding: 6px 12px;
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
            color: #fff;
            line-height: 1.3;
            margin: 0 0 20px;
          }
          .login-split-left p {
            font-size: 16px;
            color: var(--text-muted);
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
            background: rgba(11, 15, 23, 0.75);
            backdrop-filter: blur(25px);
            -webkit-backdrop-filter: blur(25px);
            border: 1px solid rgba(245, 158, 11, 0.25);
            border-radius: 24px;
            width: 100%;
            max-width: 440px;
            padding: 24px 32px;
            box-shadow: 0 25px 60px -10px rgba(0, 0, 0, 0.8), 0 0 50px rgba(245, 158, 11, 0.1);
            box-sizing: border-box;
          }
          .login-split-card h2 {
            font-family: var(--font-heading);
            font-size: 28px;
            font-weight: 800;
            color: #fff;
            margin: 0 0 8px;
            text-align: left;
          }
          .login-split-card .subtitle {
            font-size: 13.5px;
            color: var(--text-muted);
            margin-bottom: 12px;
            text-align: left;
          }
          .form-label {
            display: block;
            text-align: left;
            font-size: 13px;
            font-weight: 600;
            color: #ccc;
            margin-bottom: 8px;
          }
          .form-input-wrapper {
            position: relative;
            margin-bottom: 10px;
          }
          .form-input {
            width: 100%;
            padding: 13px 16px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            color: #fff;
            font-size: 14.5px;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            box-sizing: border-box;
          }
          .form-input:focus {
            outline: none;
            border-color: #fbbf24;
            background: rgba(255, 255, 255, 0.06);
            box-shadow: 0 0 20px rgba(245, 158, 11, 0.25);
          }
          
          /* Simulated Cloudflare Turnstile CSS */
          .cf-turnstile-sim {
            background: #1b1b1b;
            border: 1px solid #2e2e2e;
            border-radius: 4px;
            padding: 10px 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-height: 58px;
            margin: 16px 0 20px;
            box-sizing: border-box;
            color: #fff;
            user-select: none;
          }
          .cf-verifying {
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;
            font-size: 13px;
            color: #bbb;
            text-align: left;
          }
          .cf-spinner {
            width: 20px;
            height: 20px;
            border: 2px solid rgba(255,255,255,0.1);
            border-top-color: #f38020;
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
            font-weight: 500;
            color: #e2e8f0;
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
            color: #bbb;
          }
          .cf-links {
            display: flex;
            gap: 6px;
            margin-top: 1px;
          }
          .cf-links a {
            font-size: 8px;
            color: #888;
            text-decoration: underline;
          }
          .cf-links a:hover {
            color: #ccc;
          }

          .login-split-footer {
            text-align: center;
            margin-top: 24px;
            font-size: 13.5px;
            color: var(--text-muted);
          }
          .login-split-footer a {
            color: #fbbf24;
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
              padding: 15px 20px;
              height: auto;
            }
            .login-split-logo span {
              font-size: 18px;
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
            .login-split-left h1 {
              font-size: 24px;
            }
            .login-split-card h2 {
              font-size: 22px;
            }
          }
        `}} />

        {/* Header */}
        <header className="login-split-header">
          <div className="login-split-logo">
            <img src="/logo.jpg" alt="Logo" />
            <span>28Symues <span style={{ color: '#fbbf24' }}>Affiliate</span></span>
          </div>
          <div className="login-split-nav">
            <button 
              className="btn-back" 
              onClick={() => {
                setView('home');
                window.history.pushState({}, '', '/');
              }}
            >
              <i className="fa-solid fa-house"></i> Trang chủ
            </button>
          </div>
        </header>

        {/* Main Content split */}
        <div className="login-split-content">
          <div className="login-split-left">
            <div className="badge">
              <i className="fa-thin fa-robot" style={{ fontSize: '14px' }}></i> 28Symues <span style={{ color: '#fbbf24' }}>Affiliate</span>
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
                <div className="terms-checkbox-wrapper" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', textAlign: 'left', margin: '16px 0 10px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  <input 
                    type="checkbox" 
                    id="accept-terms" 
                    required 
                    style={{ marginTop: '3px', cursor: 'pointer' }}
                  />
                  <label htmlFor="accept-terms" style={{ cursor: 'pointer', lineHeight: '1.4' }}>
                    Tôi đồng ý với <a href="#" onClick={(e) => e.preventDefault()} style={{ color: '#fbbf24', textDecoration: 'underline' }}>Điều khoản dịch vụ</a> và <a href="#" onClick={(e) => e.preventDefault()} style={{ color: '#fbbf24', textDecoration: 'underline' }}>Chính sách bảo mật</a>.
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
                minHeight: '42px', 
                margin: '0 auto 12px auto' 
              }}>
                {isMobile ? (
                  <button 
                    className="btn-google-custom" 
                    onClick={handleGoogleLoginMobile}
                    style={{
                      width: '100%',
                      height: '42px',
                      background: '#ffffff',
                      color: '#1f2937',
                      border: '1px solid #d1d5db',
                      borderRadius: '24px',
                      fontSize: '14.5px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    <span>Đăng nhập bằng Google</span>
                  </button>
                ) : (
                  <div id="google-signin-btn" style={{
                    width: '100%',
                    height: '42px',
                    display: 'flex',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}></div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'home') {
    const isAdmin = user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN');
    
    return (
      <div className="landing-page">
        {/* Custom Toast Notification Top-Right */}
        {toastElement}

        {/* Header / Navbar */}
        <header className="landing-header">
          <div className="landing-logo">
            <img src="/logo.jpg" alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
            <span>28Symues <span style={{ color: '#fbbf24' }}>Affiliate</span></span>
          </div>
          <nav className={`landing-nav${mobileMenuOpen ? ' open' : ''}`}>
            <a href="#home" onClick={() => setMobileMenuOpen(false)}>Trang chủ</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Tính năng</a>
            <a href="#steps" onClick={() => setMobileMenuOpen(false)}>Hướng dẫn</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Bảng giá</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setView('lookup'); window.history.pushState({}, '', '/?view=lookup'); setMobileMenuOpen(false); }} style={{ color: '#fbbf24', fontWeight: '700' }}><i className="fa-thin fa-magnifying-glass" style={{ marginRight: '6px' }}></i>Tra cứu đơn hàng</a>
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
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.15))',
                        border: '1px solid rgba(251, 191, 36, 0.45)',
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
                        boxShadow: '0 4px 15px rgba(245, 158, 11, 0.15)',
                        transition: 'all 0.25s ease'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #fbbf24, #d97706)';
                        e.currentTarget.style.color = '#0b0f17';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(245, 158, 11, 0.4)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.15))';
                        e.currentTarget.style.color = '#ffffff';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(245, 158, 11, 0.15)';
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
                  <button className="btn" onClick={() => { handleLogout(); setMobileMenuOpen(false); }} style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
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
                      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.15))',
                      border: '1px solid rgba(251, 191, 36, 0.45)',
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
                      boxShadow: '0 4px 15px rgba(245, 158, 11, 0.15)',
                      transition: 'all 0.25s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #fbbf24, #d97706)';
                      e.currentTarget.style.color = '#0b0f17';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(245, 158, 11, 0.4)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.15))';
                      e.currentTarget.style.color = '#ffffff';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(245, 158, 11, 0.15)';
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
                
                <button className="btn" onClick={handleLogout} style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
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
          {/* Hamburger button - mobile only */}
          <button
            className={`hamburger${mobileMenuOpen ? ' active' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </header>
        {/* Mobile menu overlay */}
        {mobileMenuOpen && <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)}></div>}

        {/* Hero Section */}
        <section id="home" className="hero-section">
          <div className="hero-badge">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#fbbf24', flexShrink: 0 }}>
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <circle cx="12" cy="5" r="2" />
              <path d="M12 7v4" />
              <line x1="8" y1="16" x2="8.01" y2="16" strokeWidth="3" />
              <line x1="16" y1="16" x2="16.01" y2="16" strokeWidth="3" />
              <path d="M9 16h6" />
            </svg>
            HỆ THỐNG AUTOMATION AFFILIATE
          </div>
          <h1 className="hero-title">Tự Động Hóa Shopee Affiliate<br />Với 28Symues</h1>
          <p className="hero-subtitle">
            Biến mọi liên kết mua sắm trong nhóm chat Zalo của bạn thành nguồn thu nhập thụ động chỉ trong vài giây. Tiện lợi, tự động và hoàn toàn minh bạch.
          </p>
          <div className="hero-buttons">
            <a href="#steps" className="btn btn-hero-1">
              Bắt đầu ngay
            </a>
            <button onClick={() => { setView('lookup'); window.history.pushState({}, '', '/?view=lookup'); }} className="btn btn-hero-2">
              <i className="fa-thin fa-magnifying-glass"></i> Tra cứu đơn hàng
            </button>
            <a href="#features" className="btn btn-hero-3">
              Tìm hiểu tính năng
            </a>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="features-section">
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

        {/* Steps Section */}
        <section id="steps" className="instructions-section" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
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

        {/* Pricing Section */}
        <section id="pricing" className="pricing-section" style={{ padding: '80px 20px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <h2 className="section-title" style={{ fontSize: '36px', fontWeight: '800', color: '#fff', marginBottom: '12px' }}>Bảng Giá Dịch Vụ</h2>
          <p className="section-subtitle" style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '16px', marginBottom: '48px' }}>Chi phí tối ưu, hiệu quả tối đa cho nhóm Zalo săn sale của bạn</p>
          
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '24px',
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            
            {/* Gói Thường */}
            <div className="pricing-card" style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '24px',
              padding: '40px 32px',
              width: '100%',
              maxWidth: '360px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.3)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.3s ease'
            }}>
              <div>
                <h3 style={{ fontSize: '22px', color: '#fff', marginBottom: '8px', fontWeight: '700' }}>Zalo Bot Affiliate</h3>
                <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px', marginBottom: '24px' }}>Tự động chuyển đổi link mua sắm cơ bản trong nhóm chat</p>
                
                <div style={{ marginBottom: '32px' }}>
                  <span style={{ fontSize: '42px', fontWeight: '800', color: '#fff', fontFamily: 'var(--font-heading)' }}>199.000đ</span>
                  <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '15px' }}> / tháng</span>
                </div>
                
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                    <span style={{ color: '#34d399', fontWeight: 'bold' }}>✓</span> Tự động đổi link nhận hoa hồng: Khách gửi link Shopee, Lazada... bot tự đổi thành link của sếp ngay lập tức.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                    <span style={{ color: '#34d399', fontWeight: 'bold' }}>✓</span> Tự nhận biết người gửi: Ghi nhận chính xác ai gửi link để sếp tính doanh số cho họ.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                    <span style={{ color: '#34d399', fontWeight: 'bold' }}>✓</span> Hoạt động liên tục 24/7: Tự trả lời tin nhắn trong nhóm chat bất kể ngày đêm, sếp không cần trực máy.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                    <span style={{ color: '#34d399', fontWeight: 'bold' }}>✓</span> Tin nhắn phản hồi lịch sự: Mẫu tin nhắn ngắn gọn, rõ ràng, kích thích người mua bấm link.
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
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: '24px',
              padding: '40px 32px',
              width: '100%',
              maxWidth: '360px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 20px 40px -15px rgba(245, 158, 11, 0.2)',
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
                background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                color: '#0b0f17',
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
                <h3 style={{ fontSize: '22px', color: '#fff', marginBottom: '8px', fontWeight: '700', marginTop: '10px' }}>Zalo Bot Affiliate Pro</h3>
                <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px', marginBottom: '24px' }}>Có trang quản trị riêng cho sếp và trang tự tra cứu cho khách</p>
                
                <div style={{ marginBottom: '32px' }}>
                  <span style={{ fontSize: '42px', fontWeight: '800', color: '#fff', fontFamily: 'var(--font-heading)' }}>399.000đ</span>
                  <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '15px' }}> / tháng</span>
                </div>
                
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                    <span style={{ color: '#34d399', fontWeight: 'bold' }}>✓</span> Tự động đổi link mua sắm Shopee, Lazada, TikTok Shop mượt mà.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                    <span style={{ color: '#34d399', fontWeight: 'bold' }}>✓</span> Trang quản trị doanh thu riêng: Theo dõi toàn bộ đơn hàng và quản lý cực kỳ nhàn hạ.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                    <span style={{ color: '#34d399', fontWeight: 'bold' }}>✓</span> Khách tự tra cứu trên Web: Thành viên có thể tự vào xem đơn và hoa hồng mình tích lũy.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                    <span style={{ color: '#34d399', fontWeight: 'bold' }}>✓</span> Chạy cùng lúc nhiều nhóm: Bot hoạt động trên nhiều nhóm chat và gom số liệu về một nơi.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                    <span style={{ color: '#34d399', fontWeight: 'bold' }}>✓</span> Báo cáo hoa hồng chính xác: Tự tính tiền chuẩn sau thuế và lọc bỏ các đơn trùng lặp.
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
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '24px',
              padding: '40px 32px',
              width: '100%',
              maxWidth: '360px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.3)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.3s ease'
            }}>
              <div>
                <h3 style={{ fontSize: '22px', color: '#fff', marginBottom: '8px', fontWeight: '700' }}>Zalo Bot Affiliate Pro Max</h3>
                <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px', marginBottom: '24px' }}>Hệ thống ví tiền tự động và rút tiền qua tin nhắn chat</p>
                
                <div style={{ marginBottom: '32px' }}>
                  <span style={{ fontSize: '42px', fontWeight: '800', color: '#fff', fontFamily: 'var(--font-heading)' }}>599.000đ</span>
                  <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '15px' }}> / tháng</span>
                </div>
                
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                    <span style={{ color: '#34d399', fontWeight: 'bold' }}>✓</span> Đầy đủ toàn bộ tính năng cao cấp của bản Pro.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                    <span style={{ color: '#34d399', fontWeight: 'bold' }}>✓</span> Ví tích lũy tiền tự động: Tự động cộng dồn tiền hoa hồng sau khi đơn hàng thành công.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                    <span style={{ color: '#34d399', fontWeight: 'bold' }}>✓</span> Rút tiền nhanh bằng tin nhắn: Khách tự gõ lệnh `/rut-tien` trong nhóm để yêu cầu thanh toán.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                    <span style={{ color: '#34d399', fontWeight: 'bold' }}>✓</span> Đường truyền riêng siêu tốc: Chạy trên máy chủ VPS riêng, phản hồi ngay lập tức không trễ lag.
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                    <span style={{ color: '#34d399', fontWeight: 'bold' }}>✓</span> Hỗ trợ kỹ thuật ưu tiên 24/7: Xử lý nhanh chóng mọi yêu cầu và sự cố phát sinh.
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
          <section style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            margin: '40px 0 20px',
            position: 'relative',
            zIndex: 2
          }}>
            <h3 style={{ fontSize: '18px', color: '#fff', marginBottom: '16px', fontWeight: '700', textShadow: '0 2px 4px rgba(0,0,0,0.5)', textAlign: 'center', padding: '0 16px', lineHeight: '1.4' }}>
              🌟 Quét QR Tham Gia Nhóm Zalo Nhận Hoàn Tiền Ngay
            </h3>
            <div style={{
              position: 'relative',
              width: '280px',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 12px 40px rgba(0,0,0,0.6), 0 0 30px rgba(245, 158, 11, 0.2)',
              border: '2px solid rgba(245, 158, 11, 0.3)',
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
                  <span style={{ color: '#fbbf24' }}>💬</span>
                  <span>Zalo Admin: <a href="http://zaloapp.com/qr/p/fd2gcjcjfuof" target="_blank" rel="noopener noreferrer">Phạm Thắng</a></span>
                </div>
                <div className="footer-contact-item">
                  <span style={{ color: '#fbbf24' }}>🌐</span>
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
            <img src="/logo.jpg" alt="Logo" style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(251,191,36,0.4)' }} />
            <span>28Symues Admin</span>
          </div>
        </div>
        <ul className="sidebar-menu">
          <li 
            className="menu-item"
            onClick={() => { setView('home'); sessionStorage.removeItem('adminView'); setSidebarOpen(false); }}
            style={{ 
              background: 'rgba(245, 158, 11, 0.08)', 
              color: '#fbbf24', 
              fontWeight: '600', 
              borderLeft: '3px solid #fbbf24', 
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
        <div className="sidebar-footer" style={{ padding: '12px 16px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
            {user?.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt="Avatar" 
                referrerPolicy="no-referrer"
                style={{ width: '34px', height: '34px', borderRadius: '50%', border: '2px solid rgba(251,191,36,0.4)', flexShrink: 0 }} 
              />
            ) : (
              <div className="avatar" style={{ margin: 0, width: '34px', height: '34px', fontSize: '12px', flexShrink: 0 }}>{(user?.fullName || 'PT').substring(0, 2).toUpperCase()}</div>
            )}
            <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.fullName}</div>
              <div style={{ fontSize: '10px', color: '#fbbf24', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{user?.role}</div>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            style={{ 
              width: '100%', 
              fontSize: '13px', 
              padding: '10px', 
              background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.1))', 
              color: '#fbbf24', 
              border: '1px solid rgba(245,158,11,0.3)', 
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
            onMouseEnter={e => { e.currentTarget.style.background='linear-gradient(135deg, rgba(245,158,11,0.25), rgba(217,119,6,0.2))'; e.currentTarget.style.borderColor='rgba(245,158,11,0.55)'; e.currentTarget.style.boxShadow='0 4px 15px rgba(245,158,11,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.background='linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.1))'; e.currentTarget.style.borderColor='rgba(245,158,11,0.3)'; e.currentTarget.style.boxShadow='none'; }}
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
            {activeTab === 'orders' && 'Danh Sách Đơn Hàng Shopee'}
            {activeTab === 'payouts' && 'Danh Sách Yêu Cầu Rút Tiền'}
          </h1>
          <div className="admin-profile">
            <span className="admin-name">{user?.fullName || 'Admin'}</span>
            {user?.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt="Avatar" 
                referrerPolicy="no-referrer"
                style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)' }} 
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
                background: 'rgba(245, 158, 11, 0.1)',
                color: '#fbbf24',
                border: '1px solid rgba(245, 158, 11, 0.25)',
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
                      <span className="stat-val" style={{ color: stats.pendingPayoutsCount > 0 ? '#fbbf24' : 'inherit' }}>
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
                      <h2 className="card-title">🚨 Yêu Cầu Rút Tiền Chờ Duyệt Gần Đây</h2>
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
                            <tr>
                              <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                                🎉 Không có yêu cầu rút tiền nào đang chờ duyệt!
                              </td>
                            </tr>
                          ) : (
                            payouts.filter(p => p.status === 'PENDING').slice(0, 5).map(p => {
                              const user = users.find(u => u.zaloId === p.zaloId);
                              const bankAndAcc = getBankAndAccount(p);
                              return (
                                <tr key={p.id}>
                                  <td><strong>PT_{p.id}</strong></td>
                                  <td>{user ? user.zaloName : p.zaloId}</td>
                                  <td>{bankAndAcc.bankName || 'Chưa cấu hình'}</td>
                                  <td><code>{bankAndAcc.accountNumber || 'Chưa cấu hình'}</code></td>
                                  <td style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>{formatMoney(p.amount)}</td>
                                  <td>{formatDateTime(p.createdAt)}</td>
                                  <td>
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
                          <th style={{ width: '110px' }}>Zalo ID</th>
                          <th style={{ width: '130px' }}>Tên thành viên</th>
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
                          <tr>
                            <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                              Không tìm thấy thành viên phù hợp
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map(u => {
                            const bankAndAcc = getBankAndAccount(u);
                            return (
                              <tr key={u.zaloId}>
                                <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  <code style={{ color: 'var(--text-muted)', fontSize: '11.5px' }} title={u.zaloId}>{u.zaloId}</code>
                                </td>
                                <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  <strong title={u.zaloName}>{u.zaloName || 'Vô danh (Chờ đồng bộ)'}</strong>
                                </td>
                                <td>
                                  <div style={{ fontSize: '13px', fontWeight: '500' }}>{bankAndAcc.bankName || '⚠️ Chưa cập nhật'}</div>
                                  {bankAndAcc.accountNumber && <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}><code>{bankAndAcc.accountNumber}</code></div>}
                                </td>
                                <td style={{ color: 'var(--color-warning)', textAlign: 'right', fontWeight: '500' }}>
                                  {formatMoney(u.wallet?.pendingCommission)}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Gốc: {formatMoney(u.wallet?.completedCommission)}</div>
                                  <div style={{ fontSize: '11.5px', color: 'var(--color-warning)', marginTop: '2px' }}>Sau thuế: {formatMoney((u.wallet?.completedCommission || 0) * 0.9)}</div>
                                  <div style={{ fontSize: '11.5px', color: 'var(--color-success)', marginTop: '2px', fontWeight: '600' }}>Khách: {formatMoney((u.wallet?.completedCommission || 0) * 0.9 * 0.8)}</div>
                                </td>
                                <td style={{ color: 'var(--color-success)', fontWeight: '700', textAlign: 'right' }}>
                                  {formatMoney(u.wallet?.withdrawableCommission)}
                                </td>
                                <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                                  {formatMoney(u.wallet?.receivedCommission)}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <button
                                    className="btn"
                                    onClick={() => setSelectedUser(u)}
                                    style={{ padding: '4px 8px', fontSize: '12px' }}
                                  >
                                    👁 Xem
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
              {activeTab === 'orders' && (
                <div className="data-card">
                  {/* Upload file import */}
                  <div style={{ padding: '16px 0 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '20px' }}>
                    <h3 style={{ marginBottom: '12px', fontSize: '15px' }}>📥 Import báo cáo đối soát Shopee (CSV/Excel)</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={(e) => { setImportFile(e.target.files[0]); setImportResult(null); }}
                        style={{ color: 'var(--text-muted)', fontSize: '13px' }}
                      />
                      <button
                        className="btn btn-success"
                        onClick={handleImportFile}
                        disabled={!importFile || importLoading}
                        style={{ minWidth: '120px' }}
                      >
                        {importLoading ? '⏳ Đang import...' : '⬆️ Import'}
                      </button>
                      {importFile && <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{importFile.name}</span>}
                    </div>
                    {importResult && (
                      <div style={{
                        marginTop: '10px',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        background: importResult.success ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                        border: `1px solid ${importResult.success ? 'var(--color-success)' : 'var(--color-danger)'}`,
                        color: importResult.success ? 'var(--color-success)' : 'var(--color-danger)'
                      }}>
                        {importResult.success ? '✅ ' : '❌ '}{importResult.message}
                      </div>
                    )}
                  </div>

                  <div className="search-container">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Tìm kiếm đơn hàng (ID/Sản phẩm/Zalo ID)..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                    />
                  </div>

                  <div className="table-container">
                    <table style={{ tableLayout: 'fixed', width: '100%' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '135px' }}>Mã đơn hàng</th>
                          <th style={{ width: '240px' }}>Tên sản phẩm</th>
                          <th style={{ width: '160px' }}>Thành viên / Zalo ID</th>
                          <th style={{ width: '140px', textAlign: 'right' }}>Tích lũy hoa hồng</th>
                          <th style={{ width: '145px' }}>Thời gian</th>
                          <th style={{ width: '100px', textAlign: 'center' }}>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.length === 0 ? (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                              Không tìm thấy đơn hàng nào
                            </td>
                          </tr>
                        ) : (
                          filteredOrders.map(o => {
                            const orderUser = users.find(u => u.zaloId === o.zaloId);
                            const afterTax = (o.commission || 0) * 0.9;
                            const afterDeduction = afterTax * 0.8;
                            return (
                              <tr key={o.id}>
                                <td>
                                  <code style={{ fontWeight: 'bold', fontSize: '12.5px', color: '#fff' }}>{o.orderId}</code>
                                </td>
                                <td title={o.productName} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {o.productName}
                                </td>
                                <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  <div style={{ fontWeight: '600', fontSize: '13.5px' }} title={orderUser ? orderUser.zaloName : (o.zaloId || 'UNKNOWN')}>
                                    {orderUser ? orderUser.zaloName : <code style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{o.zaloId || 'UNKNOWN'}</code>}
                                  </div>
                                  <div style={{ marginTop: '4px' }}>
                                    <code style={{ fontSize: '11.5px', color: 'var(--color-primary)' }} title={o.subId}>{o.subId || '-'}</code>
                                  </div>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Gốc: {formatMoney(o.commission)}</div>
                                  <div style={{ fontSize: '11.5px', color: 'var(--color-warning)', marginTop: '2px' }}>Sau thuế: {formatMoney(afterTax)}</div>
                                  <div style={{ fontSize: '11.5px', color: 'var(--color-success)', marginTop: '2px', fontWeight: '600' }}>Khách: {formatMoney(afterDeduction)}</div>
                                </td>
                                <td>
                                  <div style={{ fontSize: '12px' }} title={`Đặt mua: ${formatDateTime(o.purchaseTime)}`}>Đặt: {formatDateTime(o.purchaseTime)}</div>
                                  {o.completeTime && (
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }} title={`Hoàn thành: ${formatDateTime(o.completeTime)}`}>
                                      Xong: {formatDateTime(o.completeTime)}
                                    </div>
                                  )}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <span className={`badge ${
                                    o.status === 'Hoàn thành' ? 'badge-completed' :
                                    o.status === 'Đã hủy' ? 'badge-cancelled' : 'badge-pending'
                                  }`} style={{ fontSize: '11px', padding: '3px 8px' }}>
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
              )}

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
                          <tr>
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
                                <td><strong>PT_{p.id}</strong></td>
                                <td>{user ? user.zaloName : p.zaloId}</td>
                                <td>{bankAndAcc.bankName || 'Chưa cấu hình'}</td>
                                <td style={{ fontSize: '13px' }}><code>{bankAndAcc.accountNumber || 'Chưa cấu hình'}</code></td>
                                <td style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>{formatMoney(p.amount)}</td>
                                <td>{formatDateTime(p.createdAt)}</td>
                                <td>{formatDateTime(p.completedAt)}</td>
                                <td>
                                  <span className={`badge ${
                                    p.status === 'COMPLETED' ? 'badge-completed' : 'badge-pending'
                                  }`}>
                                    {p.status === 'COMPLETED' ? 'Đã thanh toán' : 'Chờ duyệt'}
                                  </span>
                                </td>
                                <td>
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
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có đơn hàng nào.</td>
                      </tr>
                    ) : (
                      orders.filter(o => o.zaloId === selectedUser.zaloId).slice(0, 10).map(o => {
                        const afterTax = (o.commission || 0) * 0.9;
                        const afterDeduction = afterTax * 0.8;
                        return (
                          <tr key={o.id}>
                            <td style={{ fontSize: '11px' }}>{o.orderId}</td>
                            <td style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.productName}</td>
                            <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{formatMoney(o.commission)}</td>
                            <td style={{ color: 'var(--color-warning)', fontSize: '12px' }}>{formatMoney(afterTax)}</td>
                            <td style={{ color: 'var(--color-success)', fontWeight: '700', fontSize: '12px' }}>{formatMoney(afterDeduction)}</td>
                            <td>
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
    </div>
  );
}

export default App;
