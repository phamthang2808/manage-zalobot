import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import MobileBottomNav from '../common/MobileBottomNav';
import ToastNotification from '../common/ToastNotification';
import ThemeToggle from '../common/ThemeToggle';

export default function LoginView() {
  const { windowWidth, theme, toggleTheme, setView, showToast, API_URL_ROOT, setToken, setUser } = useApp();
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [cfStatus, setCfStatus] = useState('verifying');

  useEffect(() => {
    setCfStatus('verifying');
    const timer = setTimeout(() => setCfStatus('success'), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Initialize Google Sign-In button
  useEffect(() => {
    let intervalId;
    let attempts = 0;
    const initializeGoogleBtn = () => {
      if (window.google) {
        try {
          window.google.accounts.id.initialize({
            client_id: '195858897824-4h5ffebs0djtuncmhod98o0ca495ju71.apps.googleusercontent.com',
            callback: handleGoogleLoginSuccess
          });
          const calculatedWidth = Math.max(200, Math.min(336, window.innerWidth - 64));
          const btnElem = document.getElementById('google-signin-btn');
          if (btnElem) {
            window.google.accounts.id.renderButton(btnElem, { theme: 'outline', size: 'large', width: calculatedWidth, shape: 'pill' });
          }
          if (intervalId) clearInterval(intervalId);
        } catch (err) { /* ignore */ }
      }
    };
    initializeGoogleBtn();
    if (!window.google) {
      intervalId = setInterval(() => {
        attempts++;
        if (window.google || attempts > 50) { initializeGoogleBtn(); clearInterval(intervalId); }
      }, 200);
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleLoginSuccess = async (response) => {
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await fetch(`${API_URL_ROOT}/api/users/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.credential }),
        credentials: 'include'
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Xác thực Google thất bại');
      const authData = result.data;
      setToken('session-cookie');
      setUser(authData.user);
      sessionStorage.setItem('adminUser', JSON.stringify(authData.user));
      const isAdminUser = authData.user && (authData.user.role === 'ADMIN' || authData.user.role === 'SUPER_ADMIN' || authData.user.isAdmin);
      if (isAdminUser) {
        setView('admin');
        sessionStorage.setItem('adminView', 'admin');
      } else {
        setView('home');
      }
      showToast('Đăng nhập thành công!', 'success');
    } catch (err) {
      setLoginError(err.message);
      showToast(err.message, 'error');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleGoogleLoginMobile = () => {
    const clientId = '195858897824-4h5ffebs0djtuncmhod98o0ca495ju71.apps.googleusercontent.com';
    const redirectUri = window.location.origin;
    const nonce = Math.random().toString(36).substring(2) + Date.now();
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=id_token&scope=openid%20profile%20email&nonce=${nonce}`;
    window.location.href = url;
  };

  const handleLocalLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await fetch(`${API_URL_ROOT}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
        credentials: 'include'
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Sai tài khoản hoặc mật khẩu');
      const authData = result.data;
      setToken('session-cookie');
      setUser(authData.user);
      sessionStorage.setItem('adminUser', JSON.stringify(authData.user));
      sessionStorage.setItem('adminToken', 'session-cookie');
      const isAdminUser = authData.user && (authData.user.role === 'ADMIN' || authData.user.role === 'SUPER_ADMIN' || authData.user.isAdmin);
      if (isAdminUser) {
        setView('admin');
        sessionStorage.setItem('adminView', 'admin');
      } else {
        setView('home');
      }
      showToast('Đăng nhập thành công!', 'success');
    } catch (err) {
      setLoginError(err.message);
      showToast(err.message, 'error');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="login-page-split">
      <style dangerouslySetInnerHTML={{__html: `
        .login-page-split {
          min-height: 100vh; width: 100%; background: var(--bg-main);
          display: flex; flex-direction: column; position: relative;
          overflow-y: auto; box-sizing: border-box; color: var(--text-main);
        }
        .login-page-split::before {
          content: ''; position: absolute; top: -10%; left: -10%;
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(249,115,22,0.1) 0%, rgba(234,88,12,0.03) 40%, transparent 70%);
          z-index: 1; pointer-events: none; animation: floatOrb1 12s ease-in-out infinite;
        }
        .login-page-split::after {
          content: ''; position: absolute; bottom: -10%; right: -10%;
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(249,115,22,0.08) 0%, rgba(234,88,12,0.02) 40%, transparent 70%);
          z-index: 1; pointer-events: none; animation: floatOrb2 15s ease-in-out infinite;
        }
        .login-split-header {
          height: 70px; display: flex; align-items: center; justify-content: space-between;
          padding: 0 40px; z-index: 10; width: 100%; box-sizing: border-box;
        }
        .login-split-logo { display: flex; align-items: center; gap: 12px; }
        .login-split-logo img { width: 36px; height: 36px; border-radius: 50%; border: 1px solid rgba(249,115,22,0.35); object-fit: cover; }
        .login-split-logo span { font-family: var(--font-heading); font-size: 20px; font-weight: 800; color: var(--text-bright); letter-spacing: 0.5px; }
        .login-split-nav { display: flex; align-items: center; gap: 24px; }
        .login-split-nav .btn-back {
          background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-main);
          padding: 8px 16px; border-radius: 20px; font-size: 13.5px; font-weight: 600; cursor: pointer;
          display: flex; align-items: center; gap: 8px; transition: all 0.2s;
        }
        .login-split-nav .btn-back:hover { background: #fff7ed; border-color: #f97316; color: #ea580c; }
        .login-split-content {
          flex: 1; display: flex; align-items: center; justify-content: space-between;
          padding: 0 80px; max-width: 1200px; margin: 0 auto; width: 100%; gap: 60px; z-index: 10; box-sizing: border-box;
        }
        .login-split-left { flex: 1.1; text-align: left; }
        .login-split-left .badge {
          display: inline-flex; align-items: center; gap: 8px; background: #fff7ed; border: 1px solid #ffedd5;
          color: #ea580c; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700;
          text-transform: uppercase; margin-bottom: 24px;
        }
        .login-split-left h1 { font-family: var(--font-heading); font-size: 40px; font-weight: 800; color: var(--text-bright); line-height: 1.3; margin: 0 0 20px; }
        .login-split-left p { font-size: 16px; color: var(--text-muted); line-height: 1.6; margin: 0; }
        .login-split-right { flex: 0.9; display: flex; justify-content: flex-end; width: 100%; }
        .login-split-card {
          background: var(--bg-card); backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px);
          border: 1px solid var(--border-color); border-radius: 24px;
          width: 100%; max-width: 440px; padding: 28px 32px;
          box-shadow: 0 20px 50px -10px rgba(0,0,0,0.12); box-sizing: border-box;
        }
        .login-split-card h2 { font-family: var(--font-heading); font-size: 28px; font-weight: 800; color: var(--text-bright); margin: 0 0 8px; text-align: left; }
        .login-split-card .subtitle { font-size: 13.5px; color: var(--text-muted); margin-bottom: 16px; text-align: left; }
        .form-label { display: block; text-align: left; font-size: 13px; font-weight: 600; color: var(--text-main); margin-bottom: 8px; }
        .form-input-wrapper { position: relative; margin-bottom: 10px; }
        .form-input {
          width: 100%; padding: 13px 16px; background: var(--bg-main); border: 1px solid var(--border-color);
          border-radius: 12px; color: var(--text-main); font-size: 14.5px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); box-sizing: border-box;
        }
        .form-input:focus { outline: none; border-color: #f97316; background: var(--bg-card); box-shadow: 0 0 16px rgba(249,115,22,0.2); }
        .cf-turnstile-sim {
          background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 6px;
          padding: 10px 14px; display: flex; align-items: center; justify-content: space-between;
          min-height: 58px; margin: 16px 0 20px; box-sizing: border-box; color: var(--text-main); user-select: none;
        }
        .cf-verifying { display: flex; align-items: center; gap: 10px; width: 100%; font-size: 13px; color: var(--text-muted); }
        .cf-spinner { width: 20px; height: 20px; border: 2px solid rgba(0,0,0,0.1); border-top-color: #f97316; border-radius: 50%; animation: cfSpin 0.8s linear infinite; flex-shrink: 0; }
        @keyframes cfSpin { to { transform: rotate(360deg); } }
        .cf-success { display: flex; align-items: center; justify-content: space-between; width: 100%; }
        .cf-success-left { display: flex; align-items: center; gap: 10px; }
        .cf-check-circle { width: 24px; height: 24px; background: #22c55e; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px; }
        .cf-success-left span { font-size: 14px; font-weight: 600; color: var(--text-main); }
        .cf-success-right { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; line-height: 1; }
        .cf-cloud-svg { width: 20px; height: 12px; }
        .cf-brand-text { font-size: 7px; font-weight: 800; letter-spacing: 0.8px; color: var(--text-muted); }
        .cf-links { display: flex; gap: 6px; margin-top: 1px; }
        .cf-links a { font-size: 8px; color: var(--text-muted); text-decoration: underline; }
        .login-split-footer { text-align: center; margin-top: 24px; font-size: 13.5px; color: var(--text-muted); }
        .login-split-footer a { color: #ea580c; text-decoration: underline; }
        .login-error-msg {
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 10px;
          padding: 12px 14px; font-size: 13.5px; color: #ef4444; margin-bottom: 16px; text-align: left;
        }
        .modal-login-btn {
          width: 100%; padding: 13px 20px; background: linear-gradient(135deg, #f97316, #ea580c);
          color: #fff; border: none; border-radius: 12px; font-size: 15px; font-weight: 700;
          cursor: pointer; transition: all 0.3s; letter-spacing: 0.3px; box-shadow: 0 6px 20px rgba(249,115,22,0.35);
        }
        .modal-login-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(249,115,22,0.45); }
        .modal-login-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .modal-divider { display: flex; align-items: center; gap: 12px; margin: 20px 0; color: var(--text-muted); font-size: 13px; font-weight: 500; }
        .modal-divider::before, .modal-divider::after { content: ''; flex: 1; height: 1px; background: var(--border-color); }
        @media (max-width: 992px) {
          .login-split-header { padding: 15px 20px; height: auto; }
          .login-split-content { flex-direction: column; padding: 20px 20px 60px; gap: 30px; justify-content: center; flex: 1; }
          .login-split-left { text-align: center; max-width: 100%; }
          .login-split-left h1 { font-size: 28px; margin-bottom: 12px; }
          .login-split-right { justify-content: center; width: 100%; }
          .login-split-card { padding: 24px 20px; width: 100%; max-width: 100%; }
        }
        @media (max-width: 480px) {
          .login-split-left h1 { font-size: 24px; }
          .login-split-card h2 { font-size: 22px; }
        }
      `}} />

      <ToastNotification />

      {/* Header */}
      <header className="login-split-header">
        <div className="login-split-logo">
          <img src="/MAIN.png" alt="Logo" />
          <span>28Symues <span style={{ color: '#f97316' }}>Affiliate</span></span>
        </div>
        <div className="login-split-nav">
          <ThemeToggle style={{ marginRight: '10px' }} />
          <button className="btn-back" onClick={() => { setView('home'); window.history.pushState({}, '', '/'); }}>
            <i className="fa-solid fa-house"></i> Trang chủ
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
          <p>Đăng nhập để theo dõi trạng thái đơn hàng Shopee, xem thống kê doanh số hoa hồng tạm tính và duyệt yêu cầu rút tiền tự động của các thành viên trong hệ thống.</p>
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
                  <input type="email" className="form-input" placeholder="Email của bạn" required
                    value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Password</label>
                <div className="form-input-wrapper">
                  <input type="password" className="form-input" placeholder="••••••••••••" required
                    value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', textAlign: 'left', margin: '16px 0 10px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <input type="checkbox" id="accept-terms" required style={{ marginTop: '3px', cursor: 'pointer' }} />
                <label htmlFor="accept-terms" style={{ cursor: 'pointer', lineHeight: '1.4' }}>
                  Tôi đồng ý với <a href="#" onClick={e => e.preventDefault()} style={{ color: '#ea580c', textDecoration: 'underline' }}>Điều khoản dịch vụ</a> và{' '}
                  <a href="#" onClick={e => e.preventDefault()} style={{ color: '#ea580c', textDecoration: 'underline' }}>Chính sách bảo mật</a>.
                </label>
              </div>

              {/* Simulated Cloudflare Turnstile */}
              <div className="cf-turnstile-sim">
                {cfStatus === 'verifying' ? (
                  <div className="cf-verifying">
                    <div className="cf-spinner"></div>
                    <span>Đang kiểm tra an toàn kết nối...</span>
                  </div>
                ) : (
                  <div className="cf-success">
                    <div className="cf-success-left">
                      <div className="cf-check-circle"><i className="fa-solid fa-check"></i></div>
                      <span>Thành công!</span>
                    </div>
                    <div className="cf-success-right">
                      <svg className="cf-cloud-svg" viewBox="0 0 24 24">
                        <path fill="#f38020" d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
                      </svg>
                      <span className="cf-brand-text">CLOUDFLARE</span>
                      <div className="cf-links">
                        <a href="#" onClick={e => e.preventDefault()}>Quyền riêng tư</a>
                        <a href="#" onClick={e => e.preventDefault()}>Giúp đỡ</a>
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

            <div style={{ position: 'relative', width: '100%', minHeight: '44px', margin: '0 auto 12px auto' }}>
              <button
                className="btn-google-custom"
                onClick={handleGoogleLoginMobile}
                style={{ width: '100%', height: '44px', background: 'var(--bg-card)', color: 'var(--text-bright)', border: '1.5px solid var(--border-color)', borderRadius: '12px', fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', cursor: 'pointer', transition: 'all 0.25s ease' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fff7ed'; e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.color = '#ea580c'; }}
                onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.borderColor = ''; e.currentTarget.style.color = ''; }}
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

            <div className="login-split-footer">
              Bạn chưa có tài khoản? <a href="https://zalo.me/g/0p083nqqoordpki9zgvy" target="_blank" rel="noreferrer">Tham gia ngay</a>
            </div>
          </div>
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
}
