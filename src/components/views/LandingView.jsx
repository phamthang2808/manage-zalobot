import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import MobileBottomNav from '../common/MobileBottomNav';
import ToastNotification from '../common/ToastNotification';
import ThemeToggle from '../common/ThemeToggle';

export default function LandingView() {
  const { view, setView, token, user, isAdmin, theme, toggleTheme, mobileMenuOpen, setMobileMenuOpen, handleLogout, showToast, windowWidth } = useApp();
  const [showBanner, setShowBanner] = useState(true);

  return (
    <div className="landing-container">
      <ToastNotification />
      <header className="landing-header">
        <div className="landing-logo">
          <img src="/logo.jpg" alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
          <span>28Symues <span style={{ color: '#f97316' }}>Affiliate</span></span>
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
        <button className={`hamburger${mobileMenuOpen ? ' active' : ''}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
          <span></span><span></span><span></span>
        </button>
      </header>
      {mobileMenuOpen && <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)}></div>}

      {/* Hero Section */}
      <section id="home" className="hero-section">
        <div className="hero-grid-split">
          <div className="hero-content-left">
            <div className="hero-badge">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ea580c', flexShrink: 0 }}>
                <rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" />
                <path d="M12 7v4" /><line x1="8" y1="16" x2="8.01" y2="16" strokeWidth="3" />
                <line x1="16" y1="16" x2="16.01" y2="16" strokeWidth="3" /><path d="M9 16h6" />
              </svg>
              HỆ THỐNG AUTOMATION AFFILIATE
            </div>
            <h1 className="hero-title">Tự Động Hóa Shopee Affiliate<br />Với 28Symues</h1>
            <p className="hero-subtitle">
              Biến mọi liên kết mua sắm trong nhóm chat Zalo của bạn thành nguồn thu nhập thụ động chỉ trong vài giây. Tiện lợi, tự động và hoàn toàn minh bạch.
            </p>
            <div className="hero-buttons">
              <a href="#steps" className="btn btn-hero-1">Bắt đầu ngay</a>
              <button onClick={() => { setView('lookup'); window.history.pushState({}, '', '/?view=lookup'); }} className="btn btn-hero-2">
                <i className="fa-thin fa-magnifying-glass"></i> Tra cứu đơn hàng
              </button>
              <a href="#features" className="btn btn-hero-3">Tìm hiểu tính năng</a>
            </div>
          </div>

          <div className="hero-mockup-right">
            <div className="floating-badge badge-top-right"><span className="badge-icon">⚡</span><span className="badge-text">Tốc độ &lt; 0.5s</span></div>
            <div className="floating-badge badge-mid-left"><span className="badge-icon">💰</span><span className="badge-text">+18.500đ Vừa ghi nhận</span></div>
            <div className="floating-badge badge-bot-right"><span className="badge-icon">🤖</span><span className="badge-text">AI GPT-4o Tự Động</span></div>
            <div className="zalo-phone-mockup">
              <div className="zalo-phone-header">
                <div className="zalo-avatar"><img src="/logo.jpg" alt="Bot Logo" /><span className="online-dot"></span></div>
                <div className="zalo-header-info">
                  <div className="zalo-group-name" style={{ fontSize: "11px", letterSpacing: "-0.2px", fontWeight: "800" }}>HOÀN TIỀN HOA HỒNG SHOPPE + ĐẶT ĐƠN NGƯỜI MỚI</div>
                  <div className="zalo-group-sub">Cộng đồng • 👥 284 thành viên • Bot đang hoạt động</div>
                </div>
              </div>
              <div className="zalo-chat-body">
                <div className="chat-date-divider">Hôm nay</div>
                <div className="chat-msg customer-msg">
                  <div className="msg-sender">Nguyễn Mai (Thành viên)</div>
                  <div className="msg-bubble">
                    Sếp ơi check giúp em link váy này trên Shopee với nè!
                    <div className="msg-link-preview">shopee.vn/dam-du-tiec-sang-trong-i.1284920</div>
                  </div>
                  <div className="msg-time">08:32 AM</div>
                </div>
                <div className="chat-msg bot-msg">
                  <div className="msg-sender bot-sender"><span>28Symues Bot</span><span className="bot-tag">BOT</span></div>
                  <div className="msg-bubble bot-bubble">
                    Dạ link mua sắm săn sale có gắn hoa hồng cho chị Mai đây ạ 👇
                    <div className="converted-link-card">
                      <div className="link-title">Đầm Dự Tiệc Dáng Xòe Sang Trọng</div>
                      <div className="link-url">https://s.shopee.vn/aff_829103</div>
                      <div className="link-meta">
                        <span className="subid-tag">SubID: Mai_Zalo98</span>
                        <span className="cashback-tag">+18.500đ Hoa hồng</span>
                      </div>
                    </div>
                  </div>
                  <div className="msg-time">08:32 AM</div>
                </div>
              </div>
            </div>
          </div>
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

      {/* Steps Section */}
      <section id="steps" className="instructions-section" style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <h2 className="section-title">3 Bước Bắt Đầu Đơn Giản</h2>
        <p className="section-subtitle">Chỉ mất 5 phút để thiết lập và khởi chạy chatbot trong nhóm của bạn</p>
        <div className="instructions-grid">
          <div className="instruction-step"><div className="step-num">1</div><h3 className="step-title">Quét QR Kết Nối</h3><p className="step-desc">Quét mã QR Zalo từ client bot để kết nối tài khoản phụ làm bot săn sale tự động.</p></div>
          <div className="instruction-step"><div className="step-num">2</div><h3 className="step-title">Thêm Vào Nhóm Chat</h3><p className="step-desc">Thêm Bot vào nhóm săn sale của bạn. Bot sẽ tự động chào và lắng nghe các link sản phẩm.</p></div>
          <div className="instruction-step"><div className="step-num">3</div><h3 className="step-title">Mua Sắm & Nhận Tiền</h3><p className="step-desc">Mọi đơn hàng thành công sẽ được đối soát và cộng dồn ví hoa hồng, rút nhanh qua lệnh chat.</p></div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing-section" style={{ padding: '80px 20px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
        <h2 className="section-title" style={{ fontSize: '36px', fontWeight: '800', color: 'var(--text-bright)', marginBottom: '12px' }}>Bảng Giá Dịch Vụ</h2>
        <p className="section-subtitle" style={{ color: 'var(--text-muted)', fontSize: '16px', marginBottom: '48px' }}>Chi phí tối ưu, hiệu quả tối đa cho nhóm Zalo săn sale của bạn</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
          {[
            { name: 'Zalo Bot Affiliate', desc: 'Tự động chuyển đổi link mua sắm cơ bản trong nhóm chat', price: '199.000đ', features: ['Tự động đổi link nhận hoa hồng: Khách gửi link Shopee, Lazada... bot tự đổi thành link của sếp ngay lập tức.', 'Tự nhận biết người gửi: Ghi nhận chính xác ai gửi link để sếp tính doanh số cho họ.', 'Hoạt động liên tục 24/7: Tự trả lời tin nhắn trong nhóm chat bất kể ngày đêm, sếp không cần trực máy.', 'Tin nhắn phản hồi lịch sự: Mẫu tin nhắn ngắn gọn, rõ ràng, kích thích người mua bấm link.'], featured: false },
            { name: 'Zalo Bot Affiliate Pro', desc: 'Có trang quản trị riêng cho sếp và trang tự tra cứu cho khách', price: '399.000đ', features: ['Tự động đổi link mua sắm Shopee, Lazada, TikTok Shop mượt mà.', 'Trang quản trị doanh thu riêng: Theo dõi toàn bộ đơn hàng và quản lý cực kỳ nhàn hạ.', 'Khách tự tra cứu trên Web: Thành viên có thể tự vào xem đơn và hoa hồng mình tích lũy.', 'Chạy cùng lúc nhiều nhóm: Bot hoạt động trên nhiều nhóm chat và gom số liệu về một nơi.', 'Báo cáo hoa hồng chính xác: Tự tính tiền chuẩn sau thuế và lọc bỏ các đơn trùng lặp.'], featured: true },
            { name: 'Zalo Bot Affiliate Pro Max', desc: 'Hệ thống ví tiền tự động và rút tiền qua tin nhắn chat', price: '599.000đ', features: ['Đầy đủ toàn bộ tính năng cao cấp của bản Pro.', 'Ví tích lũy tiền tự động: Tự động cộng dồn tiền hoa hồng sau khi đơn hàng thành công.', 'Rút tiền nhanh bằng tin nhắn: Khách tự gõ lệnh `/rut-tien` trong nhóm để yêu cầu thanh toán.', 'Đường truyền riêng siêu tốc: Chạy trên máy chủ VPS riêng, phản hồi ngay lập tức không trễ lag.', 'Hỗ trợ kỹ thuật ưu tiên 24/7: Xử lý nhanh chóng mọi yêu cầu và sự cố phát sinh.'], featured: false }
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

      {/* QR Banner */}
      {showBanner && (
        <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '40px 0 20px', position: 'relative', zIndex: 2 }}>
          <h3 style={{ fontSize: '18px', color: 'var(--text-bright)', marginBottom: '16px', fontWeight: '800', textAlign: 'center', padding: '0 16px', lineHeight: '1.4' }}>
            🌟 Quét QR Tham Gia Nhóm Zalo Nhận Hoàn Tiền Ngay
          </h3>
          <div style={{ position: 'relative', width: '280px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.1), 0 0 30px rgba(249,115,22,0.2)', border: '2px solid #fed7aa', transition: 'transform 0.3s ease' }}>
            <button onClick={e => { e.stopPropagation(); setShowBanner(false); }} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '26px', height: '26px', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>×</button>
            <img src="/banner.jpg" alt="Tham gia Zalo Group nhận hoa hồng" style={{ width: '100%', display: 'block' }} />
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-info">
            <div className="footer-logo"><img src="/logo.jpg" alt="Logo" /><span>28Symues Affiliate</span></div>
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
