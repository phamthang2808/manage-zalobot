import React, { useEffect, useState } from "react";

export function ProductLandingView({ code, apiRoot = "" }) {
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");
  const [copiedAff, setCopiedAff] = useState(false);
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

  const handleOpenTarget = () => {
    if (info && info.longUrl) {
      // Mở trực tiếp link dài affiliate để app Shopee kích hoạt mở app ngay lập tức
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

      {/* Header App Bar: Logo bên trái, Tên miền bên phải (tách sang 2 bên) */}
      <header className="sym-header">
        <div className="sym-header-left">
          <button type="button" className="sym-header-back" onClick={() => (window.location.href = "/lookup")} title="Quay lại">
            ‹
          </button>
          <img 
            src="/28symueslogomanin.png" 
            alt="28Symues Logo" 
            className="sym-brand-logo-img" 
            onClick={() => (window.location.href = "/")}
            onError={(e) => { e.target.src = "/MAIN.png"; }} 
          />
        </div>
        <div className="sym-header-right" onClick={() => (window.location.href = "/")}>
          <span className="sym-brand-domain-badge">{displayHost}</span>
        </div>
      </header>

      <main className="sym-main">
        {/* User Card: Avatar là favicon (/favaicon28symues.png) vừa khít, Zalo ID rõ nét, Nút tra cứu 1 hàng không bể */}
        <div className="sym-card sym-user-card">
          <div className="sym-user-left">
            <div className="sym-user-avatar-wrap">
              <img 
                src="/favaicon28symues.png" 
                alt="Avatar" 
                className="sym-user-avatar-img" 
                onError={(e) => { e.target.src = "/fvc.png"; }} 
              />
            </div>
            <div className="sym-user-meta">
              <div className="sym-user-greeting">
                Xin chào, <span className="sym-user-name">{info.senderName || "Phạm Thắng"}</span>
              </div>
              <div className="sym-user-subid">
                <span className="sym-subid-label">Zalo ID:</span>
                <span className="sym-subid-val">{info.subId || "Thành viên"}</span>
              </div>
            </div>
          </div>
          <button type="button" onClick={handleGoUserWallet} className="sym-btn-check-wallet" title="Tra cứu đơn hàng và số dư của Zalo này">
            Tra cứu ví ›
          </button>
        </div>

        {/* Main Product Card */}
        <div className="sym-card sym-product-card">
          {/* Product Header: Image (Đã bỏ thẻ Shopee Xtra) & Title (Đậm nét không bị mờ trên điện thoại) */}
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
                  <img src="/favaicon28symues.png" alt="Fallback Product" className="sym-fallback-img" />
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

          {/* Bảng Hoa Hồng Sản Phẩm (Đã xóa chữ Minh bạch 100%, không bị bể số tiền) */}
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

            {/* Chia 2 phần hoa hồng: Shopee & Shop (label gọn, value nowrap không bị bể dòng) */}
            {hasSplit && (
              <>
                <div className="sym-breakdown-row sym-row-subcom">
                  <div className="sym-row-label">
                    <span className="sym-row-bullet">🔸</span>
                    <span>Hoa hồng Shopee:</span>
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
                    <span>Hoa hồng Shop:</span>
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

            {/* Dòng Tổng hoa hồng */}
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

          {/* HÀNG NÚT: MUA NGAY TRÊN SHOPEE + COPY LINK DÀI CÙNG 1 HÀNG */}
          <div className="sym-action-row">
            <button type="button" className="sym-btn-cta-main" onClick={handleOpenTarget}>
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
                <i className="fa-solid fa-chevron-right sym-cta-arrow"></i>
              </div>
            </button>

            {info.longUrl && (
              <button 
                type="button" 
                className={`sym-btn-copy-aff-row ${copiedAff ? "is-copied" : ""}`} 
                onClick={handleCopyAffiliateLink} 
                title="Sao chép link affiliate dài Shopee"
              >
                {copiedAff ? (
                  <>
                    <i className="fa-solid fa-check sym-copy-icon"></i>
                    <span>Đã chép</span>
                  </>
                ) : (
                  <>
                    <i className="fa-regular fa-copy sym-copy-icon"></i>
                    <span>Copy link</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mẹo Nhận Hoa Hồng Chuẩn 100% (Đã căn chỉnh không bể dòng & cập nhật chú thích ấn link lần 2) */}
        <div className="sym-card sym-guide-card">
          <div className="sym-guide-header">
            <span className="sym-guide-title">💡 Mẹo nhỏ nhận hoa hồng chuẩn 100%:</span>
          </div>

          <div className="sym-tips-box">
            <div className="sym-tip-step">
              <span className="sym-tip-bullet">❌</span>
              <span className="sym-tip-text"><strong>Xóa sp cũ trong giỏ</strong> (nếu đã lỡ thêm từ trước).</span>
            </div>
            <div className="sym-tip-step">
              <span className="sym-tip-bullet">➔</span>
              <span className="sym-tip-text"><strong>Bấm link vào App Shopee</strong> (nên ấn vào link lần 2 tăng tỉ lệ).</span>
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

/* Header App Bar: Logo bên trái, Tên miền bên phải (tách sang 2 bên) */
.sym-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(254, 215, 170, 0.6);
  position: sticky;
  top: 0;
  z-index: 50;
  min-height: 60px;
}

.sym-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sym-header-right {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.sym-header-back {
  background: #fff7ed;
  border: 1px solid #ffedd5;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  line-height: 1;
  color: #ea580c;
  cursor: pointer;
  padding-bottom: 2px;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.sym-header-back:hover {
  background: #ffedd5;
}

.sym-brand-logo-img {
  height: 40px;
  max-width: 145px;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(234, 88, 12, 0.18));
  cursor: pointer;
}

.sym-brand-domain-badge {
  font-size: 12px;
  font-weight: 800;
  color: #ea580c;
  background: #fff7ed;
  border: 1px solid #ffedd5;
  padding: 4px 10px;
  border-radius: 8px;
  letter-spacing: 0.2px;
  box-shadow: 0 1px 4px rgba(234, 88, 12, 0.08);
  white-space: nowrap;
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

/* User Card - Avatar favicon vừa khít, Zalo ID rõ nét, Nút tra cứu 1 hàng không bể */
.sym-user-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.sym-user-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.sym-user-avatar-wrap {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #fff7ed;
  border: 2.5px solid #f97316;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(249, 115, 22, 0.22);
}

.sym-user-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.sym-user-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.sym-user-greeting {
  font-size: 13.5px;
  color: #334155;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sym-user-name {
  color: #ea580c;
  font-weight: 800;
}

.sym-user-subid {
  font-size: 12.5px;
  margin-top: 3px;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sym-subid-label {
  color: #64748b;
  font-weight: 600;
}

.sym-subid-val {
  color: #1e293b;
  font-weight: 800;
  font-family: SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

/* Nút tra cứu ví trên 1 hàng không bị bể */
.sym-btn-check-wallet {
  white-space: nowrap !important;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fff7ed, #ffedd5);
  color: #c24e02;
  border: 1px solid #fed7aa;
  font-size: 12px;
  font-weight: 800;
  padding: 8px 14px;
  border-radius: 999px;
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
  border-radius: 16px;
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
  width: 65%;
  height: 65%;
  object-fit: contain;
}

.sym-prod-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
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

/* Tên sản phẩm rõ ràng, không bị mờ trên điện thoại */
.sym-prod-title {
  font-size: 14px;
  font-weight: 800;
  color: #0f172a !important;
  -webkit-text-fill-color: #0f172a !important;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-shadow: none !important;
  opacity: 1 !important;
}

/* Commission Breakdown Box (Gọn gàng, không bị bể số tiền) */
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
  gap: 8px;
  font-size: 13px;
}

.sym-row-subcom {
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
  color: #334155;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.sym-row-bullet {
  font-size: 13px;
}

.sym-row-value {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap !important;
  flex-shrink: 0;
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
  font-weight: 700;
  color: #344054;
  font-size: 12.5px;
  white-space: nowrap;
}

.sym-val-total {
  font-weight: 900;
  color: #ea580c;
  font-size: 14.5px;
  white-space: nowrap;
}

/* HÀNG NÚT: MUA NGAY TRÊN SHOPEE + COPY LINK DÀI CÙNG 1 HÀNG (Bo góc nhẹ 8px chữ nhật, chống bể trên mobile) */
.sym-action-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.sym-btn-cta-main {
  flex: 1.4;
  min-width: 0;
  height: 46px;
  border: none;
  background: linear-gradient(135deg, #ff5722 0%, #ee4d2d 45%, #d0011b 100%);
  border-radius: 8px;
  padding: 0 8px;
  color: #ffffff;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-shadow: 0 6px 18px -2px rgba(238, 77, 45, 0.42), 0 2px 4px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sym-btn-cta-main:hover {
  transform: translateY(-1.5px);
  box-shadow: 0 10px 24px -2px rgba(238, 77, 45, 0.52);
}

.sym-btn-cta-main:active {
  transform: translateY(0) scale(0.98);
}

.sym-cta-glow {
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transform: skewX(-20deg);
  animation: sym-glow-sweep 3s infinite;
}

@keyframes sym-glow-sweep {
  0% { left: -100%; }
  35%, 100% { left: 160%; }
}

.sym-cta-body {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  position: relative;
  z-index: 2;
  width: 100%;
  min-width: 0;
}

.sym-cta-icon-box {
  width: 22px;
  height: 22px;
  background: rgba(255, 255, 255, 0.22);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sym-cta-shopee-svg {
  width: 13px;
  height: 13px;
  fill: #ffffff;
}

.sym-cta-title-text {
  font-size: 13.5px;
  font-weight: 800;
  letter-spacing: -0.3px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sym-cta-arrow {
  font-size: 10px;
  opacity: 0.9;
  flex-shrink: 0;
}

.sym-btn-cta-main:hover .sym-cta-arrow {
  transform: translateX(2px);
}

/* Nút Copy link cùng hàng */
.sym-btn-copy-aff-row {
  flex: 1;
  min-width: 0;
  height: 46px;
  background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
  border: 1.5px solid #fdba74;
  color: #c2410c;
  font-size: 12.5px;
  font-weight: 800;
  padding: 0 8px;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 3px 10px rgba(234, 88, 12, 0.08);
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.sym-btn-copy-aff-row:hover {
  background: linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%);
  border-color: #f97316;
  color: #9a3412;
  transform: translateY(-1.5px);
}

.sym-btn-copy-aff-row:active {
  transform: translateY(0) scale(0.97);
}

.sym-btn-copy-aff-row.is-copied {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border-color: #6ee7b7;
  color: #047857;
}

.sym-copy-icon {
  font-size: 12px;
  flex-shrink: 0;
}

@media (max-width: 420px) {
  .sym-cta-title-text {
    font-size: 12px;
    letter-spacing: -0.4px;
  }
  .sym-btn-cta-main {
    height: 44px;
    padding: 0 5px;
  }
  .sym-btn-copy-aff-row {
    height: 44px;
    padding: 0 5px;
    font-size: 11.5px;
  }
  .sym-cta-icon-box {
    width: 20px;
    height: 20px;
  }
  .sym-cta-shopee-svg {
    width: 12px;
    height: 12px;
  }
}

/* Guide Card - Mẹo nhỏ nhận hoa hồng chuẩn 100% */
.sym-guide-card {
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sym-guide-header {
  display: flex;
  align-items: center;
  padding-bottom: 6px;
  border-bottom: 1px solid #f2f4f7;
}

.sym-guide-title {
  font-size: 13.5px;
  font-weight: 800;
  color: #101828;
  white-space: nowrap;
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
  gap: 8px;
  background: #fffaf5;
  border: 1px solid #ffedd5;
  border-radius: 12px;
  padding: 9px 12px;
}

.sym-tip-bullet {
  font-size: 14px;
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
