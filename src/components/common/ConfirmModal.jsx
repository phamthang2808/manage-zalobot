import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';

export default function ConfirmModal() {
  const { confirmDialog } = useApp();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && confirmDialog?.onCancel) {
        confirmDialog.onCancel();
      }
    };
    if (confirmDialog) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmDialog]);

  if (!confirmDialog) return null;

  const {
    title = 'Xác nhận thao tác',
    message = 'Bạn có chắc chắn muốn thực hiện hành động này?',
    confirmText = 'Đồng ý',
    cancelText = 'Hủy bỏ',
    danger = false,
    onConfirm,
    onCancel
  } = confirmDialog;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && onCancel) onCancel();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          background: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
          borderRadius: '16px',
          padding: '24px 20px 20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          textAlign: 'center',
          animation: 'centerToastEnter 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
      >
        {/* Warning Icon Badge */}
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: danger ? 'rgba(239, 68, 68, 0.12)' : 'rgba(249, 115, 22, 0.12)',
          border: `1.5px solid ${danger ? 'rgba(239, 68, 68, 0.3)' : 'rgba(249, 115, 22, 0.3)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 14px'
        }}>
          <i
            className={danger ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-circle-question'}
            style={{
              fontSize: '20px',
              color: danger ? '#ef4444' : '#ea580c'
            }}
          ></i>
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: '16px',
          fontWeight: '700',
          color: 'var(--text-bright, #ffffff)',
          margin: '0 0 8px 0'
        }}>
          {title}
        </h3>

        {/* Message */}
        <p style={{
          fontSize: '13.5px',
          color: 'var(--text-muted, #94a3b8)',
          lineHeight: '1.5',
          margin: '0 0 22px 0',
          whiteSpace: 'pre-line'
        }}>
          {message}
        </p>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'center'
        }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              height: '40px',
              padding: '0 16px',
              borderRadius: '10px',
              border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
              background: 'var(--bg-main, #0f172a)',
              color: 'var(--text-muted, #94a3b8)',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            style={{
              flex: 1,
              height: '40px',
              padding: '0 16px',
              borderRadius: '10px',
              border: 'none',
              background: danger
                ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                : 'linear-gradient(135deg, #f97316, #ea580c)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: danger ? '0 4px 14px rgba(239, 68, 68, 0.3)' : '0 4px 14px rgba(249, 115, 22, 0.3)',
              transition: 'all 0.15s ease'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
