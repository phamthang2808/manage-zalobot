import React, { useState, useEffect } from 'react';

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
    return sessionStorage.getItem('adminView') || 'home';
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Public Lookup States
  const [lookupSearchType, setLookupSearchType] = useState('ZALO_ID');
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

  // Check active session on startup
  useEffect(() => {
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
            setIsLoginModalOpen(true);
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
            setIsLoginModalOpen(false);
            
            // Clean hash from URL without reloading the page
            window.history.replaceState(null, null, window.location.pathname + window.location.search);
          }
        }
      } catch (err) {
        console.error(">>> [Google Redirect Flow] Error:", err);
        setLoginError(err.message);
        setIsLoginModalOpen(true);
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
    if (!isLoginModalOpen || token) return;

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
                theme: 'dark', 
                size: 'large', 
                width: calculatedWidth,
                shape: 'rectangular'
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
  }, [isLoginModalOpen, token]);

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
      setLookupQuery(targetQuery.trim());
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

      // Save to recent search history
      setLookupRecentSearches(prev => {
        const item = { query: q.trim(), searchType: type };
        const filtered = prev.filter(x => !(x.query.toLowerCase() === item.query.toLowerCase() && x.searchType === item.searchType));
        const updated = [item, ...filtered].slice(0, 5);
        localStorage.setItem('recentLookups', JSON.stringify(updated));
        return updated;
      });

    } catch (err) {
      console.error(err);
      setLookupError(err.message);
      showToast(err.message, 'error');
    } finally {
      setLookupLoading(false);
    }
  };

  const sendOtpToUser = async (action) => {
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
        setLookupQuery(urlQuery);
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
      setIsLoginModalOpen(false);
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
      setIsLoginModalOpen(false);
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
    sessionStorage.removeItem('adminTab');
    sessionStorage.removeItem('adminUser');
    sessionStorage.removeItem('adminToken');
    setIsLoginModalOpen(false);
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
    <div style={{
      position: 'fixed',
      top: '24px',
      right: '24px',
      zIndex: 9999999,
      minWidth: '310px',
      maxWidth: '400px',
      background: 'linear-gradient(135deg, rgba(23, 19, 55, 0.96), rgba(10, 8, 29, 0.98))',
      border: `1px solid ${toast.type === 'success' ? 'rgba(52, 211, 153, 0.6)' : (toast.type === 'error' ? 'rgba(248, 113, 113, 0.6)' : 'rgba(139, 92, 246, 0.6)')}`,
      borderRadius: '16px',
      boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.85), 0 0 35px rgba(139, 92, 246, 0.25)',
      padding: '16px 20px',
      backdropFilter: 'blur(16px)',
      animation: 'toastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '14px',
      overflow: 'hidden'
    }}>
      {/* Icon */}
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        background: toast.type === 'success' ? 'rgba(52, 211, 153, 0.15)' : (toast.type === 'error' ? 'rgba(248, 113, 113, 0.15)' : 'rgba(139, 92, 246, 0.15)'),
        border: `1px solid ${toast.type === 'success' ? 'rgba(52, 211, 153, 0.4)' : (toast.type === 'error' ? 'rgba(248, 113, 113, 0.4)' : 'rgba(139, 92, 246, 0.4)')}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        flexShrink: 0
      }}>
        {toast.type === 'success' ? '🎉' : (toast.type === 'error' ? '⚠️' : '💡')}
      </div>

      {/* Content */}
      <div style={{ flex: 1, textAlign: 'left', paddingRight: '10px' }}>
        <div style={{ fontSize: '14.5px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>
          {toast.type === 'success' ? 'Thành công!' : (toast.type === 'error' ? 'Có lỗi xảy ra!' : 'Thông báo')}
        </div>
        <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.4' }}>
          {toast.message}
        </div>
      </div>

      {/* Close Button */}
      <button
        onClick={() => setToast(null)}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#94a3b8',
          fontSize: '18px',
          cursor: 'pointer',
          padding: '2px',
          lineHeight: 1
        }}
      >
        &times;
      </button>
      {/* Progress Bar (Viền chạy chạy dưới đáy tự tắt sau 4s) */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: '3px',
        background: toast.type === 'success' ? 'linear-gradient(90deg, #34d399, #10b981)' : (toast.type === 'error' ? 'linear-gradient(90deg, #f87171, #ef4444)' : 'linear-gradient(90deg, #a78bfa, #38bdf8)'),
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
            background: linear-gradient(135deg, #0f0c29 0%, #1a1040 25%, #24243e 50%, #1b1145 75%, #0f0c29 100%);
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
            background: radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, rgba(59, 130, 246, 0.1) 40%, transparent 70%);
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
            background: radial-gradient(circle, rgba(236, 72, 153, 0.2) 0%, rgba(249, 115, 22, 0.08) 40%, transparent 70%);
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
            background: linear-gradient(135deg, #FB923C, #F97316);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
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
            border-color: #38bdf8;
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
            background: linear-gradient(135deg, #ec4899, #8b5cf6);
            color: #fff;
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.25);
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
            border-color: #38bdf8;
            background: rgba(255, 255, 255, 0.05);
            box-shadow: 0 0 12px rgba(56, 189, 248, 0.15);
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
            background: linear-gradient(135deg, #f97316, #ec4899, #8b5cf6);
            background-size: 200% auto;
            color: #fff;
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
            box-shadow: 0 4px 15px rgba(236, 72, 153, 0.35);
          }
          .lookup-btn:hover {
            background-position: right center;
            box-shadow: 0 6px 20px rgba(236, 72, 153, 0.5), 0 0 12px rgba(139, 92, 246, 0.3);
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
            border-color: #38bdf8;
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
            background: linear-gradient(135deg, #0f172a 0%, #1c1917 100%);
            border-color: #38bdf8;
          }
          .stat-card-item.received {
            background: linear-gradient(135deg, #1e1b4b 0%, #1c1917 100%);
            border-color: #4f46e5;
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
            box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(56, 189, 248, 0.2);
            border: 2px solid rgba(56, 189, 248, 0.25);
            animation: banner-float 4s ease-in-out infinite;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          .lookup-banner-img-wrap:hover {
            transform: scale(1.03) translateY(-4px);
            box-shadow: 0 12px 40px rgba(0,0,0,0.6), 0 0 30px rgba(56, 189, 248, 0.35);
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
            <span>28Symues Affiliate</span>
          </div>
          <button 
            className="lookup-admin-link" 
            onClick={() => {
              setView('home');
              sessionStorage.setItem('adminView', 'home');
              window.location.hash = '';
            }}
          >
            🏠 Về Trang Chủ
          </button>
        </header>

        {/* Search Panel Card */}
        <div className="lookup-card">
          <h2 className="lookup-title">🔍 Tra Cứu Đơn Hàng & Ví Tiền</h2>
          <p className="lookup-subtitle">Nhập thông tin cá nhân để tra cứu hoa hồng và trạng thái đơn</p>

          <div className="lookup-tabs">
            <button 
              className={`lookup-tab ${lookupSearchType === 'ZALO_ID' ? 'active' : ''}`}
              onClick={() => setLookupSearchType('ZALO_ID')}
            >
              🔑 Zalo ID
            </button>
            <button 
              className={`lookup-tab ${lookupSearchType === 'ORDER_ID' ? 'active' : ''}`}
              onClick={() => setLookupSearchType('ORDER_ID')}
            >
              🛒 Mã Đơn Hàng
            </button>
          </div>

          <div className="lookup-input-group">
            <label className="lookup-label">
              {lookupSearchType === 'ZALO_ID' ? 'Nhập Zalo ID của sếp' : 'Nhập mã đơn hàng (Shopee)'}
            </label>
            <input 
              type="text"
              className="lookup-input"
              value={lookupQuery}
              onChange={(e) => setLookupQuery(e.target.value)}
              placeholder={lookupSearchType === 'ZALO_ID' ? 'Ví dụ: 5128074989288259190...' : 'Ví dụ: 260606C8W7YARK...'}
              onKeyDown={(e) => e.key === 'Enter' && handlePublicLookup()}
            />
          </div>

          <div className="lookup-date-grid">
            <div className="lookup-input-group" style={{ marginBottom: 0 }}>
              <label className="lookup-label">Từ Ngày</label>
              <input 
                type="date"
                className="lookup-input"
                value={lookupStartDate}
                onChange={(e) => setLookupStartDate(e.target.value)}
              />
            </div>
            <div className="lookup-input-group" style={{ marginBottom: 0 }}>
              <label className="lookup-label">Đến Ngày</label>
              <input 
                type="date"
                className="lookup-input"
                value={lookupEndDate}
                onChange={(e) => setLookupEndDate(e.target.value)}
              />
            </div>
          </div>

          <button 
            className="lookup-btn"
            onClick={() => handlePublicLookup()}
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
          {lookupRecentSearches.length > 0 && (
            <div className="recent-searches">
              <span>Lịch sử:</span>
              {lookupRecentSearches.map((item, idx) => (
                <div 
                  key={idx} 
                  className="recent-tag"
                  onClick={() => {
                    setLookupQuery(item.query);
                    setLookupSearchType(item.searchType);
                    handlePublicLookup(item.query, item.searchType);
                  }}
                >
                  <span>{(item.searchType === 'ZALO_ID' || item.searchType === 'token') ? '🔑' : (item.searchType === 'NAME' ? '👤' : '🛒')} {item.query.length > 15 ? item.query.substring(0, 15) + '...' : item.query}</span>
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
              <h3 className="stats-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0 }}>
                <span>🏦 Thông Tin Ngân Hàng Nhận Tiền</span>
                {!isEditingBank && (
                  <button 
                    className="lookup-admin-link" 
                    style={{ fontSize: '12px', padding: '4px 10px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}
                    onClick={() => {
                      setEditBankName(lookupResult.bankName || '');
                      setEditAccountNumber(lookupResult.accountNumber || '');
                      setBankSaveError('');
                      setIsEditingBank(true);
                    }}
                  >
                    ✏️ {lookupResult.bankName ? 'Sửa' : 'Cài đặt'}
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
                💰 Thống Kê Hoa Hồng của: <span style={{ color: '#38bdf8' }}>{lookupResult.zaloName}</span>
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
                  <span style={{ fontSize: '11px', color: '#38bdf8', marginBottom: '4px' }}>Sau 3 ngày • Đã trừ thuế & chia 8-2</span>
                  <span className="stat-card-value" style={{ color: '#38bdf8' }}>{formatMoney(lookupResult.wallet.withdrawableCommission)}</span>
                </div>
                <div className="stat-card-item received">
                  <span className="stat-card-label">Đã nhận (Đã thanh toán)</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Tổng tiền đã rút về tài khoản</span>
                  <span className="stat-card-value" style={{ color: '#818cf8' }}>{formatMoney(lookupResult.wallet.receivedCommission)}</span>
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
                        style={{ position: 'absolute', right: '8px', fontSize: '11px', padding: '4px 8px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.2)' }}
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

            {/* 2. Orders Cards List */}
            <div className="orders-container">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '10px', marginBottom: '16px', width: '100%' }}>
                <h3 className="stats-section-title" style={{ marginBottom: 0, width: '100%', fontSize: '16px', fontWeight: '700', color: '#fff' }}>
                  🛒 Đơn hàng đã tìm thấy ({searchedOrders.length})
                </h3>
                <input 
                  type="text" 
                  placeholder="Lọc nhanh đơn hàng..." 
                  className="lookup-input"
                  style={{ width: '100%', maxWidth: '100%', padding: '8px 12px', fontSize: '13px', borderRadius: '8px', margin: 0 }}
                  value={lookupLocalFilter}
                  onChange={(e) => setLookupLocalFilter(e.target.value)}
                />
              </div>

              {searchedOrders.length === 0 ? (
                <div className="lookup-card" style={{ padding: '24px', textAlign: 'center', color: '#a8a29e' }}>
                  📭 Không tìm thấy đơn hàng nào khớp điều kiện lọc.
                </div>
              ) : (
                searchedOrders.map((o) => (
                  <div key={o.id} className="order-card-item">
                    <div className="order-card-header">
                      <span>📅 {formatDateTime(o.purchaseTime)}</span>
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
              border: '1px solid rgba(139, 92, 246, 0.45)',
              borderRadius: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 45px rgba(139, 92, 246, 0.22)',
              background: 'linear-gradient(145deg, #130f37, #0a081d)',
              padding: '32px 24px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Glowing Lock Badge */}
              <div style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(56, 189, 248, 0.25))',
                border: '1px solid rgba(139, 92, 246, 0.5)',
                boxShadow: '0 0 25px rgba(139, 92, 246, 0.35)',
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
                Mã xác thực 6 số vừa được gửi đến <span style={{ color: '#38bdf8', fontWeight: '600' }}>tin nhắn riêng Zalo</span> của bạn.
              </p>

              {/* Alert Info Box thay cho văn bản có emoji dễ lỗi */}
              <div style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.22)',
                borderRadius: '12px',
                padding: '10px 12px',
                fontSize: '12.5px',
                color: '#7dd3fc',
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
                    border: '1.5px solid rgba(139, 92, 246, 0.5)',
                    background: 'rgba(0, 0, 0, 0.5)',
                    color: '#38bdf8',
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
                  style={{ flex: 1.4, padding: '13px', borderRadius: '12px', fontSize: '14.5px', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 6px 20px rgba(139, 92, 246, 0.4)', transition: 'all 0.2s' }}
                >
                  {(bankSaveLoading || payoutSaveLoading) ? 'Đang kiểm tra...' : 'Xác nhận ngay'}
                </button>
              </div>

              {/* Pill Button Gửi lại mã OTP - Dùng SVG thay thế emoji để không bao giờ bị lỗi font ô vuông */}
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '18px' }}>
                <button
                  onClick={() => sendOtpToUser(otpActionType)}
                  disabled={otpSending}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    borderRadius: '20px',
                    padding: '8px 18px',
                    color: '#e2e8f0',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
                  {otpSending ? 'Đang gửi lại...' : 'Gửi lại mã OTP (Miễn phí)'}
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
            <span>28Symues Affiliate</span>
          </div>
          <nav className={`landing-nav${mobileMenuOpen ? ' open' : ''}`}>
            <a href="#home" onClick={() => setMobileMenuOpen(false)}>Trang chủ</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Tính năng</a>
            <a href="#steps" onClick={() => setMobileMenuOpen(false)}>Hướng dẫn</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Bảng giá</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setView('lookup'); window.history.pushState({}, '', '/?view=lookup'); setMobileMenuOpen(false); }} style={{ color: '#38bdf8', fontWeight: '700' }}>🔍 Tra cứu đơn hàng</a>
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
                    <button className="btn btn-glow" onClick={() => { setView('admin'); sessionStorage.setItem('adminView','admin'); setMobileMenuOpen(false); }}>
                      ⚙️ Trang Quản Trị
                    </button>
                  )}
                  <button className="btn" onClick={() => { handleLogout(); setMobileMenuOpen(false); }} style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                    Đăng xuất
                  </button>
                </>
              ) : (
                <button className="btn btn-glow" onClick={() => {
                  setLoginError('');
                  setIsLoginModalOpen(true);
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
                  <button className="btn btn-glow" onClick={() => { setView('admin'); sessionStorage.setItem('adminView','admin'); }}>
                    ⚙️ Trang Quản Trị
                  </button>
                )}
                
                <button className="btn" onClick={handleLogout} style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                  Đăng xuất
                </button>
              </div>
            ) : (
              <button className="btn btn-glow" onClick={() => {
                setLoginError('');
                setIsLoginModalOpen(true);
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
          <div className="hero-badge">🤖 HỆ THỐNG AUTOMATION AFFILIATE</div>
          <h1 className="hero-title">Tự Động Hóa Shopee Affiliate<br />Với 28Symues</h1>
          <p className="hero-subtitle">
            Biến mọi liên kết mua sắm trong nhóm chat Zalo của bạn thành nguồn thu nhập thụ động chỉ trong vài giây. Tiện lợi, tự động và hoàn toàn minh bạch.
          </p>
          <div className="hero-buttons">
            <a href="#steps" className="btn btn-hero-1">
              Bắt đầu ngay
            </a>
            <button onClick={() => { setView('lookup'); window.history.pushState({}, '', '/?view=lookup'); }} className="btn btn-hero-2">
              🔍 Tra cứu đơn hàng
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
              <div className="feature-icon">🔗</div>
              <h3 className="feature-title">Chuyển Đổi Link Tự Động</h3>
              <p className="feature-desc">
                Tự động nhận diện link Shopee, Lazada, TikTok Shop và chuyển đổi thành link affiliate có gắn Zalo ID của người gửi làm sub_id.
              </p>
            </div>
            <div className="feature-card success">
              <div className="feature-icon">💬</div>
              <h3 className="feature-title">Tương Tác Bằng AI</h3>
              <p className="feature-desc">
                Sử dụng mô hình AI GPT-4o để tự động soạn thảo lời phản hồi vui nhộn, hấp dẫn, nâng cao tỷ lệ nhấn click mua sản phẩm.
              </p>
            </div>
            <div className="feature-card warning">
              <div className="feature-icon">📊</div>
              <h3 className="feature-title">Thống Kê Chi Tiết</h3>
              <p className="feature-desc">
                Theo dõi đầy đủ lịch sử đơn hàng đã mua, phần trăm hoa hồng tạm tính và doanh số rút tiền của từng thành viên trong hệ thống.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💳</div>
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
                <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px', marginBottom: '24px' }}>Bản tiêu chuẩn chuyển đổi link cơ bản</p>
                
                <div style={{ marginBottom: '32px' }}>
                  <span style={{ fontSize: '42px', fontWeight: '800', color: '#fff', fontFamily: 'var(--font-heading)' }}>199.000đ</span>
                  <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '15px' }}> / tháng</span>
                </div>
                
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                    <span style={{ color: '#34d399', fontWeight: 'bold' }}>✓</span> Tự động nhận diện và chuyển đổi link Shopee, Lazada, TikTok Shop
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                    <span style={{ color: '#34d399', fontWeight: 'bold' }}>✓</span> Gắn mã SubID theo Zalo ID người gửi
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                    <span style={{ color: '#34d399', fontWeight: 'bold' }}>✓</span> Chatbot phản hồi tự động trong nhóm chat 24/7
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                    <span style={{ color: '#34d399', fontWeight: 'bold' }}>✓</span> Cấu hình mẫu tin nhắn phản hồi cơ bản
                  </li>
                </ul>
              </div>
              
              <button 
                className="btn" 
                onClick={() => {
                  showToast("Để đăng ký và sở hữu Bot, vui lòng liên hệ Zalo: 0888728256 (Phạm Thắng)!", 'info');
                  window.open("https://zalo.me/0888728256", "_blank");
                }}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '15px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', background: 'transparent', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                Liên Hệ Ngay
              </button>
            </div>

            {/* Gói Pro - Phổ biến nhất */}
            <div className="pricing-card" style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '24px',
              padding: '40px 32px',
              width: '100%',
              maxWidth: '360px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 20px 40px -15px rgba(139, 92, 246, 0.25)',
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
                background: 'linear-gradient(135deg, #f97316, #ec4899)',
                color: '#fff',
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
                <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px', marginBottom: '24px' }}>Như bản thương mại, có thêm Web quản lý đối soát riêng</p>
                
                <div style={{ marginBottom: '32px' }}>
                  <span style={{ fontSize: '42px', fontWeight: '800', color: '#fff', fontFamily: 'var(--font-heading)' }}>299.000đ</span>
                  <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '15px' }}> / tháng</span>
                </div>
                
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                    <span style={{ color: '#34d399', fontWeight: 'bold' }}>✓</span> Tự động chuyển đổi link Shopee, Lazada, TikTok Shop
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                    <span style={{ color: '#34d399', fontWeight: 'bold' }}>✓</span> Tương tác phản hồi tự động bằng AI GPT-4o
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                    <span style={{ color: '#34d399', fontWeight: 'bold' }}>✓</span> **Có giao diện Web quản lý & đối soát hoa hồng riêng**
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                    <span style={{ color: '#34d399', fontWeight: 'bold' }}>✓</span> Lọc trùng đơn hàng, tự động dịch SubID không dấu sang tên Zalo gốc
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                    <span style={{ color: '#34d399', fontWeight: 'bold' }}>✓</span> Đánh dấu thanh toán và thống kê hoa hồng real-time
                  </li>
                </ul>
              </div>
              
              <button 
                className="btn btn-glow" 
                onClick={() => {
                  showToast("Để đăng ký và sở hữu Bot, vui lòng liên hệ Zalo: 0888728256 (Phạm Thắng)!", 'info');
                  window.open("https://zalo.me/0888728256", "_blank");
                }}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '15px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                🚀 Mua Ngay
              </button>
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
                <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px', marginBottom: '24px' }}>Bản cao cấp đầy đủ tính năng, hiệu năng tối ưu nhất</p>
                
                <div style={{ marginBottom: '32px' }}>
                  <span style={{ fontSize: '42px', fontWeight: '800', color: '#fff', fontFamily: 'var(--font-heading)' }}>499.000đ</span>
                  <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '15px' }}> / tháng</span>
                </div>
                
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                    <span style={{ color: '#34d399', fontWeight: 'bold' }}>✓</span> Đầy đủ tính năng của bản Pro
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                    <span style={{ color: '#34d399', fontWeight: 'bold' }}>✓</span> Tương thích 100% với hệ thống Zalo Bot chính thức
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                    <span style={{ color: '#34d399', fontWeight: 'bold' }}>✓</span> Hạ tầng riêng biệt, tốc độ phản hồi nhanh chóng
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                    <span style={{ color: '#34d399', fontWeight: 'bold' }}>✓</span> Hệ thống ví thành viên, rút tiền tự động qua câu lệnh chat
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                    <span style={{ color: '#34d399', fontWeight: 'bold' }}>✓</span> Support ưu tiên, hỗ trợ kỹ thuật trực tiếp 24/7
                  </li>
                </ul>
              </div>
              
              <button 
                className="btn" 
                onClick={() => {
                  showToast("Để đăng ký và sở hữu Bot, vui lòng liên hệ Zalo: 0888728256 (Phạm Thắng)!", 'info');
                  window.open("https://zalo.me/0888728256", "_blank");
                }}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '15px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', background: 'transparent', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                Liên Hệ Ngay
              </button>
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
              boxShadow: '0 12px 40px rgba(0,0,0,0.6), 0 0 30px rgba(139, 92, 246, 0.35)',
              border: '2px solid rgba(139, 92, 246, 0.4)',
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
          <p>© 2026 28Symues Affiliate. Phát triển bằng sự tương tác thông minh và an toàn.</p>
        </footer>

        {/* LOGIN MODAL OVERLAY */}
        {isLoginModalOpen && (
          <div className="modal-overlay" onClick={() => setIsLoginModalOpen(false)}>
            <div className="login-modal-content" onClick={(e) => e.stopPropagation()}>
              <div style={{ padding: '32px' }}>
                <div className="login-modal-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src="/logo.jpg" alt="Logo" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                  <h2 className="login-modal-title">Đăng nhập</h2>
                  <button className="login-modal-close" onClick={() => setIsLoginModalOpen(false)} style={{ marginLeft: 'auto' }}>&times;</button>
                </div>
                
                <form onSubmit={handleLocalLogin}>
                  <div className="modal-form-group">
                    <label className="modal-form-label">Email</label>
                    <input 
                      type="email" 
                      className="modal-form-input" 
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                    />
                  </div>
                  <div className="modal-form-group">
                    <label className="modal-form-label">Mật khẩu</label>
                    <input 
                      type="password" 
                      className="modal-form-input" 
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="modal-login-btn" disabled={loginLoading}>
                    {loginLoading ? 'Đang xác thực...' : 'Đăng nhập'}
                  </button>
                </form>
                
                <div className="modal-divider">Hoặc</div>
                
                {(() => {
                  const calculatedWidth = Math.max(200, Math.min(336, windowWidth - 64));
                  const isMobile = windowWidth < 768;
                  
                  const handleGoogleLoginMobile = () => {
                    const clientId = '195858897824-4h5ffebs0djtuncmhod98o0ca495ju71.apps.googleusercontent.com';
                    // OAuth redirect URI must match origin (usually without trailing slash)
                    const redirectUri = window.location.origin;
                    const nonce = Math.random().toString(36).substring(2) + Date.now();
                    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=id_token&scope=openid%20profile%20email&nonce=${nonce}`;
                    window.location.href = url;
                  };

                  return (
                    <div className="modal-google-container" style={{ 
                      position: 'relative', 
                      width: `${calculatedWidth}px`, 
                      minHeight: '40px', 
                      margin: '16px auto 0' 
                    }}>
                      {/* Premium White Google Button matching official brand guidelines */}
                      <button 
                        className="btn-google-custom" 
                        onClick={isMobile ? handleGoogleLoginMobile : undefined}
                        style={{
                          position: 'relative',
                          width: '100%',
                          height: '42px',
                          background: '#ffffff',
                          color: '#1f2937',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '14.5px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '12px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                          cursor: 'pointer',
                          pointerEvents: isMobile ? 'auto' : 'none',
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
                      
                      {/* The invisible official Google button container (only active on desktop) */}
                      {!isMobile && (
                        <div id="google-signin-btn" style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '42px',
                          opacity: 0.01,
                          cursor: 'pointer',
                          zIndex: 10
                        }}></div>
                      )}

                      {/* Thông báo hướng dẫn trên mobile khi mở qua trình duyệt Zalo/Facebook */}
                      {isMobile && (
                        <div style={{
                          marginTop: '12px',
                          padding: '10px 12px',
                          background: 'rgba(234, 179, 8, 0.12)',
                          border: '1px dashed rgba(234, 179, 8, 0.35)',
                          borderRadius: '8px',
                          color: '#fde047',
                          fontSize: '11.5px',
                          lineHeight: '1.45',
                          textAlign: 'left'
                        }}>
                          💡 <b>Lỗi 403 trên Zalo?</b> Do Google bảo mật không cho đăng nhập trong ứng dụng chat. Vui lòng bấm dấu <b>[...]</b> ở góc trên bên phải màn hình ➔ Chọn <b>Mở bằng trình duyệt (Chrome/Safari)</b> để đăng nhập.
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
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
            <img src="/logo.jpg" alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
            <span>28Symues Admin</span>
          </div>
        </div>
        <ul className="sidebar-menu">
          <li 
            className="menu-item"
            onClick={() => { setView('home'); sessionStorage.removeItem('adminView'); setSidebarOpen(false); }}
            style={{ 
              background: 'rgba(56, 189, 248, 0.05)', 
              color: '#38BDF8', 
              fontWeight: '600', 
              borderLeft: '3px solid #38BDF8', 
              marginBottom: '8px' 
            }}
          >
            🏠 Về Trang Chủ
          </li>
          <li 
            className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setActiveTab('dashboard'); sessionStorage.setItem('adminTab','dashboard'); sessionStorage.setItem('adminView','admin'); setSidebarOpen(false); }}
          >
            📊 Tổng quan
          </li>
          <li 
            className={`menu-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => { setActiveTab('users'); sessionStorage.setItem('adminTab','users'); sessionStorage.setItem('adminView','admin'); setSidebarOpen(false); }}
          >
            👥 Thành viên
          </li>
          <li 
            className={`menu-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => { setActiveTab('orders'); sessionStorage.setItem('adminTab','orders'); sessionStorage.setItem('adminView','admin'); setSidebarOpen(false); }}
          >
            🛒 Đơn hàng
          </li>
          <li 
            className={`menu-item ${activeTab === 'payouts' ? 'active' : ''}`}
            onClick={() => { setActiveTab('payouts'); sessionStorage.setItem('adminTab','payouts'); sessionStorage.setItem('adminView','admin'); setSidebarOpen(false); }}
          >
            💳 Rút tiền {stats.pendingPayoutsCount > 0 && (
              <span style={{
                background: 'var(--color-danger)',
                color: '#fff',
                fontSize: '11px',
                padding: '2px 6px',
                borderRadius: '50%',
                fontWeight: 'bold',
                marginLeft: 'auto'
              }}>{stats.pendingPayoutsCount}</span>
            )}
          </li>
        </ul>

        {/* Sidebar Footer with Logged In User Info and Logout */}
        <div className="sidebar-footer" style={{ marginTop: 'auto', padding: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', gap: '8px' }}>
            {user?.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt="Avatar" 
                referrerPolicy="no-referrer"
                style={{ width: '32px', height: '32px', borderRadius: '50%' }} 
              />
            ) : (
              <div className="avatar" style={{ margin: 0, width: '32px', height: '32px', fontSize: '12px' }}>{(user?.fullName || 'PT').substring(0, 2).toUpperCase()}</div>
            )}
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>{user?.fullName}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user?.role}</div>
            </div>
          </div>
          <button className="btn btn-danger" onClick={handleLogout} style={{ width: '100%', fontSize: '13px', padding: '8px', background: 'var(--color-danger)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            🚪 Đăng xuất
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
            <button className="btn" onClick={() => fetchData(token, user)} style={{ marginLeft: '12px' }}>🔄 Làm mới</button>
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
                      <span className="stat-label">Tổng thành viên</span>
                      <span className="stat-val">{stats.totalMembers}</span>
                    </div>
                    <div className="stat-card success">
                      <span className="stat-label">Tổng đơn hàng</span>
                      <span className="stat-val">{stats.totalOrders}</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-label">Doanh thu hoa hồng Shopee</span>
                      <span className="stat-val">{formatMoney(stats.totalCommission)}</span>
                    </div>
                    <div className="stat-card warning">
                      <span className="stat-label">Chờ duyệt rút tiền</span>
                      <span className="stat-val" style={{ color: stats.pendingPayoutsCount > 0 ? 'var(--color-warning)' : 'inherit' }}>
                        {stats.pendingPayoutsCount}
                      </span>
                    </div>
                    <div className="stat-card">
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
                    <table>
                      <thead>
                        <tr>
                          <th>Zalo ID</th>
                          <th>Tên thành viên</th>
                          <th>Ngân hàng</th>
                          <th>Số tài khoản</th>
                          <th title="Đơn đang chờ Shopee đối soát">Chờ xử lý</th>
                          <th>Đã tích lũy (gốc)</th>
                          <th>Sau thuế</th>
                          <th>Thực nhận</th>
                          <th title="Số tiền có thể rút ngay (đơn hoàn thành quá 3 ngày, trừ đã yêu cầu rút)">Khả dụng rút</th>
                          <th>Đã rút</th>
                          <th>Chi tiết</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan="11" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                              Không tìm thấy thành viên phù hợp
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map(u => {
                            const bankAndAcc = getBankAndAccount(u);
                            return (
                              <tr key={u.zaloId}>
                                <td><code style={{ color: 'var(--text-muted)' }}>{u.zaloId}</code></td>
                                <td><strong>{u.zaloName || 'Vô danh (Chờ đồng bộ)'}</strong></td>
                                <td style={{ fontSize: '13px' }}>{bankAndAcc.bankName || '⚠️ Chưa cập nhật'}</td>
                                <td style={{ fontSize: '13px' }}><code>{bankAndAcc.accountNumber || '⚠️ Chưa cập nhật'}</code></td>
                                <td style={{ color: 'var(--color-warning)' }}>{formatMoney(u.wallet?.pendingCommission)}</td>
                                <td>{formatMoney(u.wallet?.completedCommission)}</td>
                                <td style={{ color: 'var(--color-warning)' }}>{formatMoney((u.wallet?.completedCommission || 0) * 0.9)}</td>
                                <td style={{ color: 'var(--color-success)' }}>{formatMoney((u.wallet?.completedCommission || 0) * 0.9 * 0.8)}</td>
                                <td style={{ color: 'var(--color-success)', fontWeight: '600' }}>{formatMoney(u.wallet?.withdrawableCommission)}</td>
                                <td>{formatMoney(u.wallet?.receivedCommission)}</td>
                                <td>
                                  <button
                                    className="btn"
                                    onClick={() => setSelectedUser(u)}
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
                    <table>
                      <thead>
                        <tr>
                          <th>Mã đơn hàng</th>
                          <th>Tên sản phẩm</th>
                          <th>Sub_id (Shopee)</th>
                          <th>Thành viên mua</th>
                          <th>HH Shopee (gốc)</th>
                          <th>Sau thuế</th>
                          <th>Thực nhận</th>
                          <th>Ngày mua</th>
                          <th>Ngày hoàn thành</th>
                          <th>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.length === 0 ? (
                          <tr>
                            <td colSpan="10" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
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
                                <td><code style={{ fontWeight: 'bold' }}>{o.orderId}</code></td>
                                <td title={o.productName} style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {o.productName}
                                </td>
                                <td><code style={{ fontSize: '12px', color: 'var(--color-primary)' }}>{o.subId || '-'}</code></td>
                                <td>{orderUser ? orderUser.zaloName : <code style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{o.zaloId || 'UNKNOWN'}</code>}</td>
                                <td style={{ color: 'var(--text-muted)', fontWeight: '500' }}>{formatMoney(o.commission)}</td>
                                <td style={{ color: 'var(--color-warning)', fontWeight: '600' }}>{formatMoney(afterTax)}</td>
                                <td style={{ color: 'var(--color-success)', fontWeight: '700' }}>{formatMoney(afterDeduction)}</td>
                                <td>{formatDateTime(o.purchaseTime)}</td>
                                <td>{formatDateTime(o.completeTime)}</td>
                                <td>
                                  <span className={`badge ${
                                    o.status === 'Hoàn thành' ? 'badge-completed' :
                                    o.status === 'Đã hủy' ? 'badge-cancelled' : 'badge-pending'
                                  }`}>
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
