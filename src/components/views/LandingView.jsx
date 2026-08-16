import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import MobileBottomNav from '../common/MobileBottomNav';
import ToastNotification from '../common/ToastNotification';
import ThemeToggle from '../common/ThemeToggle';
import RunningCatMascot from '../common/RunningCatMascot';

export default function LandingView() {
  const { view, setView, token, user, isAdmin, theme, toggleTheme, mobileMenuOpen, setMobileMenuOpen, handleLogout, showToast, windowWidth } = useApp();
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
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
    const elements = document.querySelectorAll('.scroll-reveal');
    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add('revealed');
      } else {
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-container">
      <ToastNotification />

      {/* Global Fixed Running Cat Mascot Screen Animation */}
      <RunningCatMascot />

      <header className="landing-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '14px 18px', flexWrap: 'nowrap', gap: '8px', boxSizing: 'border-box' }}>
        <div className="landing-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 1, minWidth: 0, whiteSpace: 'nowrap' }}>
          <img src="/MAIN.png" alt="Logo" style={{ width: '32px', height: '32px', maxWidth: '32px', maxHeight: '32px', borderRadius: '50%', flexShrink: 0, objectFit: 'cover', border: '1.5px solid rgba(249, 115, 22, 0.45)' }} />
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
          <a href="#" onClick={e => { e.preventDefault(); setView('lookup'); window.history.pushState({}, '', '/?view=lookup'); setMobileMenuOpen(false); }} style={{ color: '#ea580c', fontWeight: '700' }}>
            <i className="fa-thin fa-magnifying-glass" style={{ marginRight: '6px' }}></i>Tra cứu đơn hàng
          </a>
          <div className="mobile-nav-actions">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: 'var(--bg-main)', borderRadius: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-main)' }}>Giao diện Dark/Light</span>
              <ThemeToggle />
            </div>
            {token ? (
              <>
                <div className="user-widget">
                  {user?.avatarUrl
                    ? <img src={user.avatarUrl} alt="Avatar" referrerPolicy="no-referrer" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                    : <div className="user-widget-avatar">{(user?.fullName || 'U').substring(0, 1).toUpperCase()}</div>}
                  <span className="user-widget-name">{user?.fullName}</span>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => { setView('admin'); sessionStorage.setItem('adminView', 'admin'); setMobileMenuOpen(false); }}
                    style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.25), rgba(234,88,12,0.15))', border: '1px solid rgba(249,115,22,0.45)', color: '#ffffff', fontSize: '14.5px', fontWeight: '700', padding: '8px 18px', borderRadius: '20px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.25s ease' }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', flexShrink: 0 }}>
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                      <path d="M19 8a3 3 0 0 1 0 6" /><circle cx="18" cy="18" r="2.5" />
                      <path d="M18 14.5v1M18 20.5v1M14.5 18h1M20.5 18h1" />
                    </svg>
                    Trang Quản Trị
                  </button>
                )}
                <button className="btn" onClick={() => { handleLogout(); setMobileMenuOpen(false); }} style={{ border: '1px solid var(--border-color)' }}>Đăng xuất</button>
              </>
            ) : (
              <button className="btn btn-glow" onClick={() => { setView('login'); window.history.pushState({}, '', '/?view=login'); setMobileMenuOpen(false); }}>Đăng nhập</button>
            )}
          </div>
        </nav>
        <div className="landing-actions">
          <ThemeToggle style={{ marginRight: '8px' }} />
          {token ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className="user-widget">
                {user?.avatarUrl
                  ? <img src={user.avatarUrl} alt="Avatar" referrerPolicy="no-referrer" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                  : <div className="user-widget-avatar">{(user?.fullName || 'U').substring(0, 1).toUpperCase()}</div>}
                <span className="user-widget-name">{user?.fullName}</span>
              </div>
              {isAdmin && (
                <button
                  onClick={() => { setView('admin'); sessionStorage.setItem('adminView', 'admin'); }}
                  style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', border: '1px solid #ea580c', color: '#ffffff', fontSize: '14.5px', fontWeight: '700', padding: '8px 18px', borderRadius: '20px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 15px rgba(249,115,22,0.3)', transition: 'all 0.25s ease' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', flexShrink: 0 }}>
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    <path d="M19 8a3 3 0 0 1 0 6" /><circle cx="18" cy="18" r="2.5" />
                    <path d="M18 14.5v1M18 20.5v1M14.5 18h1M20.5 18h1" />
                  </svg>
                  Trang Quản Trị
                </button>
              )}
              <button className="btn" onClick={handleLogout} style={{ border: '1px solid var(--border-color)' }}>Đăng xuất</button>
            </div>
          ) : (
            <button className="btn btn-glow" onClick={() => { setView('login'); window.history.pushState({}, '', '/?view=login'); }}>Đăng nhập</button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <ThemeToggle />
          <button className={`hamburger${mobileMenuOpen ? ' active' : ''}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
            <span></span><span></span><span></span>
          </button>
        </div>
      </header>
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
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px', textAlign: 'right' }}>04:50</div>
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
            <p className="feature-desc">Tự động nhận diện link Shopee, Lazada, TikTok Shop và chuyển đổi thành link affiliate có gắn Zalo ID của người gửi làm sub_id.</p>
          </div>
          <div className="feature-card success">
            <div className="feature-icon"><i className="fa-brands fa-bots"></i></div>
            <h3 className="feature-title">Tương Tác Bằng AI</h3>
            <p className="feature-desc">Sử dụng mô hình AI GPT-4o để tự động soạn thảo lời phản hồi vui nhộn, hấp dẫn, nâng cao tỷ lệ nhấn click mua sản phẩm.</p>
          </div>
          <div className="feature-card warning">
            <div className="feature-icon"><i className="fa-regular fa-chart-area"></i></div>
            <h3 className="feature-title">Thống Kê Chi Tiết</h3>
            <p className="feature-desc">Theo dõi đầy đủ lịch sử đơn hàng đã mua, phần trăm hoa hồng tạm tính và doanh số rút tiền của từng thành viên trong hệ thống.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><i className="fa-brands fa-cc-apple-pay"></i></div>
            <h3 className="feature-title">Rút Tiền Tự Động</h3>
            <p className="feature-desc">Thành viên yêu cầu rút tiền trực tiếp bằng cú pháp `/rut-tien` trong nhóm Zalo. Admin phê duyệt nhanh chóng trên Dashboard.</p>
          </div>
        </div>
      </section>

      {/* Steps Section Container */}
      <section id="steps" className="landing-block-container instructions-section reveal-on-scroll">
        <h2 className="section-title">3 Bước Bắt Đầu Đơn Giản</h2>
        <p className="section-subtitle">Chỉ mất 5 phút để thiết lập và khởi chạy chatbot trong nhóm của bạn</p>
        <div className="instructions-grid">
          <div className="instruction-step"><div className="step-num">1</div><h3 className="step-title">Quét QR Kết Nối</h3><p className="step-desc">Quét mã QR Zalo từ client bot để kết nối tài khoản phụ làm bot săn sale tự động.</p></div>
          <div className="instruction-step"><div className="step-num">2</div><h3 className="step-title">Thêm Vào Nhóm Chat</h3><p className="step-desc">Thêm Bot vào nhóm săn sale của bạn. Bot sẽ tự động chào và lắng nghe các link sản phẩm.</p></div>
          <div className="instruction-step"><div className="step-num">3</div><h3 className="step-title">Mua Sắm & Nhận Tiền</h3><p className="step-desc">Mọi đơn hàng thành công sẽ được đối soát và cộng dồn ví hoa hồng, rút nhanh qua lệnh chat.</p></div>
        </div>
      </section>

      {/* Pricing Section Container */}
      <section id="pricing" className="landing-block-container pricing-section reveal-on-scroll" style={{ textAlign: 'center' }}>
        <h2 className="section-title" style={{ fontSize: '36px', fontWeight: '800', color: 'var(--text-bright)', marginBottom: '12px' }}>Bảng Giá Dịch Vụ</h2>
        <p className="section-subtitle" style={{ color: 'var(--text-muted)', fontSize: '16px', marginBottom: '48px' }}>Chi phí tối ưu, hiệu quả tối đa cho nhóm Zalo săn sale của bạn</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '24px', width: '100%', margin: '0 auto' }}>
          {[
            { name: 'Zalo Bot Affiliate', desc: 'Tự động chuyển đổi link mua sắm cơ bản trong nhóm chat', price: '199.000đ', features: ['Tự động đổi link nhận hoa hồng: Khách gửi link Shopee, Lazada... bot tự đổi thành link của sếp ngay lập tức.', 'Tự nhận biết người gửi: Ghi nhận chính xác ai gửi link để sếp tính doanh số cho họ.', 'Hoạt động liên tục 24/7: Tự trả lời tin nhắn trong nhóm chat bất kể ngày đêm, sếp không cần trực máy.', 'Tin nhắn phản hồi lịch sự: Mẫu tin nhắn ngắn gọn, rõ ràng, kích thích người mua bấm link.'], featured: false },
            { name: 'Zalo Bot Affiliate Pro', desc: 'Có trang quản trị riêng cho sếp và trang tự tra cứu cho khách', price: '299.000đ', features: ['Tự động đổi link mua sắm Shopee, Lazada, TikTok Shop mượt mà.', 'Trang quản trị doanh thu riêng: Theo dõi toàn bộ đơn hàng và quản lý cực kỳ nhàn hạ.', 'Khách tự tra cứu trên Web: Thành viên có thể tự vào xem đơn và hoa hồng mình tích lũy.', 'Chạy cùng lúc nhiều nhóm: Bot hoạt động trên nhiều nhóm chat và gom số liệu về một nơi.', 'Báo cáo hoa hồng chính xác: Tự tính tiền chuẩn sau thuế và lọc bỏ các đơn trùng lặp.'], featured: true },
            { name: 'Zalo Bot Affiliate Pro Max', desc: 'Hệ thống ví tiền tự động và rút tiền qua tin nhắn chat', price: '399.000đ', features: ['Đầy đủ toàn bộ tính năng cao cấp của bản Pro.', 'Ví tích lũy tiền tự động: Tự động cộng dồn tiền hoa hồng sau khi đơn hàng thành công.', 'Rút tiền nhanh bằng tin nhắn: Khách tự gõ lệnh `/rut-tien` trong nhóm để yêu cầu thanh toán.', 'Đường truyền riêng siêu tốc: Chạy trên máy chủ VPS riêng, phản hồi ngay lập tức không trễ lag.', 'Hỗ trợ kỹ thuật ưu tiên 24/7: Xử lý nhanh chóng mọi yêu cầu và sự cố phát sinh.'], featured: false }
          ].map((pkg, i) => (
            <div key={i} className="pricing-card" style={{
              background: 'var(--bg-card)', border: pkg.featured ? '2px solid #f97316' : '1px solid var(--border-color)',
              borderRadius: '24px', padding: '40px 32px', width: '100%', maxWidth: '360px',
              backdropFilter: 'blur(10px)', boxShadow: pkg.featured ? '0 20px 40px -15px rgba(249,115,22,0.15)' : '0 10px 30px -10px rgba(0,0,0,0.05)',
              position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column',
              justifyContent: 'space-between', transition: 'all 0.3s ease',
              transform: (pkg.featured && windowWidth >= 768) ? 'scale(1.03)' : 'none', zIndex: pkg.featured ? 2 : 1
            }}>
              {pkg.featured && <div style={{ position: 'absolute', top: '0', right: '0', background: 'linear-gradient(135deg, #f97316, #ea580c)', color: '#ffffff', padding: '6px 20px', borderBottomLeftRadius: '16px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phổ Biến Nhất</div>}
              <div>
                <h3 style={{ fontSize: '22px', color: 'var(--text-bright)', marginBottom: '8px', fontWeight: '700', marginTop: pkg.featured ? '10px' : '0' }}>{pkg.name}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>{pkg.desc}</p>
                <div style={{ marginBottom: '32px' }}>
                  <span style={{ fontSize: '42px', fontWeight: '800', color: 'var(--text-bright)', fontFamily: 'var(--font-heading)' }}>{pkg.price}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '15px' }}> / tháng</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {pkg.features.map((f, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'var(--text-main)', fontSize: '14px' }}>
                      <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
              <a href="http://zaloapp.com/qr/p/fd2gcjcjfuof" target="_blank" rel="noopener noreferrer" className="btn btn-glow-active"
                onClick={() => showToast("Đang kết nối tới Zalo Phạm Thắng...", 'info')}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '15px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', boxSizing: 'border-box' }}>
                Mua Ngay
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* QR Banner Container */}
      {showBanner && (
        <section className="landing-block-container community-container reveal-on-scroll" style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '18px', color: 'var(--text-bright)', marginBottom: '16px', fontWeight: '800', textAlign: 'center', padding: '0 16px', lineHeight: '1.4' }}>
            🌟 Quét QR Tham Gia Nhóm Zalo Nhận Hoàn Tiền Ngay
          </h3>
          <div style={{ position: 'relative', width: '280px', margin: '0 auto', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.1), 0 0 30px rgba(249,115,22,0.2)', border: '2px solid #fed7aa', transition: 'transform 0.3s ease' }}>
            <button onClick={e => { e.stopPropagation(); setShowBanner(false); }} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '26px', height: '26px', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>×</button>
            <img src="/banner.jpg" alt="Tham gia Zalo Group nhận hoa hồng" style={{ width: '100%', display: 'block' }} />
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-info">
            <div className="footer-logo"><img src="/MAIN.png" alt="Logo" /><span>28Symues Affiliate</span></div>
            <p className="footer-slogan">Hệ thống Zalo Bot chuyên nghiệp hỗ trợ tăng doanh số affiliate tự động 24/7 trên Shopee, Lazada và TikTok Shop.</p>
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
              <div className="footer-contact-item"><span style={{ color: '#f97316' }}>💬</span><span>Zalo Admin: <a href="http://zaloapp.com/qr/p/fd2gcjcjfuof" target="_blank" rel="noopener noreferrer">Phạm Thắng</a></span></div>
              <div className="footer-contact-item"><span style={{ color: '#f97316' }}>🌐</span><span>Cộng đồng hỗ trợ & hướng dẫn kiếm tiền</span></div>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 28Symues Affiliate. All rights reserved.</p>
          <div className="footer-bottom-links"><a href="#privacy">Chính Sách Bảo Mật</a><a href="#terms">Điều Khoản Sử Dụng</a></div>
        </div>
      </footer>
      <MobileBottomNav />
    </div>
  );
}
