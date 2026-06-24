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
  const [view, setView] = useState(() => sessionStorage.getItem('adminView') || 'home'); // 'home' or 'admin'
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
          setView('home');
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
        setView('home');
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
    } catch (err) {
      console.error(">>> [handleGoogleLoginSuccess] error:", err);
      setLoginError(err.message);
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
    } catch (err) {
      console.error(">>> [handleLocalLogin] error:", err);
      setLoginError(err.message);
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
    if (val === undefined || val === null) return '0đ';
    return new Intl.NumberFormat('vi-VN').format(val) + 'đ';
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
      alert('Đã phê duyệt giao dịch thành công!');
      fetchData(token, user); // Refresh data
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
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
      setImportFile(null);
      fetchData(token, user); // Refresh toàn bộ data
    } catch (err) {
      setImportResult({ success: false, message: err.message });
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

  if (view === 'home') {
    const isAdmin = user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN');
    
    return (
      <div className="landing-page">
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
            <a href="#steps" className="btn btn-glow" style={{ padding: '12px 30px', textDecoration: 'none', display: 'inline-block', borderRadius: '8px' }}>
              Bắt đầu ngay
            </a>
            <a href="#features" className="btn" style={{ padding: '12px 30px', border: '1px solid rgba(255,255,255,0.1)', textDecoration: 'none', display: 'inline-block', borderRadius: '8px' }}>
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
                  alert("Để đăng ký và sở hữu Bot, vui lòng liên hệ trực tiếp Zalo: 0888728256 (Phạm Thắng) để được hỗ trợ cấu hình và kích hoạt nhanh nhất!");
                  window.open("https://zalo.me/0888728256", "_blank");
                }}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '15px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', background: 'transparent', color: '#fff' }}
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
                  alert("Để đăng ký và sở hữu Bot, vui lòng liên hệ trực tiếp Zalo: 0888728256 (Phạm Thắng) để được hỗ trợ cấu hình và kích hoạt nhanh nhất!");
                  window.open("https://zalo.me/0888728256", "_blank");
                }}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '15px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                🚀 Mua Ngay
              </button>
            </div>

            {/* Gói Pro ... */}
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
                  alert("Để đăng ký và sở hữu Bot, vui lòng liên hệ trực tiếp Zalo: 0888728256 (Phạm Thắng) để được hỗ trợ cấu hình và kích hoạt nhanh nhất!");
                  window.open("https://zalo.me/0888728256", "_blank");
                }}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '15px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', background: 'transparent', color: '#fff' }}
              >
                Liên Hệ Ngay
              </button>
            </div>

          </div>
        </section>

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
                
                {loginError && <div className="error-alert" style={{ marginBottom: '16px' }}>⚠️ {loginError}</div>}
                
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
                      height: '40px', 
                      margin: '16px auto 0' 
                    }}>
                      {/* Our custom premium gradient button */}
                      <button 
                        className="btn-google-custom" 
                        onClick={isMobile ? handleGoogleLoginMobile : undefined}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(135deg, #f97316, #ec4899, #8b5cf6)',
                          backgroundSize: '200% auto',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '10px',
                          boxShadow: '0 4px 15px rgba(236, 72, 153, 0.35)',
                          cursor: 'pointer',
                          pointerEvents: isMobile ? 'auto' : 'none',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 18 18">
                          <path fill="#fff" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.8 2.71v2.24h2.91c1.7-1.56 2.69-3.87 2.69-6.58z"/>
                          <path fill="#fff" d="M9 18c2.43 0 4.47-.8 5.96-2.22l-2.91-2.24c-.8.54-1.84.87-3.05.87-2.35 0-4.33-1.58-5.04-3.71H.95v2.3C2.43 15.98 5.48 18 9 18z"/>
                          <path fill="#fff" d="M3.96 10.7c-.18-.54-.28-1.12-.28-1.7s.1-1.16.28-1.7V5.01H.95C.34 6.22 0 7.58 0 9s.34 2.78.95 3.99l3.01-2.29z"/>
                          <path fill="#fff" d="M9 3.58c1.32 0 2.5.45 3.44 1.35L15 2.4C13.46.97 11.43 0 9 0 5.48 0 2.43 2.02.95 5.01l3.01 2.29c.71-2.13 2.69-3.71 5.04-3.71z"/>
                        </svg>
                        Đăng nhập bằng Google
                      </button>
                      
                      {/* The invisible official Google button container (only active on desktop) */}
                      {!isMobile && (
                        <div id="google-signin-btn" style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          opacity: 0.01,
                          cursor: 'pointer',
                          zIndex: 10
                        }}></div>
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
