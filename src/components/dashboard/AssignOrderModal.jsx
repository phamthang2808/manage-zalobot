import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney } from '../../utils/formatters';
import CopyButton from '../common/CopyButton';

export default function AssignOrderModal({ order, onClose, onSuccess }) {
  const { users, token, API_URL_ROOT, showToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZaloId, setSelectedZaloId] = useState('');
  const [manualZaloId, setManualZaloId] = useState('');
  const [useManualInput, setUseManualInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!order) return null;

  const currentOwner = users.find(u => u.zaloId === (order.zaloId || order.subId));

  // Filter users list based on search
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const q = searchTerm.trim().toLowerCase();
    return users.filter(u =>
      (u.zaloName && u.zaloName.toLowerCase().includes(q)) ||
      (u.zaloId && u.zaloId.toLowerCase().includes(q))
    );
  }, [users, searchTerm]);

  const handleAssign = async () => {
    const targetId = useManualInput ? manualZaloId.trim() : selectedZaloId.trim();
    if (!targetId) {
      setError('Vui lòng chọn hoặc nhập Zalo ID người nhận đơn!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL_ROOT}/api/admin/orders/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({
          orderId: order.orderId,
          platform: order.platform || 'Shopee',
          targetZaloId: targetId
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Không thể gắn đơn hàng lúc này!');
      }

      const targetUser = users.find(u => u.zaloId === targetId);
      const displayName = targetUser ? targetUser.zaloName : targetId;

      showToast(`Đã gắn đơn hàng ${order.orderId} cho thành viên ${displayName} thành công! Đơn này sẽ được bảo lưu cố định khi import file.`, 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Đã có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '16px'
    }}>
      <div style={{
        background: 'var(--bg-card, #ffffff)',
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '540px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        overflow: 'hidden',
        animation: 'modalSlideUp 0.25s ease-out'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-color, #e2e8f0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-secondary, rgba(0,0,0,0.02))'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px'
            }}>
              <i className="fa-solid fa-link"></i>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: 'var(--text-bright, #0f172a)' }}>
                Gắn Đơn Cho Người Khác
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
                Chỉ định chủ sở hữu đơn hàng (Tự động giữ nguyên khi import lại file)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted, #94a3b8)',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', maxHeight: '72vh', overflowY: 'auto' }}>
          {/* Order Details Card */}
          <div style={{
            background: 'var(--bg-main, #f8fafc)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '12px',
            padding: '14px 16px',
            marginBottom: '18px',
            fontSize: '13px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Mã đơn hàng:</span>
              <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                <code style={{ fontSize: '12.5px', fontWeight: '800', color: '#ea580c' }}>{order.orderId}</code>
                <CopyButton text={order.orderId} title="Copy mã đơn hàng" toastMessage={`Đã copy mã đơn: ${order.orderId}`} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Nền tảng:</span>
              <span style={{ fontWeight: '700', color: order.platform === 'TikTok Shop' ? '#000' : '#ee4d2d' }}>
                {order.platform || 'Shopee'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '8px' }}>
              <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>Sản phẩm:</span>
              <span style={{ fontWeight: '600', textAlign: 'right', color: 'var(--text-bright)' }}>
                {order.productName || '---'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Hoa hồng gốc:</span>
              <strong style={{ color: '#059669', fontSize: '14px' }}>{formatMoney(order.commission)}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-color, #cbd5e1)', paddingTop: '8px', marginTop: '4px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Chủ đơn hiện tại:</span>
              <span style={{ fontWeight: '700', color: currentOwner ? 'var(--text-bright)' : 'var(--color-danger, #ef4444)' }}>
                {currentOwner ? `${currentOwner.zaloName} (${currentOwner.zaloId})` : (order.zaloId || order.subId || 'Chưa gắn (UNKNOWN)')}
              </span>
            </div>
          </div>

          {/* Member Selection Section */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-bright)' }}>
                Chọn thành viên nhận đơn:
              </label>
              <button
                type="button"
                onClick={() => setUseManualInput(!useManualInput)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ea580c',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                {useManualInput ? '← Chọn từ danh sách' : '✏️ Nhập Zalo ID trực tiếp'}
              </button>
            </div>

            {!useManualInput ? (
              <div>
                {/* Search Box */}
                <input
                  type="text"
                  placeholder="Gõ tên thành viên hoặc Zalo ID để tìm..."
                  className="form-control"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    fontSize: '13px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color, #cbd5e1)',
                    marginBottom: '10px',
                    background: 'var(--bg-card)'
                  }}
                />

                {/* Users List Box */}
                <div style={{
                  border: '1px solid var(--border-color, #cbd5e1)',
                  borderRadius: '12px',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  background: 'var(--bg-card)'
                }}>
                  {filteredUsers.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12.5px' }}>
                      Không tìm thấy thành viên nào khớp với từ khóa
                    </div>
                  ) : (
                    filteredUsers.map(u => {
                      const isSelected = selectedZaloId === u.zaloId;
                      return (
                        <div
                          key={u.zaloId}
                          onClick={() => setSelectedZaloId(u.zaloId)}
                          style={{
                            padding: '10px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: '1px solid var(--border-color, #f1f5f9)',
                            cursor: 'pointer',
                            background: isSelected ? 'rgba(249, 115, 22, 0.12)' : 'transparent',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '13px', color: isSelected ? '#ea580c' : 'var(--text-bright)' }}>
                              {u.zaloName || 'Vô danh'}
                            </div>
                            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                              Zalo ID: <code>{u.zaloId}</code>
                            </div>
                          </div>
                          {isSelected && (
                            <span style={{ color: '#ea580c', fontWeight: '800', fontSize: '14px' }}>✓</span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  placeholder="Nhập Zalo ID thành viên (ví dụ: 123456789)..."
                  className="form-control"
                  value={manualZaloId}
                  onChange={e => setManualZaloId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '13.5px',
                    borderRadius: '10px',
                    border: '1.5px solid var(--border-color, #cbd5e1)',
                    background: 'var(--bg-card)'
                  }}
                />
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Nếu Zalo ID này chưa có trong hệ thống, hệ thống sẽ tự động khởi tạo thành viên mới.
                </span>
              </div>
            )}
          </div>

          {/* Security Notice */}
          <div style={{
            background: 'rgba(249, 115, 22, 0.08)',
            border: '1px solid rgba(249, 115, 22, 0.25)',
            borderRadius: '10px',
            padding: '10px 14px',
            fontSize: '12px',
            color: 'var(--text-bright)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <span style={{ fontSize: '14px', flexShrink: 0 }}>🛡️</span>
            <span>
              <strong>Bảo lưu an toàn:</strong> Sau khi gắn đơn, hệ thống sẽ gán cờ cố định. Khi Admin import lại báo cáo Excel Shopee hoặc hệ thống TikTok tự động đồng bộ, chủ sở hữu này sẽ <strong>được giữ nguyên 100%</strong>, không bị trả về cũ.
            </span>
          </div>

          {error && (
            <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '12px', fontWeight: '600' }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-color, #e2e8f0)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
          background: 'var(--bg-secondary, rgba(0,0,0,0.02))'
        }}>
          <button
            type="button"
            className="btn"
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '9px 18px',
              borderRadius: '10px',
              border: '1px solid var(--border-color, #cbd5e1)',
              background: 'var(--bg-card)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Hủy
          </button>
          <button
            type="button"
            className="btn"
            onClick={handleAssign}
            disabled={loading || (!useManualInput && !selectedZaloId) || (useManualInput && !manualZaloId.trim())}
            style={{
              padding: '9px 22px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              color: '#ffffff',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(249, 115, 22, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {loading ? (
              <span>Đang lưu...</span>
            ) : (
              <>
                <i className="fa-solid fa-check"></i>
                <span>Xác Nhận Gắn Đơn</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
