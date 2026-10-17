import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';

export default function ToastNotification() {
  const { toast, setToast } = useApp();
  const [currentToast, setCurrentToast] = useState(null);
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef(null);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsExiting(false);
      setCurrentToast(null);
      setToast(null);
    }, 220);
  };

  useEffect(() => {
    if (toast && toast.message) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setCurrentToast(toast);
      setIsExiting(false);

      // Thời gian tự biến mất: 2.3s cho thông thường, 3.5s cho lỗi
      const duration = toast.type === 'error' ? 3500 : 2300;
      timerRef.current = setTimeout(() => {
        handleDismiss();
      }, duration);
    } else if (!toast) {
      if (currentToast && !isExiting) {
        handleDismiss();
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast]);

  if (!currentToast) return null;

  return (
    <div
      className={`modern-pill-toast ${isExiting ? 'is-exiting' : ''}`}
      onClick={handleDismiss}
      onMouseEnter={() => {
        if (timerRef.current) clearTimeout(timerRef.current);
      }}
      onMouseLeave={() => {
        if (!isExiting) {
          timerRef.current = setTimeout(handleDismiss, 1200);
        }
      }}
      title="Chạm để đóng nhanh"
      role="alert"
    >
      {/* Message Text (Bỏ icon, căn chỉnh chữ gọn gàng) */}
      <div style={{
        flex: 1,
        lineHeight: '1.5',
        letterSpacing: '0.1px',
        whiteSpace: 'pre-line',
        wordBreak: 'break-word',
        textAlign: 'left'
      }}>
        {currentToast.message}
      </div>

      {/* Quick Dismiss Button */}
      <span
        style={{
          width: '18px',
          height: '18px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          opacity: 0.55,
          marginLeft: '4px',
          flexShrink: 0,
          cursor: 'pointer',
          transition: 'opacity 0.15s ease'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.55'; }}
        title="Đóng"
      >
        ✕
      </span>
    </div>
  );
}
