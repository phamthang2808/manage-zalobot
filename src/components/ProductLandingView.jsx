import React, { useEffect, useState } from "react";

export function ProductLandingView({ code, apiRoot = "" }) {
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

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
          // Fallback to resolve endpoint
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
        setError("Không thể tải thông tin sản phẩm.");
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
      window.location.href = info.longUrl;
    }
  };

  const formatVnd = (num) => {
    if (!num || isNaN(num)) return "0đ";
    return Math.round(num).toLocaleString("vi-VN") + "đ";
  };

  if (loading) {
    return (
      <div className="plv-container">
        <style>{landingStyles}</style>
        <div className="plv-loading-wrap">
          <div className="plv-spinner"></div>
          <p className="plv-loading-text">Đang tải thông tin sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (error || !info) {
    return (
      <div className="plv-container">
        <style>{landingStyles}</style>
        <div className="plv-error-box">
          <div className="plv-error-icon">⚠️</div>
          <h2 className="plv-error-title">Không tìm thấy sản phẩm</h2>
          <p className="plv-error-desc">{error || "Liên kết này không tồn tại hoặc đã hết hạn."}</p>
          <a href="/" className="plv-back-btn">Về trang chủ</a>
        </div>
      </div>
    );
  }

  const rawComm = info.rawCommissionMoney || 0;
  const netComm = info.netCommissionMoney || (rawComm > 0 ? rawComm * 0.89 * 0.9 : 0);
  const isTiktok = (info.platform || "").toUpperCase().includes("TIKTOK");
  const platformName = isTiktok ? "TikTok" : "Shopee";
  const displayHost = window.location.host || "28symues.id.vn";

  return (
    <div className="plv-container">
      <style>{landingStyles}</style>

      {/* Top App Header */}
      <div className="plv-app-bar">
        <button type="button" className="plv-back-arrow" onClick={() => (window.location.href = "/")}>
          ‹
        </button>
        <div className="plv-app-bar-title">
          {info.productName || "Chi tiết sản phẩm nhận hoàn tiền"}
        </div>
        <div className="plv-app-bar-more">•••</div>
      </div>

      <div className="plv-content">
        {/* Brand Banner Pill */}
        <div className="plv-brand-pill">
          <div className="plv-brand-left">
            <span className="plv-coin-icon">💰</span>
            <span className="plv-brand-text-orange">Hoàn Tiền</span>
            <span className="plv-brand-text-dark">Shopee - Tiktok</span>
            <span className="plv-badge-pink">90-10</span>
          </div>
          <span className="plv-badge-domain">{displayHost} •</span>
        </div>

        {/* User Greeting Card */}
        <div className="plv-card plv-user-card">
          <div className="plv-user-left">
            <div className="plv-bear-avatar">🐻</div>
            <div className="plv-user-info">
              <div className="plv-user-hello">
                <span>Xin chào</span>
                <span className="plv-user-name">{info.senderName || "Thành viên Zalo"}</span>
              </div>
              <div className="plv-user-id">{info.subId || "8549966105439390564"}</div>
            </div>
          </div>
          <button type="button" className="plv-btn-logout" onClick={() => (window.location.href = "/")}>
            Đăng xuất
          </button>
        </div>

        {/* Main Product Showcase Card */}
        <div className="plv-card plv-product-card">
          <div className="plv-prod-header">
            {/* Image Box */}
            <div className="plv-img-wrapper">
              {info.imageUrl ? (
                <img src={info.imageUrl} alt={info.productName} className="plv-prod-img" />
              ) : (
                <div className="plv-prod-placeholder">🛍️</div>
              )}
              <div className="plv-freeship-tag">MIỄN PHÍ VẬN CHUYỂN</div>
            </div>

            {/* Title */}
            <div className="plv-prod-title-box">
              <h1 className="plv-prod-title">{info.productName || "Sản phẩm tiếp thị hoàn tiền"}</h1>
            </div>
          </div>

          {/* Reward Line 1: Hoa Hồng */}
          <div className="plv-reward-row plv-reward-rose">
            <div className="plv-reward-left">
              <span className="plv-reward-icon">🌷</span>
              <span className="plv-reward-label plv-text-rose">Hoa hồng</span>
            </div>
            <div className="plv-reward-right">
              {info.commissionRateText && (
                <span className="plv-rate-tag plv-rate-rose">{info.commissionRateText}</span>
              )}
              <span className="plv-reward-val plv-text-green">
                ~ {rawComm > 0 ? formatVnd(rawComm) : "Chờ cập nhật"}
              </span>
            </div>
          </div>

          {/* Reward Line 2: Hoàn Trả 90% */}
          <div className="plv-reward-row plv-reward-sky">
            <div className="plv-reward-left">
              <span className="plv-reward-icon">💵</span>
              <span className="plv-reward-label plv-text-sky">Hoàn trả 90%</span>
            </div>
            <div className="plv-reward-right">
              <span className="plv-rate-tag plv-rate-sky">sau thuế</span>
              <span className="plv-reward-val plv-text-sky-val">
                ~ {netComm > 0 ? formatVnd(netComm) : "Chờ cập nhật"}
              </span>
            </div>
          </div>

          {/* Big Orange CTA Button with Star */}
          <div className="plv-cta-container">
            <span className="plv-cta-star">⭐</span>
            <button type="button" className="plv-cta-button" onClick={handleOpenTarget}>
              <div className="plv-cta-content">
                <span className="plv-cta-icon-bag">🛍️</span>
                <span className="plv-cta-text">
                  Mua trên {platformName} - Nhận hoàn tiền
                </span>
                <span className="plv-cta-arrow">›</span>
              </div>
            </button>
          </div>
        </div>

        {/* Share Box */}
        <div className="plv-card plv-share-card">
          <div className="plv-share-info">
            <div className="plv-share-title">Chia sẻ cho bạn bè mua sắm</div>
            <div className="plv-share-desc">Bạn sẽ được nhận hoàn hoa hồng</div>
          </div>
          <button type="button" className="plv-btn-copy" onClick={handleCopyLink}>
            {copied ? "Đã chép ✓" : "Copy link"}
          </button>
        </div>

        {/* Tips & Guide Card */}
        <div className="plv-card plv-guide-card">
          <div className="plv-guide-header">
            <div className="plv-guide-header-left">
              <span className="plv-guide-warn-icon">⚠️</span>
              <span className="plv-guide-title">Mua đúng cách để nhận hoa hồng</span>
            </div>
            <span className="plv-guide-ribbon">🎀</span>
          </div>

          <div className="plv-guide-body">
            <div className="plv-guide-step">
              <span className="plv-step-num plv-step-blue">1</span>
              <span className="plv-step-text">
                Mỗi link này chỉ được ghi nhận 1 đơn, nếu đã có đơn từ link này hãy tạo link khác để đặt.
              </span>
            </div>

            <div className="plv-guide-step">
              <span className="plv-step-num plv-step-orange">2</span>
              <span className="plv-step-text">
                Xóa sản phẩm khỏi giỏ hàng nếu đã lỡ thêm từ trước, sau đó mới bấm qua link hoàn tiền này để đặt lại.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Nav Bar */}
      <div className="plv-bottom-bar">
        <a href="/" className="plv-nav-item">
          <span className="plv-nav-icon">📊</span>
          <span className="plv-nav-text">BXH</span>
        </a>
        <a href="/" className="plv-nav-item">
          <span className="plv-nav-icon">🛒</span>
          <span className="plv-nav-text">Đơn hàng</span>
        </a>
        <a href="/" className="plv-nav-center-item">
          <div className="plv-nav-center-circle">
            <span>🔗</span>
          </div>
          <span className="plv-nav-center-text">Tạo link</span>
        </a>
        <a href="/" className="plv-nav-item">
          <span className="plv-nav-icon">👛</span>
          <span className="plv-nav-text">Ví tiền</span>
        </a>
        <a href="/" className="plv-nav-item">
          <span className="plv-nav-icon">🏷️</span>
          <span className="plv-nav-text">Săn sale</span>
        </a>
      </div>
    </div>
  );
}

const landingStyles = `
/* ===================================================
   PRODUCT LANDING VIEW - PURE VANILLA CSS (NO TAILWIND)
   Pixel-perfect design matching user's exact mockup
   =================================================== */

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: #fcefe7;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color: #1e293b;
  -webkit-font-smoothing: antialiased;
}

.plv-container {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  background: linear-gradient(180deg, #fff3ea 0%, #fff7f2 35%, #ffede5 100%);
  position: relative;
  padding-bottom: 90px;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.08);
}

/* Loading & Error */
.plv-loading-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  gap: 16px;
}

.plv-spinner {
  width: 46px;
  height: 46px;
  border: 4px solid #fed7aa;
  border-top-color: #f97316;
  border-radius: 50%;
  animation: plv-spin 0.8s linear infinite;
}

@keyframes plv-spin {
  to { transform: rotate(360deg); }
}

.plv-loading-text {
  font-size: 14px;
  font-weight: 700;
  color: #ea580c;
}

.plv-error-box {
  background: #ffffff;
  border-radius: 24px;
  padding: 32px 24px;
  margin: 60px 20px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.06);
  border: 1px solid #ffedd5;
}

.plv-error-icon {
  font-size: 42px;
  margin-bottom: 12px;
}

.plv-error-title {
  font-size: 17px;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 8px;
}

.plv-error-desc {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 20px;
}

.plv-back-btn {
  display: inline-block;
  background: #f97316;
  color: #ffffff;
  font-weight: 700;
  font-size: 13px;
  padding: 10px 24px;
  border-radius: 14px;
  text-decoration: none;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
}

/* Top App Bar */
.plv-app-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(254, 215, 170, 0.35);
  position: sticky;
  top: 0;
  z-index: 50;
}

.plv-back-arrow {
  background: none;
  border: none;
  font-size: 26px;
  line-height: 1;
  color: #334155;
  cursor: pointer;
  padding: 0 4px;
}

.plv-app-bar-title {
  flex: 1;
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 12px;
  text-align: left;
}

.plv-app-bar-more {
  font-size: 16px;
  letter-spacing: 2px;
  color: #475569;
  cursor: pointer;
}

/* Page Content */
.plv-content {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Brand Banner Pill */
.plv-brand-pill {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 999px;
  padding: 6px 12px;
  box-shadow: 0 2px 10px rgba(251, 146, 60, 0.08);
  border: 1px solid rgba(254, 215, 170, 0.5);
}

.plv-brand-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.plv-coin-icon {
  font-size: 16px;
}

.plv-brand-text-orange {
  font-size: 12px;
  font-weight: 800;
  color: #ea580c;
}

.plv-brand-text-dark {
  font-size: 11px;
  font-weight: 700;
  color: #334155;
}

.plv-badge-pink {
  background: linear-gradient(135deg, #f43f5e, #fb7185);
  color: #ffffff;
  font-size: 10px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 999px;
  box-shadow: 0 2px 6px rgba(244, 63, 94, 0.25);
}

.plv-badge-domain {
  font-size: 10.5px;
  font-weight: 700;
  color: #ea580c;
  background: #fff7ed;
  border: 1px solid #ffedd5;
  padding: 2px 8px;
  border-radius: 999px;
}

/* Reusable Card */
.plv-card {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 22px;
  box-shadow: 0 4px 18px rgba(251, 146, 60, 0.08);
  border: 1px solid rgba(254, 215, 170, 0.5);
  padding: 14px 16px;
}

/* User Greeting Card */
.plv-user-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.plv-user-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.plv-bear-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #fef3c7;
  border: 1.5px solid #fde68a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.plv-user-info {
  display: flex;
  flex-direction: column;
}

.plv-user-hello {
  font-size: 13px;
  color: #64748b;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 5px;
}

.plv-user-name {
  color: #ea580c;
  font-weight: 800;
  font-size: 13.5px;
}

.plv-user-id {
  font-size: 11.5px;
  font-family: SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: #94a3b8;
  margin-top: 2px;
}

.plv-btn-logout {
  background: #ffffff;
  border: 1px solid #fecdd3;
  color: #e11d48;
  border-radius: 10px;
  padding: 5px 12px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.plv-btn-logout:hover {
  background: #fff1f2;
}

/* Main Product Card */
.plv-product-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
}

.plv-prod-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 4px;
}

.plv-img-wrapper {
  width: 90px;
  height: 90px;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
}

.plv-prod-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.plv-prod-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34px;
}

.plv-freeship-tag {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: #e11d48;
  color: #ffffff;
  font-size: 8px;
  font-weight: 900;
  text-align: center;
  padding: 2.5px 0;
  letter-spacing: -0.2px;
}

.plv-prod-title-box {
  flex: 1;
}

.plv-prod-title {
  font-size: 13.5px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Reward Rows */
.plv-reward-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 14px;
  padding: 9px 12px;
}

.plv-reward-rose {
  background: #fff1f2;
  border: 1px solid #ffe4e6;
}

.plv-reward-sky {
  background: #f0fdf4;
  border: 1px solid #dcfce7;
}

.plv-reward-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.plv-reward-icon {
  font-size: 15px;
}

.plv-reward-label {
  font-size: 12.5px;
  font-weight: 700;
}

.plv-text-rose {
  color: #e11d48;
}

.plv-text-sky {
  color: #059669;
}

.plv-reward-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.plv-rate-tag {
  font-size: 10.5px;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 999px;
}

.plv-rate-rose {
  background: #ffe4e6;
  color: #be123c;
}

.plv-rate-sky {
  background: #dbeafe;
  color: #0369a1;
}

.plv-reward-val {
  font-size: 13.5px;
  font-weight: 900;
}

.plv-text-green {
  color: #059669;
}

.plv-text-sky-val {
  color: #0284c7;
}

/* Big CTA Button with Star */
.plv-cta-container {
  position: relative;
  margin-top: 6px;
}

.plv-cta-star {
  position: absolute;
  top: -8px;
  right: 14px;
  font-size: 18px;
  z-index: 10;
  pointer-events: none;
}

.plv-cta-button {
  width: 100%;
  background: linear-gradient(90deg, #ff5722 0%, #ff7043 55%, #f4511e 100%);
  border: none;
  border-radius: 999px;
  padding: 13px 18px;
  color: #ffffff;
  cursor: pointer;
  box-shadow: 0 8px 22px rgba(244, 81, 30, 0.42);
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}

.plv-cta-button:active {
  transform: scale(0.98);
  box-shadow: 0 4px 12px rgba(244, 81, 30, 0.3);
}

.plv-cta-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.plv-cta-icon-bag {
  font-size: 17px;
}

.plv-cta-text {
  font-size: 14.5px;
  font-weight: 900;
  letter-spacing: -0.2px;
}

.plv-cta-arrow {
  font-size: 18px;
  font-weight: 900;
  margin-left: 2px;
}

/* Share Box */
.plv-share-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.plv-share-info {
  display: flex;
  flex-direction: column;
}

.plv-share-title {
  font-size: 13px;
  font-weight: 800;
  color: #0f172a;
}

.plv-share-desc {
  font-size: 11.5px;
  color: #94a3b8;
  font-weight: 500;
  margin-top: 2px;
}

.plv-btn-copy {
  background: #ffffff;
  border: 1px solid #fecdd3;
  color: #e11d48;
  border-radius: 999px;
  padding: 7px 18px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.plv-btn-copy:hover {
  background: #fff1f2;
}

/* Guide & Tips Card */
.plv-guide-card {
  background: #fffbeb;
  border: 1px solid #fef3c7;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.plv-guide-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.plv-guide-header-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.plv-guide-warn-icon {
  font-size: 15px;
}

.plv-guide-title {
  font-size: 13px;
  font-weight: 800;
  color: #92400e;
}

.plv-guide-ribbon {
  font-size: 15px;
}

.plv-guide-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.plv-guide-step {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
  color: #78350f;
  line-height: 1.45;
  font-weight: 500;
}

.plv-step-num {
  width: 17px;
  height: 17px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 900;
  color: #ffffff;
  flex-shrink: 0;
  margin-top: 1.5px;
}

.plv-step-blue {
  background: #60a5fa;
}

.plv-step-orange {
  background: #f97316;
}

.plv-step-text {
  flex: 1;
}

/* Bottom Nav Bar */
.plv-bottom-bar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(12px);
  border-top: 1px solid rgba(226, 232, 240, 0.8);
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 6px 12px 10px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.plv-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  text-decoration: none;
  color: #94a3b8;
  transition: color 0.15s ease;
}

.plv-nav-item:hover {
  color: #475569;
}

.plv-nav-icon {
  font-size: 16px;
}

.plv-nav-text {
  font-size: 10px;
  font-weight: 700;
}

.plv-nav-center-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  position: relative;
  top: -14px;
}

.plv-nav-center-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f43f5e 0%, #fb7185 100%);
  border: 3px solid #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 18px;
  box-shadow: 0 4px 14px rgba(244, 63, 94, 0.45);
}

.plv-nav-center-text {
  font-size: 10px;
  font-weight: 800;
  color: #e11d48;
  margin-top: 3px;
}
`;
