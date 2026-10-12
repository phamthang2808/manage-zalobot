import React, { useState, useEffect } from 'react';
import { formatMoney, formatDateTime } from '../../utils/formatters';

export default function WebUserDetailModal({ user, onClose, API_URL_ROOT }) {
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState(null);
  const [platformFilter, setPlatformFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!user?.id) return;
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const token = sessionStorage.getItem('adminToken') || '';
        const res = await fetch(`${API_URL_ROOT}/api/admin/web-users/${user.id}/details`, {
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include'
        });
        const data = await res.json();
        if (res.ok) {
          setDetails(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [user, API_URL_ROOT]);

  if (!user) return null;

  const orders = details?.orders || [];
  const payouts = details?.payouts || [];

  const filteredOrders = orders.filter((o) => {
    if (platformFilter !== 'ALL' && o.platform !== platformFilter) return false;
    if (sourceFilter !== 'ALL' && o.source !== sourceFilter) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const displayedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
          borderRadius: '20px',
          width: '100%',
          maxWidth: '1000px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1.5px solid var(--border-color, #e2e8f0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-bright, #0f172a)' }}>
              👤 Chi Tiết Tài Khoản Web #{user.id} — <span style={{ color: '#ea580c' }}>{user.fullName || user.name || user.email}</span>
            </h2>
            <div style={{ fontSize: '12.5px', color: 'var(--text-muted, #64748b)', marginTop: '4px' }}>
              Email: <b>{user.email}</b> • SĐT: {user.phone || 'Chưa cập nhật'}
              {user.zaloId && <> • Zalo ID: <code style={{ color: '#2563eb', fontWeight: '800' }}>{user.zaloId}</code></>}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8' }}
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '24px', marginBottom: '8px' }}></i>
              <div>Đang tải dữ liệu thành viên...</div>
            </div>
          ) : (
            <>
              {/* Quick stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: 'var(--bg-main, #f8fafc)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>SỐ DƯ HIỆN TẠI</div>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#ea580c', marginTop: '2px' }}>
                    {formatMoney(user.balance)}
                  </div>
                </div>
                <div style={{ background: 'var(--bg-main, #f8fafc)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>TỔNG KIẾM ĐƯỢC</div>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#059669', marginTop: '2px' }}>
                    {formatMoney(user.totalEarned)}
                  </div>
                </div>
                <div style={{ background: 'var(--bg-main, #f8fafc)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>TỔNG ĐƠN HÀNG</div>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#2563eb', marginTop: '2px' }}>
                    {orders.length} đơn
                  </div>
                </div>
                <div style={{ background: 'var(--bg-main, #f8fafc)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>NGÂN HÀNG</div>
                  <div style={{ fontSize: '13px', fontWeight: '800', marginTop: '2px' }}>
                    {user.bankName || 'Chưa có'} {user.accountNumber ? `(${user.accountNumber})` : ''}
                  </div>
                </div>
              </div>

              {/* Orders header & Filter */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>
                  🛒 Danh Sách Đơn Hàng ({filteredOrders.length})
                </h3>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={platformFilter}
                    onChange={(e) => { setPlatformFilter(e.target.value); setCurrentPage(1); }}
                    style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: '700' }}
                  >
                    <option value="ALL">Tất cả sàn</option>
                    <option value="SHOPEE">Shopee</option>
                    <option value="TIKTOK">TikTok Shop</option>
                    <option value="LAZADA">Lazada</option>
                  </select>

                  <select
                    value={sourceFilter}
                    onChange={(e) => { setSourceFilter(e.target.value); setCurrentPage(1); }}
                    style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: '700' }}
                  >
                    <option value="ALL">Tất cả nguồn</option>
                    <option value="WEB">🌐 Đơn Web</option>
                    <option value="ZALO">💬 Đơn Zalo</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              {filteredOrders.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                  Không có đơn hàng nào khớp với điều kiện lọc.
                </div>
              ) : (
                <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-main, #f8fafc)', borderBottom: '1.5px solid var(--border-color, #e2e8f0)' }}>
                        <th style={{ padding: '10px 12px', fontWeight: '800', color: '#64748b' }}>Nguồn</th>
                        <th style={{ padding: '10px 12px', fontWeight: '800', color: '#64748b' }}>Sàn</th>
                        <th style={{ padding: '10px 12px', fontWeight: '800', color: '#64748b' }}>Mã đơn</th>
                        <th style={{ padding: '10px 12px', fontWeight: '800', color: '#64748b' }}>Sản phẩm</th>
                        <th style={{ padding: '10px 12px', fontWeight: '800', color: '#64748b' }}>Thời gian</th>
                        <th style={{ padding: '10px 12px', fontWeight: '800', color: '#64748b', textAlign: 'right' }}>Hoa hồng</th>
                        <th style={{ padding: '10px 12px', fontWeight: '800', color: '#64748b', textAlign: 'center' }}>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedOrders.map((o, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-color, #f1f5f9)' }}>
                          <td style={{ padding: '10px 12px' }}>
                            {o.source === 'WEB' ? (
                              <span style={{ padding: '2px 6px', borderRadius: '4px', background: '#ede9fe', color: '#7c3aed', fontSize: '10px', fontWeight: '800' }}>
                                🌐 Web
                              </span>
                            ) : (
                              <span style={{ padding: '2px 6px', borderRadius: '4px', background: '#dbeafe', color: '#2563eb', fontSize: '10px', fontWeight: '800' }}>
                                💬 Zalo
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: '700' }}>{o.platform}</td>
                          <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: '700' }}>{o.orderId}</td>
                          <td style={{ padding: '10px 12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={o.productName}>
                            {o.productName || 'Sản phẩm tiếp thị'}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>{formatDateTime(o.purchaseTime)}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '800', color: '#ea580c' }}>
                            {formatMoney(o.commission)}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontSize: '10.5px',
                              fontWeight: '700',
                              background: o.status === 'Hoàn thành' ? '#ecfdf5' : '#fffbeb',
                              color: o.status === 'Hoàn thành' ? '#059669' : '#d97706'
                            }}>
                              {o.status || 'Chờ xử lý'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Lịch sử rút tiền */}
              {payouts.length > 0 && (
                <div>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', fontWeight: '800' }}>
                    📜 Lịch Sử Rút Tiền ({payouts.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {payouts.map((p) => (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-main, #f8fafc)', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12.5px' }}>
                        <div>
                          <b>#{p.id}</b> • <span style={{ fontWeight: '800', color: '#ea580c' }}>{formatMoney(p.amount)}</span> • {p.bankName} ({p.accountNumber})
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ color: '#64748b' }}>{formatDateTime(p.createdAt)}</span>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '8px',
                            fontWeight: '700',
                            fontSize: '11px',
                            background: p.status === 'COMPLETED' ? '#ecfdf5' : '#fffbeb',
                            color: p.status === 'COMPLETED' ? '#059669' : '#d97706'
                          }}>
                            {p.status === 'COMPLETED' ? 'Đã chuyển' : 'Chờ duyệt'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
