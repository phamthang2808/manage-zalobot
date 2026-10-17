import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

export default function ReferralPromptModal() {
  const { user, setUser, API_URL_ROOT, showToast } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !user.id) {
      setIsOpen(false);
      return;
    }

    const isAdminUser = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.isAdmin;
    if (isAdminUser) {
      setIsOpen(false);
      return;
    }

    // Nếu người dùng đã từng nhập / bỏ qua mã giới thiệu (ghi nhận trong DB hoặc session)
    const dismissedKey = `referralPromptDismissed_${user.id}`;
    const wasDismissed = sessionStorage.getItem(dismissedKey) === 'true';

    if (user.hasEnteredReferral === false && !wasDismissed) {
      // Tự động lấy mã ref từ URL query param nếu có (?ref=58553) hoặc từ localStorage đã lưu
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const refParam = urlParams.get('ref') || localStorage.getItem('pendingReferralCode') || '';
        if (refParam) {
          setReferralCode(refParam.trim().replace(/^GT/i, ''));
        }
      } catch (e) {}

      // Mở modal sau một chút để trải nghiệm đăng nhập mượt mà
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setIsOpen(false);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const markCompletedOnClient = () => {
    setIsOpen(false);
    sessionStorage.setItem(`referralPromptDismissed_${user.id}`, 'true');
    try {
      localStorage.removeItem('pendingReferralCode');
    } catch (e) {}
    const updated = { ...user, hasEnteredReferral: true };
    setUser(updated);
    try {
      sessionStorage.setItem('adminUser', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleClaim = async (e) => {
    e.preventDefault();
    if (!referralCode.trim()) {
      showToast('Vui lòng nhập mã giới thiệu hoặc bấm Bỏ qua!', 'warning');
      return;
    }

    setLoading(true);
    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const res = await fetch(`${API_URL_ROOT}/api/user/referral/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ referralCode: referralCode.trim() }),
        credentials: 'include'
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || 'Mã giới thiệu không hợp lệ');
      }

      showToast(resData.message || 'Liên kết mã giới thiệu thành công! 🎉', 'success');
      markCompletedOnClient();
    } catch (err) {
      showToast(err.message || 'Lỗi liên kết mã giới thiệu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      const token = sessionStorage.getItem('adminToken') || '';
      fetch(`${API_URL_ROOT}/api/user/referral/skip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      }).catch(() => {});
    } catch (e) {}

    markCompletedOnClient();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.72)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999999,
      padding: '16px',
      animation: 'fadeIn 0.25s ease'
    }}>
      <div style={{
        background: 'var(--bg-card, #ffffff)',
        color: 'var(--text-bright, #0f172a)',
        borderRadius: '20px',
        padding: '24px 20px',
        maxWidth: '420px',
        width: '100%',
        boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
        border: '1.5px solid var(--border-color, rgba(255,255,255,0.1))',
        position: 'relative',
        textAlign: 'center'
      }}>
        {/* Nút X đóng góc trên */}
        <button
          type="button"
          onClick={handleSkip}
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted, #94a3b8)',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '8px'
          }}
          title="Bỏ qua"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Icon & Tiêu đề */}
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)',
          color: '#ea580c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          margin: '0 auto 14px auto',
          boxShadow: '0 4px 12px rgba(234, 88, 12, 0.2)'
        }}>
          🎁
        </div>

        <h3 style={{
          fontSize: '18px',
          fontWeight: '800',
          margin: '0 0 6px 0',
          color: 'var(--text-bright, #0f172a)'
        }}>
          Nhập Mã Giới Thiệu
        </h3>

        <p style={{
          fontSize: '13px',
          color: 'var(--text-muted, #64748b)',
          margin: '0 0 16px 0',
          lineHeight: '1.45'
        }}>
          Nếu bạn được bạn bè giới thiệu tham gia hệ thống, hãy nhập mã giới thiệu của họ tại đây để được kết nối hỗ trợ.
        </p>

        <form onSubmit={handleClaim}>
          <div style={{ marginBottom: '16px', textAlign: 'left' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '700',
              color: 'var(--text-muted, #64748b)',
              marginBottom: '6px'
            }}>
              MÃ GIỚI THIỆU
            </label>
            <input
              type="text"
              className="lookup-input"
              placeholder="VD: 58553 hoặc GT58553"
              value={referralCode}
              onChange={e => setReferralCode(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '11px 14px',
                fontSize: '15px',
                fontWeight: '700',
                letterSpacing: '0.5px',
                textAlign: 'center',
                fontFamily: 'monospace',
                borderRadius: '12px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{
            fontSize: '11px',
            color: 'var(--text-muted, #94a3b8)',
            marginBottom: '16px',
            background: 'var(--bg-main, #f8fafc)',
            padding: '8px 10px',
            borderRadius: '10px'
          }}>
            ℹ️ Ô này chỉ hiển thị <b>1 lần duy nhất</b> ngay sau khi đăng ký tài khoản. Bạn có thể bấm Bỏ qua nếu không có mã.
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={handleSkip}
              disabled={loading}
              style={{
                flex: 1,
                padding: '11px 14px',
                background: 'var(--bg-main, #f1f5f9)',
                color: 'var(--text-muted, #64748b)',
                border: '1px solid var(--border-color, #cbd5e1)',
                borderRadius: '12px',
                fontSize: '13.5px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Bỏ qua
            </button>
            <button
              type="submit"
              disabled={loading || !referralCode.trim()}
              className="lookup-btn"
              style={{
                flex: 1.4,
                padding: '11px 16px',
                borderRadius: '12px',
                fontSize: '13.5px',
                fontWeight: '700'
              }}
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>Đang kiểm tra...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-circle-check"></i>
                  <span>Xác nhận mã</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
