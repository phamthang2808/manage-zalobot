import React, { useState } from 'react';

const ZALO_CONTACT_URL = "https://zalo.me/0888728256";

export default function FloatingZaloContact() {
  const [hovered, setHovered] = useState(false);

  return (
    <aside 
      className="floating-zalo-container"
      aria-label="Liên hệ Zalo hỗ trợ"
    >
      <a
        href={ZALO_CONTACT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="floating-zalo-link"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title="Chat trực tiếp qua Zalo với Admin Phạm Thắng (0888728256)"
      >
        {/* Dual Ripple Animation */}
        <span className="zalo-pulse-wave" aria-hidden="true"></span>
        <span className="zalo-pulse-wave zalo-pulse-delay" aria-hidden="true"></span>

        {/* Floating Button Body */}
        <div className="zalo-btn-body">
          {/* Authentic Zalo SVG */}
          <svg 
            viewBox="0 0 48 48" 
            className="zalo-icon-svg" 
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Base Circle */}
            <circle cx="24" cy="24" r="23" fill="#0068FF"/>
            {/* Subtle Inner Glow */}
            <circle cx="24" cy="24" r="22" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none"/>
            {/* Zalo Speech Bubble / Wordmark */}
            <path 
              d="M12.5 24c0-6.35 5.15-11.5 11.5-11.5s11.5 5.15 11.5 11.5-5.15 11.5-11.5 11.5c-2.05 0-3.97-.54-5.64-1.48L11.5 35.5l1.67-4.3C12.38 29.35 12.5 26.75 12.5 24z" 
              fill="#ffffff" 
              fillOpacity="0.18"
            />
            {/* Bold Crisp Zalo text */}
            <text 
              x="24" 
              y="28.5" 
              fill="#ffffff" 
              fontFamily="system-ui, -apple-system, 'Be Vietnam Pro', 'Segoe UI', Roboto, sans-serif" 
              fontSize="12.5" 
              fontWeight="900" 
              textAnchor="middle" 
              letterSpacing="-0.3px"
            >
              Zalo
            </text>
          </svg>

          {/* Active Online Indicator */}
          <span className="zalo-online-dot" title="Đang trực tuyến"></span>
        </div>

        {/* Hover / Expandable Label */}
        <span className={`zalo-label-pill ${hovered ? 'show' : ''}`}>
          <span className="zalo-label-sub">Hỗ trợ 24/7</span>
          <span className="zalo-label-main">Liên hệ Zalo</span>
        </span>
      </a>
    </aside>
  );
}
