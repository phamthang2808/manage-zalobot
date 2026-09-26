import React, { useEffect, useState } from "react";

export function ProductLandingView({ code, apiRoot = "" }) {
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");
  const [copiedAff, setCopiedAff] = useState(false);
  const [copiedPage, setCopiedPage] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    // Tự động bóc tách mã code từ URL (hỗ trợ cả /p/code, /p/code?params, /s/code, query params)
    let targetCode = code;
    if (!targetCode) {
      const path = window.location.pathname;
      if (path.includes("/p/")) {
        const part = path.substring(path.indexOf("/p/") + 3);
        targetCode = part.split("/")[0].split("?")[0].split("#")[0].trim();
      } else if (path.includes("/s/")) {
        const part = path.substring(path.indexOf("/s/") + 3);
        targetCode = part.split("/")[0].split("?")[0].split("#")[0].trim();
      } else {
        const params = new URLSearchParams(window.location.search);
        targetCode = params.get("code") || params.get("p") || params.get("c") || params.get("q");
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
        
        // Thử gọi endpoint chi tiết sản phẩm
        let res = await fetch(`${root}/api/short-link/info/${targetCode}`).catch(() => null);
        if (!res || !res.ok) {
          res = await fetch(`${root}/api/public/short-link/info/${targetCode}`).catch(() => null);
        }

        if (res && res.ok) {
          const data = await res.json();
          setInfo(data);
        } else {
          // Fallback sang endpoint giải mã link
          let res2 = await fetch(`${root}/api/public/short-link/${targetCode}`).catch(() => null);
          if (!res2 || !res2.ok) {
            res2 = await fetch(`${root}/api/short-link/resolve/${targetCode}`).catch(() => null);
          }

          if (res2 && res2.ok) {
            const data2 = await res2.json();
            const longUrl = data2.data || data2.longUrl || "";
            setInfo({
              code: targetCode,
              longUrl: longUrl,
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

  // Sao chép link affiliate dài trực tiếp
  const handleCopyAffiliateLink = () => {
    if (info && info.longUrl) {
      navigator.clipboard.writeText(info.longUrl);
      setCopiedAff(true);
      setTimeout(() => setCopiedAff(false), 2000);
    }
  };

  // Sao chép link trang xem hoàn tiền
  const handleCopyPageLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedPage(true);
    setTimeout(() => setCopiedPage(false), 2000);
  };

  const handleOpenTarget = () => {
    if (info && info.longUrl) {
      // Mở trực tiếp link dài affiliate để app Shopee/TikTok kích hoạt mở app ngay lập tức
      window.location.href = info.longUrl;
    }
  };

  const handleGoUserWallet = () => {
    const zaloId = info?.subId ? encodeURIComponent(info.subId.trim()) : "";
    if (zaloId) {
      window.location.href = `/lookup?zaloId=${zaloId}`;
    } else {
      window.location.href = "/lookup";
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

  const rawComm = info.rawCommissionMoney || 0;
  const productPrice = info.productPrice || 0;
  const shopeeComm = info.shopeeCommissionMoney || 0;
  const sellerComm = info.sellerCommissionMoney || 0;
  const hasSplit = shopeeComm > 0 || sellerComm > 0;

  const isTiktok = (info.platform || "").toUpperCase().includes("TIKTOK");
  const platformName = isTiktok ? "TikTok Shop" : "Shopee";
  const displayHost = "28symues.id.vn";

  return (
    <div className="sym-container">
      <style>{symuesLandingStyles}</style>

      {/* Header App Bar: Logo to bên trái/giữa, Tên miền bên phải logo, Bỏ nút Ví của tôi */}
      <header className="sym-header">
        <button type="button" className="sym-header-back" onClick={() => (window.location.href = "/lookup")} title="Quay lại">
          ‹
        </button>
        <div className="sym-header-brand-wrap" onClick={() => (window.location.href = "/")}>
          <img 
            src="/28symueslogomanin.png" 
            alt="28Symues Logo" 
            className="sym-brand-logo-img" 
            onError={(e) => { e.target.src = "/MAIN.png"; }} 
          />
          <span className="sym-brand-domain-badge">{displayHost}</span>
        </div>
        <div className="sym-header-placeholder"></div>
      </header>

      <main className="sym-main">
        {/* User Card với avatar chính thức của website (/MAIN.png) & Nút vào đúng trang tra cứu của người đó */}
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
          <button type="button" onClick={handleGoUserWallet} className="sym-btn-check-wallet" title="Tra cứu đơn hàng và số dư của Zalo này">
            Tra cứu ví ›
          </button>
        </div>

        {/* Main Product Card */}
        <div className="sym-card sym-product-card">
          {/* Product Header: Image (Đã bỏ thẻ Shopee Xtra) & Title */}
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

          {/* Bảng Hoa Hồng Sản Phẩm (Đã xóa chữ Minh bạch 100%, bỏ thuế, gọn gàng) */}
          <div className="sym-breakdown-box">
            <div className="sym-breakdown-title">
              <span>📊 THÔNG TIN HOA HỒNG SẢN PHẨM</span>
            </div>

            {/* Giá tham khảo nếu có */}
            {productPrice > 0 && (
              <div className="sym-breakdown-row">
                <div className="sym-row-label">
                  <span className="sym-row-bullet">💵</span>
                  <span>Giá tham khảo:</span>
                </div>
                <div className="sym-row-value">
                  <span className="sym-val-price">đ{formatVnd(productPrice)}</span>
                </div>
              </div>
            )}

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
                <span className="sym-row-bullet">💰</span>
                <span><strong>Tổng hoa hồng:</strong></span>
              </div>
              <div className="sym-row-value">
                {info.commissionRateText && (
                  <span className="sym-rate-pill sym-rate-pill-total">{info.commissionRateText}</span>
                )}
                <span className="sym-val-total">
                  ~ {rawComm > 0 ? formatVnd(rawComm) : "Chờ cập nhật"}
                </span>
              </div>
            </div>
          </div>

          {/* NÚT MUA TRÊN SHOPEE CỰC ĐẸP (Sleek modern pill, hiệu ứng phát sáng cao cấp) */}
          <div className="sym-cta-block">
            <button type="button" className="sym-btn-cta-premium" onClick={handleOpenTarget}>
              <div className="sym-cta-glow"></div>
              <div className="sym-cta-body">
                <div className="sym-cta-icon-box">
                  <svg className="sym-cta-shopee-svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm7 17H5V8h14v12zm-7-8c-1.66 0-3-1.34-3-3H7c0 2.76 2.24 5 5 5s5-2.24 5-5h-2c0 1.66-1.34 3-3 3z" />
                  </svg>
                </div>
                <span className="sym-cta-title-text">
                  Mua ngay trên {platformName}
                </span>
                <span className="sym-cta-arrow-badge">➔</span>
              </div>
            </button>
            <p className="sym-cta-note">
              🛡️ Mã Zalo <strong>{info.subId || "Thành viên"}</strong> đã được gán vào đơn để tự động cộng tiền.
            </p>
          </div>
        </div>

        {/* Share Card - Hỗ trợ sao chép link Affiliate dài chuẩn xác */}
        <div className="sym-card sym-share-card">
          <div className="sym-share-info">
            <div className="sym-share-title">Chia sẻ link nhận hoa hồng</div>
            <div className="sym-share-desc">Gửi link dài trực tiếp hoặc link web cho bạn bè cùng mua</div>
          </div>
          <div className="sym-share-actions">
            {info.longUrl && (
              <button type="button" className="sym-btn-copy-aff" onClick={handleCopyAffiliateLink} title="Sao chép link affiliate dài Shopee">
                {copiedAff ? "✓ Đã chép link dài" : "🔗 Chép link dài"}
              </button>
            )}
            <button type="button" className="sym-btn-copy-page" onClick={handleCopyPageLink} title="Sao chép link trang xem hoàn tiền này">
              {copiedPage ? "✓ Đã chép web" : "📋 Chép link web"}
            </button>
          </div>
        </div>

        {/* Mẹo Nhận Hoa Hồng Chuẩn 100% (Đúng câu lưu ý của bot) */}
        <div className="sym-card sym-guide-card">
          <div className="sym-guide-header">
            <span className="sym-guide-title">💡 Mẹo nhỏ nhận hoa hồng chuẩn 100%:</span>
            <span className="sym-guide-badge">Lưu ý quan trọng</span>
          </div>

          <div className="sym-tips-box">
            <div className="sym-tip-step">
              <span className="sym-tip-bullet">❌</span>
              <span className="sym-tip-text"><strong>Xóa sp cũ trong giỏ</strong> (nếu đã lỡ thêm từ trước).</span>
            </div>
            <div className="sym-tip-step">
              <span className="sym-tip-bullet">➔</span>
              <span className="sym-tip-text"><strong>Bấm link vào App Shopee</strong> (ấn nút Mua ngay trên Shopee ở trên).</span>
            </div>
            <div className="sym-tip-step">
              <span className="sym-tip-bullet">➔</span>
              <span className="sym-tip-text"><strong>Mua ngay (không xem Live/Video giữa chừng)</strong> nhé sếp ơi!</span>
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

      {/* Menu Chân Trang CHUẨN CỦA WEBSITE - Nút bên phải cùng là Đăng nhập */}
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

        {/* 2. Tra cứu (Nếu có Zalo ID thì tra cứu trực tiếp) */}
        <button 
          type="button" 
          className="mobile-bottom-nav-item active" 
          onClick={handleGoUserWallet}
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

        {/* 5. Đăng nhập (Nút ngoài cùng bên phải) */}
        <button 
          type="button" 
          className="mobile-bottom-nav-item" 
          onClick={() => { window.location.href = '/?view=login'; }}
        >
          <div className="nav-icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          </div>
          <span className="nav-label">Đăng nhập</span>
        </button>
      </nav>
    </div>
  );
}

const symuesLandingStyles = `
/* ==========================================================================
   28SYMUES AFFILIATE - PRODUCT LANDING VIEW
   Palette: Amber/Orange (#f97316 / #ea580c), Dark Navy (#101828), Cream Warm (#fffaf5)
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

/* Header App Bar: Logo to và Tên miền bên phải logo */
.sym-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(254, 215, 170, 0.6);
  position: sticky;
  top: 0;
  z-index: 50;
  min-height: 64px;
}

.sym-header-back {
  background: #fff7ed;
  border: 1px solid #ffedd5;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  line-height: 1;
  color: #ea580c;
  cursor: pointer;
  padding-bottom: 3px;
  transition: all 0.15s ease;
}

.sym-header-back:hover {
  background: #ffedd5;
}

.sym-header-brand-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.sym-brand-logo-img {
  height: 48px;
  max-width: 170px;
  object-fit: contain;
  filter: drop-shadow(0 2px 5px rgba(234, 88, 12, 0.2));
}

.sym-brand-domain-badge {
  font-size: 12px;
  font-weight: 800;
  color: #ea580c;
  background: #fff7ed;
  border: 1px solid #ffedd5;
  padding: 4px 10px;
  border-radius: 999px;
  letter-spacing: 0.3px;
  box-shadow: 0 1px 4px rgba(234, 88, 12, 0.08);
}

.sym-header-placeholder {
  width: 38px;
}

/* Main Content Area */
.sym-main {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  width: 48px;
  height: 48px;
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
  font-size: 13.5px;
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
  background: linear-gradient(135deg, #fff7ed, #ffedd5);
  color: #c24e02;
  border: 1px solid #fed7aa;
  font-size: 12px;
  font-weight: 800;
  padding: 7px 14px;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(234, 88, 12, 0.1);
  transition: all 0.15s ease;
}

.sym-btn-check-wallet:hover {
  background: #ea580c;
  color: #ffffff;
  border-color: #ea580c;
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

/* Commission Breakdown Box (Gọn gàng, không chữ minh bạch 100%) */
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

.sym-breakdown-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12.5px;
}

.sym-row-subcom {
  padding-left: 4px;
  color: #475467;
}

.sym-row-total {
  padding-top: 6px;
  border-top: 1px dashed #eaecf0;
}

.sym-row-label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #475467;
  font-weight: 600;
}

.sym-row-bullet {
  font-size: 13px;
}

.sym-row-value {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sym-val-price {
  font-weight: 800;
  color: #0f172a;
}

.sym-rate-pill {
  font-size: 10.5px;
  font-weight: 800;
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

.sym-rate-pill-total {
  color: #ffffff;
  background: #ea580c;
}

.sym-val-sub {
  font-weight: 600;
  color: #344054;
  font-size: 12px;
}

.sym-val-total {
  font-weight: 800;
  color: #ea580c;
  font-size: 14.5px;
}

/* NÚT MUA TRÊN SHOPEE CỰC ĐẸP (PREMIUM CTA BUTTON) */
.sym-cta-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sym-btn-cta-premium {
  width: 100%;
  border: none;
  background: linear-gradient(135deg, #ff5722 0%, #ea580c 50%, #c2410c 100%);
  border-radius: 999px;
  padding: 13px 20px;
  color: #ffffff;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 26px -4px rgba(234, 88, 12, 0.48), 0 3px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.sym-btn-cta-premium:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 30px -4px rgba(234, 88, 12, 0.55), 0 4px 10px rgba(0, 0, 0, 0.1);
}

.sym-btn-cta-premium:active {
  transform: scale(0.98);
}

.sym-cta-glow {
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent);
  transform: skewX(-20deg);
  animation: sym-glow-sweep 3.5s infinite;
}

@keyframes sym-glow-sweep {
  0% { left: -100%; }
  40%, 100% { left: 150%; }
}

.sym-cta-body {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  position: relative;
  z-index: 2;
}

.sym-cta-icon-box {
  width: 26px;
  height: 26px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sym-cta-shopee-svg {
  width: 15px;
  height: 15px;
}

.sym-cta-title-text {
  font-size: 15px;
  font-weight: 900;
  letter-spacing: 0.3px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.sym-cta-arrow-badge {
  font-size: 15px;
  font-weight: 900;
  margin-left: 2px;
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

/* Share Card - Hỗ trợ sao chép link Affiliate dài */
.sym-share-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #ffffff;
}

.sym-share-info {
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

.sym-share-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sym-btn-copy-aff {
  flex: 1;
  background: linear-gradient(135deg, #fff7ed, #ffedd5);
  border: 1.5px solid #f97316;
  color: #c24e02;
  font-size: 11.5px;
  font-weight: 800;
  padding: 8px 12px;
  border-radius: 12px;
  cursor: pointer;
  text-align: center;
  transition: all 0.15s ease;
}

.sym-btn-copy-aff:hover {
  background: #f97316;
  color: #ffffff;
}

.sym-btn-copy-page {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #475569;
  font-size: 11.5px;
  font-weight: 700;
  padding: 8px 12px;
  border-radius: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.sym-btn-copy-page:hover {
  background: #f1f5f9;
  color: #0f172a;
}

/* Guide Card - Mẹo nhỏ nhận hoa hồng chuẩn 100% */
.sym-guide-card {
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sym-guide-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 1px solid #f2f4f7;
}

.sym-guide-title {
  font-size: 13px;
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

.sym-tips-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 4px;
}

.sym-tip-step {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #fffaf5;
  border: 1px solid #ffedd5;
  border-radius: 12px;
  padding: 10px 12px;
}

.sym-tip-bullet {
  font-size: 15px;
  line-height: 1.3;
  flex-shrink: 0;
}

.sym-tip-text {
  font-size: 12.5px;
  color: #344054;
  line-height: 1.5;
}

.sym-tip-text strong {
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

/* Menu chân trang chính thức của Website - Nút phải cùng là Đăng nhập */
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
