import React, { useEffect, useState } from "react";

export function ProductLandingView({ code, apiRoot = "" }) {
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    // Tự động bóc tách code từ URL nếu không truyền prop
    let targetCode = code;
    if (!targetCode) {
      const path = window.location.pathname;
      if (path.includes("/p/")) {
        targetCode = path.split("/p/")[1]?.split("?")[0]?.trim();
      }
    }

    if (!targetCode) {
      setError("Mã liên kết sản phẩm không hợp lệ.");
      setLoading(false);
      return;
    }

    const fetchInfo = async () => {
      try {
        const root = apiRoot || (import.meta.env.PROD ? "" : "http://localhost:8080");
        const res = await fetch(`${root}/api/short-link/info/${targetCode}`);
        if (res.ok) {
          const data = await res.json();
          setInfo(data);
        } else {
          // Fallback sang resolve endpoint
          const res2 = await fetch(`${root}/api/short-link/resolve/${targetCode}`);
          if (res2.ok) {
            const data2 = await res2.json();
            setInfo({
              code: targetCode,
              longUrl: data2.longUrl,
              productName: "Sản phẩm tiếp thị hoàn tiền",
              platform: "SHOPEE",
              rawCommissionMoney: 0,
              netCommissionMoney: 0
            });
          } else {
            setError("Liên kết không tồn tại hoặc đã hết hạn.");
          }
        }
      } catch (e) {
        console.error("Lỗi khi tải thông tin sản phẩm:", e);
        setError("Không thể kết nối đến máy chủ.");
      } finally {
        setLoading(false);
      }
    };

    fetchInfo();
  }, [code, apiRoot]);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenTarget = () => {
    if (info && info.longUrl) {
      // Mở link dài affiliate trực tiếp để ứng dụng Shopee kích hoạt mở app ngay lập tức
      window.location.href = info.longUrl;
    }
  };

  const formatVnd = (num) => {
    if (!num || isNaN(num)) return "0đ";
    return Math.round(num).toLocaleString("vi-VN") + "đ";
  };

  if (loading) {
    return (
      <div className="sym-container">
        <style>{symuesLandingStyles}</style>
        <div className="sym-loading-box">
          <div className="sym-spinner"></div>
          <p className="sym-loading-title">28SYMUES AFFILIATE</p>
          <p className="sym-loading-sub">Đang đồng bộ dữ liệu hoa hồng sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (error || !info) {
    return (
      <div className="sym-container">
        <style>{symuesLandingStyles}</style>
        <div className="sym-error-card">
          <div className="sym-error-icon">⚠️</div>
          <h2 className="sym-error-title">Không tìm thấy sản phẩm</h2>
          <p className="sym-error-desc">{error || "Liên kết này không tồn tại hoặc đã quá hạn."}</p>
          <button type="button" onClick={() => (window.location.href = "/lookup")} className="sym-btn-primary">
            🔍 Tra cứu đơn hàng của bạn
          </button>
        </div>
      </div>
    );
  }

  // Tính toán hoa hồng theo đúng dự án 28Symues: Chia 8/2 - Thuế 10%
  const rawComm = info.rawCommissionMoney || 0;
  const taxComm = rawComm * 0.10; // Thuế TNCN 10%
  const netComm = info.netCommissionMoney || (rawComm > 0 ? (rawComm * 0.90 * 0.80) : 0); // Khách nhận 80% sau thuế
  const shopeeComm = info.shopeeCommissionMoney || 0;
  const sellerComm = info.sellerCommissionMoney || 0;
  const hasSplit = shopeeComm > 0 || sellerComm > 0;

  const isTiktok = (info.platform || "").toUpperCase().includes("TIKTOK");
  const platformName = isTiktok ? "TikTok Shop" : "Shopee";
  const displayHost = "28symues.id.vn";

  return (
    <div className="sym-container">
      <style>{symuesLandingStyles}</style>

      {/* Header App Bar với logo to rõ ràng */}
      <header className="sym-header">
        <button type="button" className="sym-header-back" onClick={() => (window.location.href = "/lookup")} title="Tra cứu đơn hàng">
          ‹
        </button>
        <div className="sym-header-brand" onClick={() => (window.location.href = "/")}>
          <img 
            src="/28symueslogomanin.png" 
            alt="28Symues Logo" 
            className="sym-brand-logo" 
            onError={(e) => { e.target.src = "/MAIN.png"; }} 
          />
          <div className="sym-brand-titles">
            <span className="sym-brand-name">28SYMUES AFFILIATE</span>
            <span className="sym-brand-domain">{displayHost}</span>
          </div>
        </div>
        <button type="button" onClick={() => (window.location.href = "/lookup")} className="sym-header-lookup-btn">
          Ví của tôi
        </button>
      </header>

      <main className="sym-main">
        {/* Brand Banner Badge - Đúng tỉ lệ 80 - 20 & Thuế 10% */}
        <div className="sym-banner-pill">
          <div className="sym-pill-left">
            <span className="sym-pill-icon">💰</span>
            <span className="sym-pill-text-orange">28Symues Hoàn Tiền</span>
            <span className="sym-pill-badge-ratio">Tỉ Lệ 80 - 20</span>
          </div>
          <div className="sym-pill-right">
            <span className="sym-pill-tax-tag">Thuế TNCN 10%</span>
          </div>
        </div>

        {/* User Card với avatar chính thức của website (/MAIN.png) */}
        <div className="sym-card sym-user-card">
          <div className="sym-user-left">
            <div className="sym-user-avatar-wrap">
              <img 
                src="/MAIN.png" 
                alt="Avatar Web" 
                className="sym-user-avatar-img" 
                onError={(e) => { e.target.src = "/avatarmeo.png"; }} 
              />
            </div>
            <div className="sym-user-meta">
              <div className="sym-user-greeting">
                Xin chào, <span className="sym-user-name">{info.senderName || "Phạm Thắng"}</span>
              </div>
              <div className="sym-user-subid">
                <span className="sym-subid-label">Zalo ID:</span> {info.subId || "Thành viên"}
              </div>
            </div>
          </div>
          <button type="button" onClick={() => (window.location.href = "/lookup")} className="sym-btn-check-wallet">
            Tra cứu ví ›
          </button>
        </div>

        {/* Main Product Card */}
        <div className="sym-card sym-product-card">
          {/* Product Header: Image & Title */}
          <div className="sym-prod-top">
            <div className="sym-img-container">
              {info.imageUrl && !imgError ? (
                <img 
                  src={info.imageUrl} 
                  alt={info.productName} 
                  className="sym-prod-img" 
                  onError={() => setImgError(true)} 
                />
              ) : (
                <div className="sym-prod-fallback">
                  <img src="/MAIN.png" alt="Fallback Product" className="sym-fallback-img" />
                </div>
              )}
              <div className="sym-platform-tag">
                {isTiktok ? "TIKTOK SHOP" : "SHOPEE XTRA"}
              </div>
            </div>

            <div className="sym-prod-info">
              <span className="sym-platform-badge">
                <img 
                  src={isTiktok ? "/tiktok-icon.svg" : "/shopee-icon.svg"} 
                  alt="" 
                  className="sym-platform-icon" 
                  onError={(e) => { e.target.style.display = 'none'; }} 
                />
                Mua trên {platformName}
              </span>
              <h1 className="sym-prod-title">{info.productName || "Sản phẩm tiếp thị hoàn tiền 28Symues"}</h1>
            </div>
          </div>

          {/* Commission Calculation Breakdown - Chia 2 Hoa Hồng Rõ Ràng & Minh bạch 8/2 */}
          <div className="sym-breakdown-box">
            <div className="sym-breakdown-title">
              <span>📊 BẢNG TÍNH HOA HỒNG CHI TIẾT</span>
              <span className="sym-badge-verified">Minh bạch 100%</span>
            </div>

            {/* Chia 2 phần hoa hồng: Shopee & Shop (nếu có dữ liệu) */}
            {hasSplit && (
              <>
                <div className="sym-breakdown-row sym-row-subcom">
                  <div className="sym-row-label">
                    <span className="sym-row-bullet">🔸</span>
                    <span>Hoa hồng từ sàn Shopee:</span>
                  </div>
                  <div className="sym-row-value">
                    {info.shopeeRateText && (
                      <span className="sym-rate-pill sym-rate-pill-shopee">{info.shopeeRateText}</span>
                    )}
                    <span className="sym-val-sub">
                      ~ {formatVnd(shopeeComm)}
                    </span>
                  </div>
                </div>

                <div className="sym-breakdown-row sym-row-subcom">
                  <div className="sym-row-label">
                    <span className="sym-row-bullet">🔹</span>
                    <span>Hoa hồng từ Shop (Người bán):</span>
                  </div>
                  <div className="sym-row-value">
                    {info.sellerRateText && (
                      <span className="sym-rate-pill sym-rate-pill-seller">{info.sellerRateText}</span>
                    )}
                    <span className="sym-val-sub">
                      ~ {formatVnd(sellerComm)}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Dòng Tổng hoa hồng gốc */}
            <div className="sym-breakdown-row sym-row-total">
              <div className="sym-row-label">
                <span className="sym-row-bullet">🏷️</span>
                <span><strong>Tổng hoa hồng gốc:</strong></span>
              </div>
              <div className="sym-row-value">
                {info.commissionRateText && (
                  <span className="sym-rate-pill">{info.commissionRateText}</span>
                )}
                <span className="sym-val-raw">
                  ~ {rawComm > 0 ? formatVnd(rawComm) : "Chờ cập nhật"}
                </span>
              </div>
            </div>

            {/* Dòng Khấu trừ thuế TNCN 10% */}
            <div className="sym-breakdown-row sym-row-tax">
              <div className="sym-row-label">
                <span className="sym-row-bullet">🏛️</span>
                <span>Tạm tính thuế TNCN (10%):</span>
              </div>
              <div className="sym-row-value sym-val-tax">
                - {taxComm > 0 ? formatVnd(taxComm) : "0đ"}
              </div>
            </div>

            {/* Dòng Khách nhận 80% sau thuế */}
            <div className="sym-cashback-highlight">
              <div className="sym-highlight-header">
                <div className="sym-highlight-badge">
                  <span>✨ HOÀN TIỀN BẠN NHẬN (80% SAU THUẾ)</span>
                </div>
                <span className="sym-share-ratio">Tỉ lệ 8/2</span>
              </div>

              <div className="sym-highlight-amount-wrap">
                <span className="sym-highlight-amount">
                  {netComm > 0 ? formatVnd(netComm) : "Chờ cập nhật"}
                </span>
                <span className="sym-highlight-sub">
                  (Đã tự động khấu trừ 10% thuế TNCN theo quy định sàn)
                </span>
              </div>
            </div>
          </div>

          {/* Big CTA Action Button - Kích hoạt mở link dài Shopee */}
          <div className="sym-cta-block">
            <button type="button" className="sym-btn-cta" onClick={handleOpenTarget}>
              <span className="sym-cta-shine"></span>
              <div className="sym-cta-main">
                <span className="sym-cta-icon">🛍️</span>
                <span className="sym-cta-text">Mua trên {platformName} - Nhận hoàn tiền</span>
                <span className="sym-cta-arrow">➔</span>
              </div>
            </button>
            <p className="sym-cta-note">
              🛡️ Mã Zalo <strong>{info.subId || "Thành viên"}</strong> đã được gán vào đơn để cộng tiền tự động.
            </p>
          </div>
        </div>

        {/* Share Card */}
        <div className="sym-card sym-share-card">
          <div className="sym-share-text">
            <div className="sym-share-title">Gửi link cho bạn bè cùng mua</div>
            <div className="sym-share-desc">Bạn bè nhận hoàn tiền, bạn tích lũy thêm điểm thưởng!</div>
          </div>
          <button type="button" className="sym-btn-copy" onClick={handleCopyLink}>
            {copied ? "✓ Đã sao chép" : "📋 Copy link"}
          </button>
        </div>

        {/* 3 Step Instruction Guide */}
        <div className="sym-card sym-guide-card">
          <div className="sym-guide-header">
            <span className="sym-guide-title">📌 3 BƯỚC MUA HÀNG ĐỂ ĐẢM BẢO CÓ TIỀN</span>
            <span className="sym-guide-badge">Rất quan trọng</span>
          </div>

          <div className="sym-steps-list">
            <div className="sym-step-item">
              <div className="sym-step-num sym-step-num-1">1</div>
              <div className="sym-step-content">
                <strong>Bấm nút "Mua trên {platformName}"</strong> ở trên để mở trực tiếp ứng dụng {platformName}.
              </div>
            </div>

            <div className="sym-step-item">
              <div className="sym-step-num sym-step-num-2">2</div>
              <div className="sym-step-content">
                <strong>Xóa sản phẩm trong giỏ hàng (nếu có từ trước)</strong>, sau đó mới bấm "Thêm vào giỏ" và bấm Đặt mua ngay để sàn ghi nhận hoa hồng.
              </div>
            </div>

            <div className="sym-step-item">
              <div className="sym-step-num sym-step-num-3">3</div>
              <div className="sym-step-content">
                <strong>Đơn hàng xuất hiện tự động sau 15-30 phút</strong>. Bạn có thể vào lại website <strong>28symues.id.vn/lookup</strong> để kiểm tra số dư và rút tiền.
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Zalo Contact Button như trên website chính */}
      <a 
        href="https://zalo.me/g/0p083nqqoordpki9zgvy" 
        target="_blank" 
        rel="noreferrer" 
        className="sym-floating-zalo"
        title="Chat Zalo hỗ trợ hoàn tiền"
      >
        <div className="sym-floating-zalo-inner">
          <span className="sym-zalo-text-icon">Zalo</span>
          <span className="sym-zalo-online-dot"></span>
        </div>
      </a>

      {/* Menu Chân Trang CHUẨN CỦA WEBSITE (Hoạt động 100% khi bấm) */}
      <nav className="mobile-bottom-nav sym-site-nav">
        {/* 1. Trang chủ */}
        <button 
          type="button" 
          className="mobile-bottom-nav-item" 
          onClick={() => { window.location.href = '/'; }}
        >
          <div className="nav-icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
          </div>
          <span className="nav-label">Trang chủ</span>
        </button>

        {/* 2. Tra cứu */}
        <button 
          type="button" 
          className="mobile-bottom-nav-item active" 
          onClick={() => { window.location.href = '/lookup'; }}
        >
          <div className="nav-icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <span className="nav-label">Tra cứu</span>
        </button>

        {/* 3. Bot Zalo */}
        <a 
          href="https://zalo.me/g/0p083nqqoordpki9zgvy" 
          target="_blank" 
          rel="noreferrer" 
          className="mobile-bottom-nav-item" 
          title="Nhắn tin với Bot Zalo hoàn tiền"
        >
          <div className="nav-icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
            </svg>
          </div>
          <span className="nav-label">Bot Zalo</span>
        </a>

        {/* 4. Hướng dẫn */}
        <button 
          type="button" 
          className="mobile-bottom-nav-item" 
          onClick={() => { window.location.href = '/#steps'; }}
        >
          <div className="nav-icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <span className="nav-label">Hướng dẫn</span>
        </button>

        {/* 5. Quản trị */}
        <button 
          type="button" 
          className="mobile-bottom-nav-item" 
          onClick={() => { window.location.href = '/?view=login'; }}
        >
          <div className="nav-icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" />
            </svg>
          </div>
          <span className="nav-label">Quản trị</span>
        </button>
      </nav>
    </div>
  );
}

const symuesLandingStyles = `
/* ==========================================================================
   28SYMUES AFFILIATE - PRODUCT LANDING VIEW
   Palette: Amber/Orange (#f97316 / #ea580c), Dark Navy (#101828), Cream Warm (#fffaf5)
   Ratio: 8/2 (Khách nhận 80% sau thuế 10%)
   ========================================================================== */

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: #f7f3ed;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color: #101828;
  -webkit-font-smoothing: antialiased;
}

.sym-container {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  background: linear-gradient(180deg, #fffaf5 0%, #fff6ee 30%, #fdf2e9 100%);
  position: relative;
  padding-bottom: 96px;
  box-shadow: 0 0 50px rgba(234, 88, 12, 0.08), 0 0 20px rgba(0, 0, 0, 0.04);
}

/* Loading Box */
.sym-loading-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  padding: 24px;
  text-align: center;
}

.sym-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #ffedd5;
  border-top-color: #ea580c;
  border-right-color: #f97316;
  border-radius: 50%;
  animation: sym-spin 0.75s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite;
  margin-bottom: 20px;
}

@keyframes sym-spin {
  to { transform: rotate(360deg); }
}

.sym-loading-title {
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 1px;
  color: #ea580c;
  margin-bottom: 6px;
}

.sym-loading-sub {
  font-size: 13px;
  color: #64748b;
}

/* Error Card */
.sym-error-card {
  background: #ffffff;
  border-radius: 24px;
  padding: 36px 24px;
  margin: 60px 20px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(234, 88, 12, 0.08);
  border: 1.5px solid #fed7aa;
}

.sym-error-icon {
  font-size: 44px;
  margin-bottom: 12px;
}

.sym-error-title {
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 8px;
}

.sym-error-desc {
  font-size: 13.5px;
  color: #64748b;
  margin-bottom: 24px;
  line-height: 1.5;
}

.sym-btn-primary {
  display: inline-block;
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: #ffffff;
  font-weight: 700;
  font-size: 14px;
  padding: 12px 24px;
  border-radius: 14px;
  border: none;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(234, 88, 12, 0.35);
  transition: transform 0.15s ease;
}

.sym-btn-primary:active {
  transform: scale(0.98);
}

/* Header App Bar - Logo to rõ ràng */
.sym-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(254, 215, 170, 0.6);
  position: sticky;
  top: 0;
  z-index: 50;
}

.sym-header-back {
  background: #fff7ed;
  border: 1px solid #ffedd5;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  line-height: 1;
  color: #ea580c;
  cursor: pointer;
  padding-bottom: 3px;
  transition: all 0.15s ease;
}

.sym-header-back:hover {
  background: #ffedd5;
}

.sym-header-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.sym-brand-logo {
  width: 44px;
  height: 44px;
  object-fit: contain;
  border-radius: 10px;
  filter: drop-shadow(0 2px 4px rgba(234, 88, 12, 0.2));
}

.sym-brand-titles {
  display: flex;
  flex-direction: column;
}

.sym-brand-name {
  font-size: 14px;
  font-weight: 900;
  letter-spacing: 0.5px;
  color: #101828;
}

.sym-brand-domain {
  font-size: 11px;
  font-weight: 700;
  color: #ea580c;
}

.sym-header-lookup-btn {
  background: #fff7ed;
  border: 1px solid #fed7aa;
  color: #ea580c;
  font-size: 11.5px;
  font-weight: 700;
  padding: 6px 14px;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.sym-header-lookup-btn:hover {
  background: #ea580c;
  color: #ffffff;
}

/* Main Content Area */
.sym-main {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Banner Pill */
.sym-banner-pill {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  border-radius: 999px;
  padding: 6px 12px;
  border: 1px solid #fed7aa;
  box-shadow: 0 2px 8px rgba(234, 88, 12, 0.06);
}

.sym-pill-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sym-pill-icon {
  font-size: 16px;
}

.sym-pill-text-orange {
  font-size: 12px;
  font-weight: 800;
  color: #ea580c;
}

.sym-pill-badge-ratio {
  background: linear-gradient(135deg, #f97316, #ea580c);
  color: #ffffff;
  font-size: 10px;
  font-weight: 800;
  padding: 2.5px 8px;
  border-radius: 999px;
  box-shadow: 0 2px 6px rgba(234, 88, 12, 0.25);
  letter-spacing: 0.3px;
}

.sym-pill-tax-tag {
  font-size: 10px;
  font-weight: 700;
  color: #475467;
  background: #f2f4f7;
  padding: 2.5px 8px;
  border-radius: 999px;
  border: 1px solid #eaecf0;
}

/* Cards Base */
.sym-card {
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 4px 16px rgba(16, 24, 40, 0.04);
  border: 1px solid #ffedd5;
  padding: 14px 16px;
}

/* User Card - Avatar chuẩn của web */
.sym-user-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sym-user-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sym-user-avatar-wrap {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: #fff7ed;
  border: 2px solid #f97316;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(249, 115, 22, 0.18);
}

.sym-user-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sym-user-meta {
  display: flex;
  flex-direction: column;
}

.sym-user-greeting {
  font-size: 13px;
  color: #475467;
  font-weight: 600;
}

.sym-user-name {
  color: #ea580c;
  font-weight: 800;
}

.sym-user-subid {
  font-size: 11.5px;
  color: #98a2b3;
  margin-top: 2px;
  font-family: SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.sym-subid-label {
  color: #667085;
  font-weight: 500;
}

.sym-btn-check-wallet {
  background: #fff7ed;
  color: #ea580c;
  border: 1px solid #fed7aa;
  font-size: 11.5px;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.sym-btn-check-wallet:hover {
  background: #ea580c;
  color: #ffffff;
}

/* Product Card */
.sym-product-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
}

.sym-prod-top {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.sym-img-container {
  width: 98px;
  height: 98px;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
  background: #f8fafc;
  border: 1px solid #eaecf0;
}

.sym-prod-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sym-prod-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff7ed;
}

.sym-fallback-img {
  width: 70%;
  height: 70%;
  object-fit: contain;
}

.sym-platform-tag {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: #ea580c;
  color: #ffffff;
  font-size: 8px;
  font-weight: 900;
  text-align: center;
  padding: 2.5px 0;
  letter-spacing: 0.3px;
}

.sym-prod-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sym-platform-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10.5px;
  font-weight: 700;
  color: #ea580c;
  background: #fff7ed;
  border: 1px solid #ffedd5;
  padding: 2px 8px;
  border-radius: 999px;
  width: fit-content;
}

.sym-platform-icon {
  width: 13px;
  height: 13px;
}

.sym-prod-title {
  font-size: 14px;
  font-weight: 800;
  color: #101828;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Commission Breakdown Box */
.sym-breakdown-box {
  background: #fcfcfd;
  border: 1px solid #eaecf0;
  border-radius: 16px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.sym-breakdown-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11.5px;
  font-weight: 800;
  color: #475467;
  padding-bottom: 6px;
  border-bottom: 1px dashed #eaecf0;
}

.sym-badge-verified {
  font-size: 9.5px;
  font-weight: 700;
  color: #027a48;
  background: #ecfdf3;
  border: 1px solid #abefc6;
  padding: 1px 6px;
  border-radius: 999px;
}

.sym-breakdown-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
}

.sym-row-subcom {
  padding-left: 4px;
  color: #475467;
}

.sym-row-total {
  padding-top: 4px;
  border-top: 1px dashed #f2f4f7;
}

.sym-row-label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #475467;
  font-weight: 600;
}

.sym-row-bullet {
  font-size: 12px;
}

.sym-row-value {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sym-rate-pill {
  font-size: 10px;
  font-weight: 800;
  color: #c24e02;
  background: #fff0d5;
  padding: 1.5px 6px;
  border-radius: 6px;
}

.sym-rate-pill-shopee {
  color: #c24e02;
  background: #ffedd5;
}

.sym-rate-pill-seller {
  color: #027a48;
  background: #ecfdf3;
}

.sym-val-sub {
  font-weight: 600;
  color: #344054;
  font-size: 11.5px;
}

.sym-val-raw {
  font-weight: 700;
  color: #101828;
}

.sym-row-tax .sym-row-label {
  color: #667085;
}

.sym-val-tax {
  font-weight: 600;
  color: #b42318;
  font-size: 12px;
}

/* Cashback Highlight Box - 80% After Tax */
.sym-cashback-highlight {
  background: linear-gradient(135deg, #fff9ed 0%, #ffedd5 100%);
  border: 1.5px solid #f97316;
  border-radius: 14px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
  box-shadow: 0 4px 14px rgba(249, 115, 22, 0.12);
}

.sym-highlight-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sym-highlight-badge {
  font-size: 11px;
  font-weight: 900;
  color: #ea580c;
  letter-spacing: 0.3px;
}

.sym-share-ratio {
  font-size: 10px;
  font-weight: 800;
  color: #ffffff;
  background: #ea580c;
  padding: 2px 7px;
  border-radius: 999px;
}

.sym-highlight-amount-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sym-highlight-amount {
  font-size: 24px;
  font-weight: 900;
  color: #c24e02;
  line-height: 1.2;
}

.sym-highlight-sub {
  font-size: 10.5px;
  color: #7c340e;
  font-weight: 500;
}

/* CTA Action */
.sym-cta-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sym-btn-cta {
  width: 100%;
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  border: none;
  border-radius: 18px;
  padding: 14px 20px;
  color: #ffffff;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(234, 88, 12, 0.36);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.sym-btn-cta:hover {
  transform: translateY(-1.5px);
  box-shadow: 0 10px 28px rgba(234, 88, 12, 0.45);
}

.sym-btn-cta:active {
  transform: translateY(1px);
}

.sym-cta-main {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.sym-cta-icon {
  font-size: 20px;
}

.sym-cta-text {
  font-size: 15px;
  font-weight: 900;
  letter-spacing: 0.2px;
}

.sym-cta-arrow {
  font-size: 16px;
  font-weight: 900;
}

.sym-cta-note {
  font-size: 11.5px;
  color: #667085;
  text-align: center;
  line-height: 1.4;
}

.sym-cta-note strong {
  color: #ea580c;
}

/* Share Card */
.sym-share-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
}

.sym-share-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sym-share-title {
  font-size: 13px;
  font-weight: 800;
  color: #101828;
}

.sym-share-desc {
  font-size: 11px;
  color: #667085;
}

.sym-btn-copy {
  background: #fff7ed;
  border: 1px solid #fed7aa;
  color: #ea580c;
  font-size: 12px;
  font-weight: 800;
  padding: 8px 14px;
  border-radius: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.sym-btn-copy:hover {
  background: #ea580c;
  color: #ffffff;
}

/* Guide Card */
.sym-guide-card {
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sym-guide-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 1px solid #f2f4f7;
}

.sym-guide-title {
  font-size: 12px;
  font-weight: 800;
  color: #101828;
}

.sym-guide-badge {
  font-size: 10px;
  font-weight: 800;
  color: #b42318;
  background: #fef3f2;
  border: 1px solid #fecdca;
  padding: 1.5px 7px;
  border-radius: 999px;
}

.sym-steps-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sym-step-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.sym-step-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 900;
  color: #ffffff;
  flex-shrink: 0;
  margin-top: 1px;
}

.sym-step-num-1 { background: #ea580c; }
.sym-step-num-2 { background: #f97316; }
.sym-step-num-3 { background: #12b76a; }

.sym-step-content {
  font-size: 12px;
  color: #344054;
  line-height: 1.5;
}

.sym-step-content strong {
  color: #101828;
}

/* Floating Zalo Contact Button */
.sym-floating-zalo {
  position: fixed;
  bottom: 74px;
  right: calc(50% - 220px);
  z-index: 99;
  text-decoration: none;
}

@media (max-width: 480px) {
  .sym-floating-zalo {
    right: 16px;
  }
}

.sym-floating-zalo-inner {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0084ff, #0066cc);
  box-shadow: 0 4px 18px rgba(0, 102, 204, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.sym-floating-zalo-inner:hover {
  transform: scale(1.08);
}

.sym-zalo-text-icon {
  color: #ffffff;
  font-weight: 900;
  font-size: 14px;
  letter-spacing: -0.3px;
}

.sym-zalo-online-dot {
  position: absolute;
  bottom: 3px;
  right: 3px;
  width: 12px;
  height: 12px;
  background: #12b76a;
  border: 2px solid #ffffff;
  border-radius: 50%;
}

/* Menu chân trang chính thức của Website */
.sym-site-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-top: 1px solid rgba(254, 215, 170, 0.6);
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 8px 10px 10px;
  z-index: 60;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.06);
}

.mobile-bottom-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: none;
  border: none;
  text-decoration: none;
  color: #667085;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 8px;
  gap: 3px;
  transition: all 0.15s ease;
}

.mobile-bottom-nav-item:hover, .mobile-bottom-nav-item.active {
  color: #ea580c;
}

.nav-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-label {
  font-size: 10.5px;
  font-weight: 700;
}
`;
