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
      threshold: 0.1,
      rootMargin: '0px 0px -30px 0px'
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    const elements = document.querySelectorAll('.reveal-on-scroll, .scroll-reveal, .zigzag-row, .zalo-pc-live-card, .pricing-card');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-container">
      <ToastNotification />

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
          <a href="#" onClick={e => { e.preventDefault(); setView('lookup'); window.history.pushState({}, '', '/?view=lookup'); setMobileMenuOpen(false); }} style={{ color: '#ea580c', fontWeight: '700' }}>
            <i className="fa-thin fa-magnifying-glass" style={{ marginRight: '6px' }}></i>Tra cứu đơn hàng
          </a>
          <div className="mobile-nav-actions">
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
        <div className="mobile-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <ThemeToggle className="mobile-header-theme-toggle" />
          <button className={`hamburger${mobileMenuOpen ? ' active' : ''}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
            <span></span><span></span><span></span>
          </button>
        </div>
      </header>
      {mobileMenuOpen && <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)}></div>}

      {/* Container 1: Top Hero Banner Container */}
      <section id="home" className="landing-block-container hero-showcase-container reveal-on-scroll" style={{ marginTop: '12px', marginBottom: '0px', paddingBottom: '0px', paddingTop: '10px', textAlign: 'center' }}>
        <div className="section-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '8px 20px', borderRadius: '30px', background: 'rgba(249, 115, 22, 0.12)', color: '#ea580c', fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>
          <img src="/robot-icon.png" alt="AI Robot" style={{ width: '32px', height: '32px', objectFit: 'contain', flexShrink: 0 }} />
          <span>HỆ THỐNG AUTOMATION AFFILIATE 4.0</span>
        </div>
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

        {/* Section 2: Zig-Zag Alternating Showcase Section (Moved UP as requested) */}
        <section id="automation-features" className="landing-block-container reveal-on-scroll" style={{ padding: '0px 20px 24px', marginTop: '0px', marginBottom: '16px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px', marginTop: '0px' }}>
            <div className="section-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '8px 20px', borderRadius: '30px', background: 'rgba(13, 148, 136, 0.12)', color: '#0d9488', fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
              <i className="fa-solid fa-sparkles"></i>
              <span>KHÁM PHÁ CÁC TÍNH NĂNG ĐỘC BẢN</span>
            </div>
            <h2 className="section-title" style={{ fontSize: '32px', fontWeight: '800', marginBottom: '12px' }}>Hệ Thống Tự Động Hóa Affiliate Toàn Diện</h2>
            <p className="section-subtitle" style={{ fontSize: '15px' }}>Giải pháp mượt mà, tối ưu nhất giúp sếp quản lý nhóm săn sale nhàn hạ 100%</p>
          </div>

          {/* Row 1: Image Left, Text Right */}
          <div className="zigzag-row">
            <div className="zigzag-media">
              <div className="zigzag-img-card">
                <img src="/anh1.png" alt="Tự Động Đổi Link" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '24px' }} />
              </div>
            </div>
            <div className="zigzag-content">
              <span className="zigzag-category-badge">AUTOMATION AFFILIATE 24/7</span>
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

          {/* Row 2: Text Left, Cartoon Image Right */}
          <div className="zigzag-row reverse">
            <div className="zigzag-media">
              <div className="zigzag-img-card" style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
                <img src="/anh2.png" alt="Trang Web Tra Cứu Đơn Hàng" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '24px', filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.08))' }} />
              </div>
            </div>
            <div className="zigzag-content">
              <span className="zigzag-category-badge">MINH BẠCH & TIỆN LỢI</span>
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

          {/* Row 3: Cartoon Image Left, Text Right */}
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

        {/* Section 3: Live Zalo Bot Chat Showcase (Desktop PC Version) */}
        <section id="zalo-demo" className="landing-block-container hero-section reveal-on-scroll">
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div className="section-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '8px 20px', borderRadius: '30px', background: 'rgba(249, 115, 22, 0.12)', color: '#ea580c', fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
              <i className="fa-regular fa-envelope" style={{ fontSize: '18px', flexShrink: 0 }}></i>
              <span>TRẢI NGHIỆM CHATBOT ZALO REALTIME</span>
            </div>
            <h2 className="section-title" style={{ fontSize: '30px', fontWeight: '800', marginBottom: '8px' }}>Tương Tác & Chuyển Đổi Link Tự Động</h2>
            <p className="section-subtitle" style={{ fontSize: '15px' }}>Giao diện đối soát đơn hàng và tự động phản hồi link hoa hồng trực tiếp trên Zalo Desktop</p>
          </div>

          {/* Large Crisp Native Zalo PC Desktop Form with Animated Floating Badges */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '1360px', margin: '0 auto' }}>
            {/* Glowing Animated Floating Badges for Desktop */}
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

      {/* Pricing Section Container */}
      <section id="pricing" className="landing-block-container pricing-section reveal-on-scroll" style={{ textAlign: 'center' }}>
        <h2 className="section-title" style={{ fontSize: '36px', fontWeight: '800', color: 'var(--text-bright)', marginBottom: '12px' }}>Bảng Giá Dịch Vụ</h2>
        <p className="section-subtitle" style={{ color: 'var(--text-muted)', fontSize: '16px', marginBottom: '48px' }}>Chi phí tối ưu, hiệu quả tối đa cho nhóm Zalo săn sale của bạn</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '24px', width: '100%', margin: '0 auto' }}>
          {[
            { 
              name: 'Zalo Bot Affiliate', 
              desc: 'Tự động chuyển đổi link tiếp thị liên kết 24/7 trực tiếp trong nhóm Zalo', 
              price: '199.000đ', 
              features: [
                'Tự động đổi link mua sắm Shopee, Lazada, TikTok Shop sang link nhận hoa hồng của bạn.',
                'Hoạt động 24/7 trong nhóm chat, tự động trả lời tin nhắn ngay lập tức không cần trực máy.',
                'Tự nhận biết người gửi link: Ghi nhận chính xác ai gửi link trong nhóm để bạn theo dõi doanh số.',
                'Phản hồi siêu tốc 24/7: Bot trả lời tin nhắn tức thì, bạn không cần túc trực máy tính.',
                'Tin nhắn tối ưu mua hàng: Mẫu phản hồi lịch sự, ngắn gọn, gắn thẻ khách hàng kích thích bấm mua.'
              ], 
              featured: false 
            },
            { 
              name: 'Zalo Bot Affiliate Pro', 
              desc: 'Gồm Bot tự đổi link + Trang Web tra cứu đơn cho khách & Trang quản trị cho chủ nhóm', 
              price: '299.000đ', 
              features: [
                'Bao gồm toàn bộ tính năng của bản Cơ Bản.',
                'Trang Web Tra Cứu riêng: Khách hàng tự mở Web xem danh sách đơn hàng & hoa hồng tích lũy.',
                'Trang Web Quản Trị Doanh Thu: Chủ nhóm đăng nhập xem toàn bộ đơn hàng và bấm duyệt thanh toán 1-click.',
                'Tra cứu hoa hồng qua Zalo: Khách hàng gõ lệnh `/vitien` hoặc `/donhang` ngay trong nhóm để xem số dư.'
              ], 
              featured: true 
            },
            { 
              name: 'Zalo Bot Affiliate Pro Max', 
              desc: 'Hệ thống Trang Web riêng biệt + Ví tích lũy hoa hồng tự động & Khách tự đặt lệnh rút tiền', 
              price: '399.000đ', 
              features: [
                'Bao gồm toàn bộ tính năng cao cấp của bản Pro.',
                'Hệ thống Trang Web riêng biệt: Giao diện hiện đại, tra cứu ví hoa hồng và lịch sử dòng tiền minh bạch.',
                'Ví hoa hồng & Lịch sử rút tiền: Tự động cộng dồn hoa hồng khi đơn hoàn thành, theo dõi dòng tiền rõ ràng.',
                'Khách tự đặt lệnh rút tiền: Thành viên chủ động tạo yêu cầu rút tiền trên Web hoặc gõ lệnh rút tiền trong nhóm.',
                'Duyệt rút tiền siêu nhanh: Chủ nhóm nhận thông báo và bấm duyệt thanh toán cho khách hàng chỉ với 1 bấm.',
                'Tốc độ xử lý siêu tốc 24/7: Vận hành riêng biệt, phản hồi tức thì, bảo mật và ổn định tuyệt đối.'
              ], 
              featured: false 
            }
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
            <div className="footer-logo">
              <img src="/MAIN.png" alt="28Symues Affiliate Logo" />
              <span>Cho Thuê Zalo Bot Affiliate</span>
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
                <span>Zalo Admin: <a href="http://zaloapp.com/qr/p/fd2gcjcjfuof" target="_blank" rel="noopener noreferrer">Phạm Thắng (Kích hoạt 24/7)</a></span>
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
      <MobileBottomNav />
    </div>
  );
}
