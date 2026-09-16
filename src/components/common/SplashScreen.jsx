import { useEffect, useState } from 'react';

export default function SplashScreen({ onFinish }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // 0s: Logo 3D Spring -> 0.45s: Chữ Phóng To (Text Zoom) -> 0.8s: Slogan SlideUp -> 2.1s: Soft Exit -> 2.65s: Unmount
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 2100);

    const finishTimer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 2650);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div className={`splash-screen-overlay ${fadeOut ? 'fade-out' : ''}`}>
      {/* Ambient Glowing Orbs */}
      <div className="splash-orb orb-1"></div>
      <div className="splash-orb orb-2"></div>

      <div className="splash-card">
        {/* Bước 1: Logo 3D Bounce Animation */}
        <div className="splash-logo-container">
          <div className="splash-ring ring-outer"></div>
          <div className="splash-ring ring-inner"></div>
          <div className="splash-logo-box">
            <img src="/28symueslogomanin.png?v=5" alt="28Symues Affiliate Logo" className="splash-logo-img" />
            <div className="splash-shimmer"></div>
          </div>
        </div>

        {/* Bước 2: Chữ Phóng To Zoom & Slogan (Đã bỏ badge HỆ THỐNG AUTO) */}
        <div className="splash-content-group">
          <h1 className="splash-brand-name">
            28Symues <span className="gradient-text">Affiliate</span>
          </h1>
          <p className="splash-tagline">
            Biến mọi liên kết mua sắm Zalo thành nguồn thu nhập thụ động
          </p>

          <div className="splash-loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
