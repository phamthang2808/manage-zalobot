import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { formatMoney } from '../../utils/formatters';
import CopyButton from '../common/CopyButton';

export default function AssignOrderModal({ order, onClose, onSuccess }) {
  const { users = [], token, API_URL_ROOT, showToast } = useApp();
  const [webUsers, setWebUsers] = useState([]);
  const [tabType, setTabType] = useState('ALL'); // 'ALL' | 'GOOGLE' | 'ZALO'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTarget, setSelectedTarget] = useState(null); // { id, name, type, detail }
  const [manualInput, setManualInput] = useState('');
  const [useManualInput, setUseManualInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch web/google users
  useEffect(() => {
    const fetchWebUsers = async () => {
      try {
        const res = await fetch(`${API_URL_ROOT}/api/admin/web-users`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setWebUsers(data);
        }
      } catch (e) {}
    };
    fetchWebUsers();
  }, [API_URL_ROOT, token]);

  if (!order) return null;

  const zaloUserList = Array.isArray(users) ? users : [];

  // Gộp danh sách ứng viên
  const combinedList = useMemo(() => {
    const list = [];

    // 1. Thêm Web / Google users
    webUsers.forEach(u => {
      list.push({
        type: 'GOOGLE',
        id: `u${u.id}`,
        rawId: u.id,
        name: u.fullName || u.email || `Tài khoản #${u.id}`,
        email: u.email,
        zaloId: u.zaloId,
        avatar: u.avatarUrl
      });
    });

    // 2. Thêm Zalo users (nếu chưa có trong webUsers)
    zaloUserList.forEach(zu => {
      list.push({
        type: 'ZALO',
        id: zu.zaloId,
        rawId: zu.zaloId,
        name: zu.zaloName || 'Thành viên Zalo',
        zaloId: zu.zaloId
      });
    });

    return list;
  }, [webUsers, zaloUserList]);

  // Lọc theo tab & ô tìm kiếm
  const filteredList = useMemo(() => {
    let filtered = combinedList;
    if (tabType === 'GOOGLE') {
      filtered = filtered.filter(item => item.type === 'GOOGLE');
    } else if (tabType === 'ZALO') {
      filtered = filtered.filter(item => item.type === 'ZALO');
    }

    if (!searchTerm.trim()) return filtered;
    const q = searchTerm.trim().toLowerCase();
    return filtered.filter(item => {
      const matchName = item.name && item.name.toLowerCase().includes(q);
      const matchEmail = item.email && item.email.toLowerCase().includes(q);
      const matchZalo = item.zaloId && item.zaloId.toLowerCase().includes(q);
      const matchId = String(item.id).toLowerCase().includes(q);
      return matchName || matchEmail || matchZalo || matchId;
    });
  }, [combinedList, tabType, searchTerm]);

  // Tìm chủ đơn hiện tại
  const currentOwner = useMemo(() => {
    const currentId = order.zaloId || order.subId || '';
    if (!currentId) return null;
    return combinedList.find(u => u.id === currentId || u.zaloId === currentId || (currentId.startsWith('phamthang_' + u.rawId + '_')));
  }, [order, combinedList]);

  const handleAssign = async () => {
    let targetId = '';
    let displayName = '';

    if (useManualInput) {
      targetId = manualInput.trim();
      displayName = targetId;
    } else if (selectedTarget) {
      targetId = selectedTarget.id;
      displayName = `${selectedTarget.name} (${selectedTarget.type === 'GOOGLE' ? 'Google/Web' : 'Zalo'})`;
    }

    if (!targetId) {
      setError('Vui lòng chọn hoặc nhập tài khoản người nhận đơn!');
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

      showToast(`Đã gắn đơn hàng ${order.orderId} cho ${displayName} thành công! Đơn này được bảo lưu cố định khi import file. 🎉`, 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Đã có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '16px',
        boxSizing: 'border-box'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card, #1e293b)',
          color: 'var(--text-main, #f8fafc)',
          border: '1px solid var(--border-color, #334155)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '92vh',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color, #334155)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-secondary, rgba(0,0,0,0.2))'
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
              fontSize: '16px',
              flexShrink: 0
            }}>
              <i className="fa-solid fa-link"></i>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16.5px', fontWeight: '800', color: 'var(--text-bright, #ffffff)' }}>
                Gắn Đơn Cho Người Khác
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>
                Chỉ định chủ đơn (Hỗ trợ tài khoản Google/Web &amp; Zalo Bot)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            type="button"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted, #94a3b8)',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px',
              lineHeight: 1
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
          {/* Order Details Card */}
          <div style={{
            background: 'var(--bg-secondary, rgba(0,0,0,0.15))',
            border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
            borderRadius: '12px',
            padding: '12px 14px',
            marginBottom: '16px',
            fontSize: '12.5px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Mã đơn hàng:</span>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <code style={{ fontSize: '12.5px', fontWeight: '800', color: '#ea580c' }}>{order.orderId}</code>
                <CopyButton text={order.orderId} title="Copy mã đơn" toastMessage={`Đã copy mã đơn: ${order.orderId}`} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Nền tảng:</span>
              <span style={{ fontWeight: '700', color: (order.platform || '').includes('TikTok') ? '#38bdf8' : '#ee4d2d' }}>
                {order.platform || 'Shopee'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px', gap: '8px' }}>
              <span style={{ color: 'var(--text-muted, #94a3b8)', flexShrink: 0 }}>Sản phẩm:</span>
              <span style={{ fontWeight: '600', textAlign: 'right', color: 'var(--text-bright, #ffffff)' }}>
                {order.productName || '---'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Hoa hồng gốc:</span>
              <strong style={{ color: '#10b981', fontSize: '13.5px' }}>
                {formatMoney(order.commission || order.commissionRaw || order.commissionTotal || 0)}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-color, rgba(255,255,255,0.1))', paddingTop: '6px', marginTop: '4px' }}>
              <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Chủ đơn hiện tại:</span>
              <span style={{ fontWeight: '700', color: currentOwner ? 'var(--text-bright, #ffffff)' : 'var(--color-danger, #ef4444)' }}>
                {currentOwner ? `${currentOwner.name} (${currentOwner.type === 'GOOGLE' ? 'Google' : 'Zalo'})` : (order.zaloId || order.subId || 'Chưa gắn (UNKNOWN)')}
              </span>
            </div>
          </div>

          {/* Member Selection Section */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-bright, #ffffff)' }}>
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
                {useManualInput ? '← Chọn từ danh sách' : '✏️ Nhập thủ công (ID/Email)'}
              </button>
            </div>

            {!useManualInput ? (
              <div>
                {/* Tabs Filter */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setTabType('ALL')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '16px',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      border: '1px solid var(--border-color, #334155)',
                      background: tabType === 'ALL' ? '#ea580c' : 'var(--bg-secondary, rgba(0,0,0,0.1))',
                      color: tabType === 'ALL' ? '#fff' : 'var(--text-muted, #94a3b8)',
                      cursor: 'pointer'
                    }}
                  >
                    Tất cả ({combinedList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTabType('GOOGLE')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '16px',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      border: '1px solid var(--border-color, #334155)',
                      background: tabType === 'GOOGLE' ? '#ea580c' : 'var(--bg-secondary, rgba(0,0,0,0.1))',
                      color: tabType === 'GOOGLE' ? '#fff' : 'var(--text-muted, #94a3b8)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <i className="fa-brands fa-google" style={{ fontSize: '11px' }}></i> Tài khoản Google / Web ({webUsers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTabType('ZALO')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '16px',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      border: '1px solid var(--border-color, #334155)',
                      background: tabType === 'ZALO' ? '#ea580c' : 'var(--bg-secondary, rgba(0,0,0,0.1))',
                      color: tabType === 'ZALO' ? '#fff' : 'var(--text-muted, #94a3b8)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <i className="fa-solid fa-comments" style={{ fontSize: '11px' }}></i> Zalo Bot ({zaloUserList.length})
                  </button>
                </div>

                {/* Search Box */}
                <input
                  type="text"
                  placeholder="Gõ tên thành viên, Gmail hoặc Zalo ID để tìm..."
                  className="form-control"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '13px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color, #cbd5e1)',
                    marginBottom: '8px',
                    background: 'var(--bg-secondary, rgba(0,0,0,0.1))',
                    color: 'var(--text-main, inherit)',
                    boxSizing: 'border-box'
                  }}
                />

                {/* Users List Box */}
                <div style={{
                  border: '1px solid var(--border-color, #cbd5e1)',
                  borderRadius: '12px',
                  maxHeight: '190px',
                  overflowY: 'auto',
                  background: 'var(--bg-secondary, rgba(0,0,0,0.1))'
                }}>
                  {filteredList.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted, #94a3b8)', fontSize: '12.5px' }}>
                      Không tìm thấy thành viên nào khớp với từ khóa
                    </div>
                  ) : (
                    filteredList.map(item => {
                      const isSelected = selectedTarget?.id === item.id;
                      return (
                        <div
                          key={`${item.type}_${item.id}`}
                          onClick={() => setSelectedTarget(item)}
                          style={{
                            padding: '9px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))',
                            cursor: 'pointer',
                            background: isSelected ? 'rgba(249, 115, 22, 0.16)' : 'transparent',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                            <div style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: item.type === 'GOOGLE' ? 'rgba(234, 67, 53, 0.15)' : 'rgba(2, 132, 199, 0.15)',
                              color: item.type === 'GOOGLE' ? '#ea4335' : '#0284c7',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              flexShrink: 0
                            }}>
                              <i className={item.type === 'GOOGLE' ? "fa-brands fa-google" : "fa-solid fa-comments"}></i>
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{
                                fontWeight: '700',
                                fontSize: '13px',
                                color: isSelected ? '#ea580c' : 'var(--text-bright, #ffffff)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {item.name}
                                <span style={{
                                  fontSize: '10px',
                                  padding: '1px 6px',
                                  borderRadius: '8px',
                                  marginLeft: '6px',
                                  background: item.type === 'GOOGLE' ? 'rgba(234, 67, 53, 0.2)' : 'rgba(2, 132, 199, 0.2)',
                                  color: item.type === 'GOOGLE' ? '#f87171' : '#38bdf8',
                                  fontWeight: '600'
                                }}>
                                  {item.type === 'GOOGLE' ? 'Google/Web' : 'Zalo'}
                                </span>
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.email && <span>{item.email} • </span>}
                                {item.zaloId ? (
                                  <span>Zalo ID: <code style={{ color: '#ea580c' }}>{item.zaloId}</code></span>
                                ) : (
                                  <span>Mã Web: <code style={{ color: '#ea580c' }}>{item.id}</code></span>
                                )}
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <span style={{ color: '#ea580c', fontWeight: '800', fontSize: '14px', marginLeft: '6px', flexShrink: 0 }}>✓</span>
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
                  placeholder="Nhập Zalo ID hoặc Email Google hoặc mã Web (VD: u12 hoặc 7605918549...)..."
                  className="form-control"
                  value={manualInput}
                  onChange={e => setManualInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '13px',
                    borderRadius: '10px',
                    border: '1.5px solid var(--border-color, #cbd5e1)',
                    background: 'var(--bg-secondary, rgba(0,0,0,0.1))',
                    color: 'var(--text-main, inherit)',
                    boxSizing: 'border-box'
                  }}
                />
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #94a3b8)', marginTop: '4px', display: 'block' }}>
                  Có thể nhập Zalo ID số, Email tài khoản Web hoặc mã tài khoản web dạng <code>u{'{id}'}</code>.
                </span>
              </div>
            )}
          </div>

          {/* Security Notice */}
          <div style={{
            background: 'rgba(249, 115, 22, 0.08)',
            border: '1px solid rgba(249, 115, 22, 0.25)',
            borderRadius: '10px',
            padding: '10px 12px',
            fontSize: '11.5px',
            color: 'var(--text-main, inherit)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <span style={{ fontSize: '13px', flexShrink: 0 }}>🛡️</span>
            <span>
              <strong>Bảo lưu an toàn:</strong> Sau khi gắn đơn, hệ thống sẽ gán cờ cố định. Khi Admin import lại báo cáo Excel Shopee hoặc hệ thống TikTok tự động đồng bộ, chủ sở hữu này sẽ <strong>được giữ nguyên 100%</strong>, không bị trả về cũ.
            </span>
          </div>

          {error && (
            <div style={{ color: '#ef4444', fontSize: '12.5px', marginTop: '10px', fontWeight: '600' }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border-color, #334155)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
          background: 'var(--bg-secondary, rgba(0,0,0,0.2))'
        }}>
          <button
            type="button"
            className="btn"
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: '1px solid var(--border-color, #cbd5e1)',
              background: 'var(--bg-secondary, rgba(255,255,255,0.05))',
              color: 'var(--text-muted, #94a3b8)',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px'
            }}
          >
            Hủy
          </button>
          <button
            type="button"
            className="btn"
            onClick={handleAssign}
            disabled={loading || (!useManualInput && !selectedTarget) || (useManualInput && !manualInput.trim())}
            style={{
              padding: '8px 20px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '13px',
              cursor: (loading || (!useManualInput && !selectedTarget) || (useManualInput && !manualInput.trim())) ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(249, 115, 22, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              opacity: (loading || (!useManualInput && !selectedTarget) || (useManualInput && !manualInput.trim())) ? 0.6 : 1
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
    </div>,
    document.body
  );
}
