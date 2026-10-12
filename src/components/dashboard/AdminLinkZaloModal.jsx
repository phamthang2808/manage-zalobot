import React, { useState } from 'react';

export default function AdminLinkZaloModal({ user, onClose, onSave, API_URL_ROOT, showToast }) {
  const [zaloId, setZaloId] = useState(user?.zaloId || '');
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const res = await fetch(`${API_URL_ROOT}/api/admin/web-users/${user.id}/link-zalo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ zaloId: zaloId.trim() }),
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi liên kết Zalo ID');

      showToast(data.message || 'Đã cập nhật Zalo ID thành công! 🎉', 'success');
      onSave(data.user || { ...user, zaloId: zaloId.trim() });
      onClose();
    } catch (err) {
      showToast(err.message || 'Lỗi liên kết Zalo ID', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px',
      backdropFilter: 'blur(4px)'
    }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-card, #fff)',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '460px',
          padding: '24px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: 'var(--text-bright, #0f172a)' }}>
            🔗 Liên Kết / Đổi Zalo ID
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#94a3b8' }}>
            &times;
          </button>
        </div>

        <div style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)', marginBottom: '16px', lineHeight: '1.5' }}>
          Gán mã định danh Zalo ID cho tài khoản: <b>{user.fullName || user.email}</b> (ID #{user.id}). Mọi đơn hàng Zalo của ID này sẽ được gộp vào tài khoản web của họ.
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: 'var(--text-bright, #0f172a)', marginBottom: '6px' }}>
              Zalo User ID:
            </label>
            <input
              type="text"
              value={zaloId}
              onChange={(e) => setZaloId(e.target.value)}
              placeholder="Nhập Zalo ID (để trống nếu muốn hủy liên kết)..."
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: '10px',
                border: '1.5px solid var(--border-color, #cbd5e1)',
                background: 'var(--bg-main, #f8fafc)',
                color: 'var(--text-bright, #0f172a)',
                fontSize: '13.5px',
                fontFamily: 'monospace',
                fontWeight: '700',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 16px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: 'transparent',
                color: '#64748b',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '9px 20px',
                borderRadius: '10px',
                border: 'none',
                background: '#2563eb',
                color: '#fff',
                fontSize: '13px',
                fontWeight: '800',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
