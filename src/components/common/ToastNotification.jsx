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

      // Web lớn dùng thời gian nhanh gọn: 2.3s cho thông thường, 3.5s cho lỗi
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

  const isSuccess = currentToast.type === 'success';
  const isError = currentToast.type === 'error';
  const isWarning = currentToast.type === 'warning';

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
      {/* Icon Tròn Phát Sáng (Glow Icon) */}
      <div style={{
        width: '24px',
        height: '24px',
        minWidth: '24px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        background: isSuccess
          ? 'rgba(16, 185, 129, 0.16)'
          : isError
          ? 'rgba(239, 68, 68, 0.16)'
          : isWarning
          ? 'rgba(245, 158, 11, 0.16)'
          : 'rgba(59, 130, 246, 0.16)',
        border: `1.5px solid ${
          isSuccess
            ? '#10b981'
            : isError
            ? '#ef4444'
            : isWarning
            ? '#f59e0b'
            : '#3b82f6'
        }`,
        color: isSuccess
          ? '#10b981'
          : isError
          ? '#ef4444'
          : isWarning
          ? '#f59e0b'
          : '#3b82f6',
        boxShadow: isSuccess
          ? '0 0 10px rgba(16, 185, 129, 0.35)'
          : isError
          ? '0 0 10px rgba(239, 68, 68, 0.35)'
          : '0 0 10px rgba(59, 130, 246, 0.35)'
      }}>
        {isSuccess ? (
          <svg style={{ width: '13px', height: '13px' }} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"></path>
          </svg>
        ) : isError ? (
          <svg style={{ width: '13px', height: '13px' }} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        ) : isWarning ? (
          <svg style={{ width: '13px', height: '13px' }} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01"></path>
          </svg>
        ) : (
          <svg style={{ width: '13px', height: '13px' }} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        )}
      </div>

      {/* Message Text */}
      <span style={{
        lineHeight: '1.4',
        letterSpacing: '0.1px',
        display: 'inline-block',
        whiteSpace: 'normal',
        wordBreak: 'break-word'
      }}>
        {currentToast.message}
      </span>

      {/* Quick Dismiss Button */}
      <span
        style={{
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          opacity: 0.5,
          marginLeft: '4px',
          flexShrink: 0,
          transition: 'opacity 0.15s ease'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.5'; }}
        title="Đóng"
      >
        ✕
      </span>
    </div>
  );
}
