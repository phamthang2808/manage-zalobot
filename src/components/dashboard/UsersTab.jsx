import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney, formatDateTime, getBankAndAccount } from '../../utils/formatters';

export function UserDetailModal({ selectedUser, onClose, orders }) {
  if (!selectedUser) return null;

  const [platformFilter, setPlatformFilter] = useState('ALL'); // 'ALL' | 'Shopee' | 'TikTok'
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const getPlatform = (o) => {
    if (!o) return 'Shopee';
    const p = (o.platform || '').trim().toLowerCase();
    if (p.includes('tiktok') || (o.orderId && o.orderId.length > 15 && !o.orderId.startsWith('2608') && !o.orderId.startsWith('SPF'))) return 'TikTok Shop';
    if (p.includes('shopeefood') || (o.orderId && o.orderId.startsWith('SPF'))) return 'ShopeeFood';
    return 'Shopee';
  };

  // Lấy toàn bộ đơn hàng của thành viên này (theo cả zaloId và subId)
  const userOrders = (orders || []).filter(o => 
    (o.zaloId && o.zaloId === selectedUser.zaloId) || 
    (o.subId && o.subId === selectedUser.zaloId)
  );

  const shopeeOrdersCount = userOrders.filter(o => getPlatform(o) !== 'TikTok Shop').length;
  const tiktokOrdersCount = userOrders.filter(o => getPlatform(o) === 'TikTok Shop').length;

  const filteredOrders = userOrders.filter(o => {
    if (platformFilter === 'Shopee') return getPlatform(o) !== 'TikTok Shop';
    if (platformFilter === 'TikTok') return getPlatform(o) === 'TikTok Shop';
    return true;
  });

  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const paginatedOrders = filteredOrders.slice((safePage - 1) * pageSize, safePage * pageSize);

  // Helper check trạng thái hủy
  const isOrderCancelled = (o) => {
    return o.status === 'Hủy' || o.status === 'Đã hủy' || o.status === 3 || o.status === 'CANCELLED' || o.status === 'REFUNDED';
  };

  const getCommission = (o) => {
    if (isOrderCancelled(o)) return 0;
    return (o.commission != null ? o.commission : (o.actualCommission != null ? o.actualCommission : (o.estCommission != null ? o.estCommission : 0)));
  };

  // Tính tổng cộng theo trang hiện tại (safePage)
  const pageTotalGross = paginatedOrders.reduce((acc, o) => acc + getCommission(o), 0);
  const pageTotalAfterTax = pageTotalGross * 0.9;
  const pageTotalNet = pageTotalAfterTax * 0.8;

  const bankAndAcc = getBankAndAccount(selectedUser);

  const handleFilterChange = (filter) => {
    setPlatformFilter(filter);
    setCurrentPage(1);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content user-detail-modal" 
        onClick={e => e.stopPropagation()}
        style={{
          width: '95vw',
          maxWidth: '1150px',
          maxHeight: '92vh',
          padding: '24px 28px',
          borderRadius: '16px',
          boxSizing: 'border-box'
        }}
      >
        <header className="modal-header" style={{ marginBottom: '20px', padding: '0 0 16px', borderBottom: '1px solid var(--border-color)' }}>
          <h2 className="modal-title" style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-bright)' }}>
            👤 Chi Tiết Thành Viên - <span style={{ color: '#ea580c' }}>{selectedUser.zaloName || selectedUser.zaloId}</span>
          </h2>
          <button className="modal-close" onClick={onClose} style={{ fontSize: '26px', cursor: 'pointer' }}>&times;</button>
        </header>

        <div className="modal-body" style={{ padding: 0 }}>
          {/* 4 thẻ thông tin tài khoản */}
          <div className="member-detail-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            <div className="detail-item" style={{ padding: '16px 20px', borderRadius: '12px', border: '1.5px solid var(--border-color, #e2e8f0)', background: 'var(--bg-main, #f8fafc)', boxShadow: '0 2px 5px rgba(0,0,0,0.03)' }}>
              <div className="detail-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px', color: 'var(--text-muted, #475569)', fontWeight: '700' }}>
                👤 Tên thành viên
              </div>
              <div className="detail-value" style={{ color: 'var(--color-primary, #ea580c)', fontSize: '20px', fontWeight: '800' }}>
                {selectedUser.zaloName || 'Vô danh'}
              </div>
            </div>
            <div className="detail-item" style={{ padding: '16px 20px', borderRadius: '12px', border: '1.5px solid var(--border-color, #e2e8f0)', background: 'var(--bg-main, #f8fafc)', boxShadow: '0 2px 5px rgba(0,0,0,0.03)' }}>
              <div className="detail-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px', color: 'var(--text-muted, #475569)', fontWeight: '700' }}>
                💬 Zalo ID
              </div>
              <div className="detail-value" style={{ fontSize: '15px', wordBreak: 'break-all', fontFamily: 'monospace', color: 'var(--text-bright, #0f172a)', fontWeight: '700' }}>
                {selectedUser.zaloId}
              </div>
            </div>
            <div className="detail-item" style={{ padding: '16px 20px', borderRadius: '12px', border: '1.5px solid var(--border-color, #e2e8f0)', background: 'var(--bg-main, #f8fafc)', boxShadow: '0 2px 5px rgba(0,0,0,0.03)' }}>
              <div className="detail-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px', color: 'var(--text-muted, #475569)', fontWeight: '700' }}>
                🏦 Ngân hàng nhận tiền
              </div>
              <div className="detail-value" style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-bright, #0f172a)' }}>
                {bankAndAcc.bankName || '⚠️ Chưa cập nhật'}
              </div>
            </div>
            <div className="detail-item" style={{ padding: '16px 20px', borderRadius: '12px', border: '1.5px solid var(--border-color, #e2e8f0)', background: 'var(--bg-main, #f8fafc)', boxShadow: '0 2px 5px rgba(0,0,0,0.03)' }}>
              <div className="detail-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px', color: 'var(--text-muted, #475569)', fontWeight: '700' }}>
                💳 Số tài khoản
              </div>
              <div className="detail-value">
                <code style={{ fontSize: '18px', letterSpacing: '1.5px', fontWeight: '800', color: 'var(--color-success, #16a34a)' }}>
                  {bankAndAcc.accountNumber || '⚠️ Chưa cập nhật'}
                </code>
              </div>
            </div>
          </div>

          {/* 6 thẻ ví hoa hồng */}
          <div className="stats-grid modal-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            <div className="stat-card" style={{ padding: '14px 16px', background: 'var(--bg-card)', border: '1.5px solid var(--border-color)', borderRadius: '12px' }}>
              <span className="stat-label" style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted, #475569)' }}>Chờ xử lý</span>
              <span className="stat-val" style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-bright)' }}>{formatMoney(selectedUser.wallet?.pendingCommission)}</span>
            </div>
            <div className="stat-card success" style={{ padding: '14px 16px', background: 'var(--bg-card)', border: '1.5px solid var(--border-color)', borderRadius: '12px' }}>
              <span className="stat-label" style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted, #475569)' }}>Đã hoàn thành</span>
              <span className="stat-val" style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-bright)' }}>{formatMoney(selectedUser.wallet?.completedCommission)}</span>
            </div>
            <div className="stat-card warning" style={{ padding: '14px 16px', background: 'var(--bg-card)', border: '1.5px solid var(--border-color)', borderRadius: '12px' }}>
              <span className="stat-label" style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted, #475569)' }}>Sau thuế (10%)</span>
              <span className="stat-val" style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-warning, #d97706)' }}>{formatMoney((selectedUser.wallet?.completedCommission || 0) * 0.9)}</span>
            </div>
            <div className="stat-card success" style={{ padding: '14px 16px', background: 'var(--bg-card)', border: '1.5px solid var(--border-color)', borderRadius: '12px' }}>
              <span className="stat-label" style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted, #475569)' }}>Thực nhận (80%)</span>
              <span className="stat-val" style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-success, #16a34a)' }}>{formatMoney((selectedUser.wallet?.completedCommission || 0) * 0.9 * 0.8)}</span>
            </div>
            <div className="stat-card warning" style={{ padding: '14px 16px', background: 'var(--bg-card)', border: '1.5px solid var(--border-color)', borderRadius: '12px' }}>
              <span className="stat-label" style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted, #475569)' }}>Có thể rút</span>
              <span className="stat-val" style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-success, #16a34a)' }}>{formatMoney(selectedUser.wallet?.withdrawableCommission)}</span>
            </div>
            <div className="stat-card" style={{ padding: '14px 16px', background: 'var(--bg-card)', border: '1.5px solid var(--border-color)', borderRadius: '12px' }}>
              <span className="stat-label" style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted, #475569)' }}>Đã rút</span>
              <span className="stat-val" style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-bright)' }}>{formatMoney(selectedUser.wallet?.receivedCommission)}</span>
            </div>
          </div>

          {/* Thanh tiêu đề bảng đơn hàng & Bộ lọc Shopee / TikTok */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-bright)' }}>
                🛒 Đơn Hàng Thành Viên
              </h3>
              <span style={{ fontSize: '12.5px', fontWeight: '700', padding: '2px 10px', borderRadius: '12px', background: 'var(--bg-main, #f1f5f9)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                {filteredOrders.length} đơn
              </span>
            </div>

            {/* Các nút bấm lọc nền tảng */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleFilterChange('ALL')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  border: platformFilter === 'ALL' ? '1.5px solid #f97316' : '1px solid var(--border-color)',
                  background: platformFilter === 'ALL' ? 'rgba(249, 115, 22, 0.12)' : 'var(--bg-main, #f8fafc)',
                  color: platformFilter === 'ALL' ? '#ea580c' : 'var(--text-main)',
                  transition: 'all 0.2s ease'
                }}
              >
                Tất cả ({userOrders.length})
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange('Shopee')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: platformFilter === 'Shopee' ? '1.5px solid #ee4d2d' : '1px solid var(--border-color)',
                  background: platformFilter === 'Shopee' ? 'rgba(238, 77, 45, 0.12)' : 'var(--bg-main, #f8fafc)',
                  color: platformFilter === 'Shopee' ? '#ee4d2d' : 'var(--text-main)',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ color: '#ee4d2d' }}>🟠</span> Shopee ({shopeeOrdersCount})
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange('TikTok')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: platformFilter === 'TikTok' ? '1.5px solid #00f2fe' : '1px solid var(--border-color)',
                  background: platformFilter === 'TikTok' ? 'rgba(0, 242, 254, 0.12)' : 'var(--bg-main, #f8fafc)',
                  color: platformFilter === 'TikTok' ? '#0284c7' : 'var(--text-main)',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>🎵</span> TikTok Shop ({tiktokOrdersCount})
              </button>
            </div>
          </div>

          {/* Bảng đơn hàng dành cho Desktop / Máy tính bảng */}
          <div className="table-container user-orders-table-desktop" style={{ maxHeight: '420px', overflowY: 'auto', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px' }}>
            <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 5 }}>
                <tr style={{ background: 'var(--bg-main, #f1f5f9)', borderBottom: '2px solid var(--border-color, #cbd5e1)' }}>
                  <th style={{ padding: '12px 14px', color: 'var(--text-bright, #0f172a)', fontWeight: '800', fontSize: '12.5px', whiteSpace: 'nowrap', width: '140px' }}>Mã đơn</th>
                  <th style={{ padding: '12px 14px', color: 'var(--text-bright, #0f172a)', fontWeight: '800', fontSize: '12.5px', whiteSpace: 'nowrap', width: '90px' }}>Nền tảng</th>
                  <th style={{ padding: '12px 14px', color: 'var(--text-bright, #0f172a)', fontWeight: '800', fontSize: '12.5px' }}>Sản phẩm</th>
                  <th style={{ padding: '12px 14px', color: 'var(--text-bright, #0f172a)', fontWeight: '800', fontSize: '12.5px', whiteSpace: 'nowrap', width: '110px' }}>HH Gốc</th>
                  <th style={{ padding: '12px 14px', color: 'var(--text-bright, #0f172a)', fontWeight: '800', fontSize: '12.5px', whiteSpace: 'nowrap', width: '110px' }} title="Sau thuế 10%">Sau thuế</th>
                  <th style={{ padding: '12px 14px', color: 'var(--text-bright, #0f172a)', fontWeight: '800', fontSize: '12.5px', whiteSpace: 'nowrap', width: '120px' }} title="Sau thuế 10% & trừ 20% chia sẻ">Thực nhận</th>
                  <th style={{ padding: '12px 14px', color: 'var(--text-bright, #0f172a)', fontWeight: '800', fontSize: '12.5px', whiteSpace: 'nowrap', width: '120px' }}>Thời gian</th>
                  <th style={{ padding: '12px 14px', color: 'var(--text-bright, #0f172a)', fontWeight: '800', fontSize: '12.5px', textAlign: 'center', whiteSpace: 'nowrap', width: '100px' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.length === 0 ? (
                  <tr className="empty-row">
                    <td colSpan="8" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                      Không có đơn hàng nào phù hợp với bộ lọc này.
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map(o => {
                    const isTiktok = getPlatform(o) === 'TikTok Shop';
                    const isCancelled = isOrderCancelled(o);
                    const isCompleted = o.status === 'Hoàn thành' || o.status === 'Đã chốt HH' || o.status === 'Đã chốt' || o.status === 2 || o.status === 'SETTLED';
                    const rawCommission = getCommission(o);
                    const afterTax = rawCommission * 0.9;
                    const afterDeduction = afterTax * 0.8;
                    const rawTime = o.purchaseTime || o.orderDate || o.createdTime || o.completeTime;
                    return (
                      <tr key={o.id || o.orderId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td data-label="Mã đơn" style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-bright, #0f172a)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                          {o.orderId}
                        </td>
                        <td data-label="Nền tảng" style={{ whiteSpace: 'nowrap' }}>
                          {isTiktok ? (
                            <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', background: 'rgba(0, 242, 254, 0.12)', color: '#0284c7', border: '1px solid rgba(0, 242, 254, 0.3)' }}>
                              TikTok
                            </span>
                          ) : (
                            <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', background: 'rgba(238, 77, 45, 0.12)', color: '#ee4d2d', border: '1px solid rgba(238, 77, 45, 0.3)' }}>
                              Shopee
                            </span>
                          )}
                        </td>
                        <td data-label="Sản phẩm" style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-bright, #0f172a)', fontWeight: '600' }} title={o.productName}>
                          {o.productName || 'Không có tên sản phẩm'}
                        </td>
                        <td data-label="HH Gốc" style={{ color: 'var(--text-muted, #475569)', fontSize: '12.5px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                          {formatMoney(rawCommission)}
                        </td>
                        <td data-label="Sau thuế" style={{ color: 'var(--color-warning, #d97706)', fontSize: '12.5px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                          {formatMoney(afterTax)}
                        </td>
                        <td data-label="Thực nhận" style={{ color: 'var(--color-success, #16a34a)', fontWeight: '800', fontSize: '13px', whiteSpace: 'nowrap' }}>
                          {formatMoney(afterDeduction)}
                        </td>
                        <td data-label="Thời gian" style={{ fontSize: '12px', color: 'var(--text-muted, #475569)', whiteSpace: 'nowrap' }}>
                          {formatDateTime(rawTime)}
                        </td>
                        <td data-label="Trạng thái" style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <span className={`badge ${isCompleted ? 'badge-completed' : isCancelled ? 'badge-cancelled' : 'badge-pending'}`} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '12px' }}>
                            {isCompleted ? 'Hoàn thành' : isCancelled ? 'Hủy' : (o.status || 'Chờ xử lý')}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {paginatedOrders.length > 0 && (
                <tfoot style={{ position: 'sticky', bottom: 0, zIndex: 4, background: 'var(--bg-main, #f8fafc)', borderTop: '2px solid var(--border-color, #cbd5e1)', boxShadow: '0 -2px 8px rgba(0,0,0,0.06)' }}>
                  <tr style={{ background: 'var(--bg-main, #f1f5f9)', fontWeight: '800' }}>
                    <td colSpan="3" style={{ padding: '12px 14px', color: 'var(--text-bright, #0f172a)', fontSize: '13px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '15px' }}>📊</span>
                        <span>
                          Tổng cộng trang {safePage} <span style={{ fontWeight: '600', color: 'var(--text-muted)' }}>({paginatedOrders.length} đơn{platformFilter !== 'ALL' ? ` ${platformFilter}` : ''})</span>
                        </span>
                      </div>
                    </td>
                    <td data-label="Tổng HH Gốc" style={{ padding: '12px 14px', color: 'var(--text-bright, #0f172a)', fontSize: '13px', fontWeight: '800', whiteSpace: 'nowrap' }}>
                      {formatMoney(pageTotalGross)}
                    </td>
                    <td data-label="Tổng Sau thuế" style={{ padding: '12px 14px', color: 'var(--color-warning, #d97706)', fontSize: '13px', fontWeight: '800', whiteSpace: 'nowrap' }}>
                      {formatMoney(pageTotalAfterTax)}
                    </td>
                    <td data-label="Tổng Thực nhận" style={{ padding: '12px 14px', color: 'var(--color-success, #16a34a)', fontSize: '13.5px', fontWeight: '900', whiteSpace: 'nowrap' }}>
                      {formatMoney(pageTotalNet)}
                    </td>
                    <td colSpan="2" style={{ padding: '12px 14px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      Trang {safePage}/{totalPages}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Danh sách thẻ đơn hàng tối ưu dành riêng cho Mobile (Không cần cuộn ngang) */}
          <div className="user-orders-mobile-list">
            {paginatedOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 16px', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                Không có đơn hàng nào phù hợp với bộ lọc này.
              </div>
            ) : (
              <>
                {paginatedOrders.map(o => {
                  const isTiktok = getPlatform(o) === 'TikTok Shop';
                  const isCancelled = isOrderCancelled(o);
                  const isCompleted = o.status === 'Hoàn thành' || o.status === 'Đã chốt HH' || o.status === 'Đã chốt' || o.status === 2 || o.status === 'SETTLED';
                  const rawCommission = getCommission(o);
                  const afterTax = rawCommission * 0.9;
                  const afterDeduction = afterTax * 0.8;
                  const rawTime = o.purchaseTime || o.orderDate || o.createdTime || o.completeTime;
                  return (
                    <div key={o.id || o.orderId} className="user-order-mobile-card">
                      <div className="mobile-order-card-header">
                        <div className="mobile-order-id-wrap">
                          <span className={`mobile-platform-tag ${isTiktok ? 'tiktok' : 'shopee'}`}>
                            {isTiktok ? 'TikTok' : 'Shopee'}
                          </span>
                          <span className="mobile-order-code">{o.orderId}</span>
                        </div>
                        <span className={`badge ${isCompleted ? 'badge-completed' : isCancelled ? 'badge-cancelled' : 'badge-pending'}`}>
                          {isCompleted ? 'Hoàn thành' : isCancelled ? 'Hủy' : (o.status || 'Chờ xử lý')}
                        </span>
                      </div>

                      <div className="mobile-order-product-name">
                        {o.productName || 'Không có tên sản phẩm'}
                      </div>

                      <div className="mobile-order-finance-box">
                        <div className="mobile-finance-col">
                          <span className="finance-col-label">HH Gốc</span>
                          <span className="finance-col-val">{formatMoney(rawCommission)}</span>
                        </div>
                        <div className="mobile-finance-col">
                          <span className="finance-col-label">Sau thuế (10%)</span>
                          <span className="finance-col-val tax">{formatMoney(afterTax)}</span>
                        </div>
                        <div className="mobile-finance-col highlight">
                          <span className="finance-col-label">Thực nhận (80%)</span>
                          <span className="finance-col-val net">{formatMoney(afterDeduction)}</span>
                        </div>
                      </div>

                      <div className="mobile-order-footer">
                        <span className="mobile-order-time">
                          <i className="fa-regular fa-clock" style={{ marginRight: '4px' }}></i>
                          {formatDateTime(rawTime)}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Thẻ tổng cộng trang trên Mobile */}
                <div className="user-order-mobile-summary-card">
                  <div className="mobile-summary-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', fontSize: '13.5px', color: 'var(--text-bright)' }}>
                      <span>📊 Tổng cộng trang {safePage}</span>
                      <span className="mobile-summary-pill">{paginatedOrders.length} đơn{platformFilter !== 'ALL' ? ` ${platformFilter}` : ''}</span>
                    </div>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '600' }}>
                      Trang {safePage}/{totalPages}
                    </span>
                  </div>
                  <div className="mobile-summary-body">
                    <div className="mobile-summary-row">
                      <span>Tổng HH Gốc:</span>
                      <strong>{formatMoney(pageTotalGross)}</strong>
                    </div>
                    <div className="mobile-summary-row">
                      <span>Sau thuế (10%):</span>
                      <strong style={{ color: 'var(--color-warning, #d97706)' }}>{formatMoney(pageTotalAfterTax)}</strong>
                    </div>
                    <div className="mobile-summary-row highlight">
                      <span>Thực nhận (80%):</span>
                      <strong style={{ color: 'var(--color-success, #16a34a)', fontSize: '15px' }}>{formatMoney(pageTotalNet)}</strong>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Thanh phân trang */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px', flexWrap: 'wrap', gap: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <div>
                Hiển thị <strong>{(safePage - 1) * pageSize + 1}</strong> - <strong>{Math.min(safePage * pageSize, filteredOrders.length)}</strong> trên tổng số <strong>{filteredOrders.length}</strong> đơn hàng
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  className="btn"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  style={{ padding: '5px 12px', fontSize: '12px', opacity: safePage <= 1 ? 0.5 : 1, cursor: safePage <= 1 ? 'not-allowed' : 'pointer' }}
                >
                  <i className="fa-solid fa-chevron-left" style={{ marginRight: '4px' }}></i> Trước
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .map((p, idx, arr) => (
                    <span key={p} style={{ display: 'inline-flex', alignItems: 'center' }}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span style={{ padding: '0 4px' }}>...</span>}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(p)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          border: safePage === p ? '1.5px solid #f97316' : '1px solid var(--border-color)',
                          background: safePage === p ? '#f97316' : 'var(--bg-main)',
                          color: safePage === p ? '#ffffff' : 'var(--text-main)',
                          fontWeight: safePage === p ? '800' : '600',
                          cursor: 'pointer',
                          fontSize: '12.5px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {p}
                      </button>
                    </span>
                  ))}

                <button
                  type="button"
                  className="btn"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  style={{ padding: '5px 12px', fontSize: '12px', opacity: safePage >= totalPages ? 0.5 : 1, cursor: safePage >= totalPages ? 'not-allowed' : 'pointer' }}
                >
                  Sau <i className="fa-solid fa-chevron-right" style={{ marginLeft: '4px' }}></i>
                </button>
              </div>
            </div>
          )}
        </div>

        <footer className="modal-footer" style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn" onClick={onClose} style={{ padding: '8px 24px', fontWeight: '700' }}>Đóng lại</button>
        </footer>
      </div>
    </div>
  );
}

export default function UsersTab() {
  const { users, orders } = useApp();
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  const filteredUsers = users.filter(u =>
    u.zaloName?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.zaloId?.includes(userSearch)
  );

  return (
    <>
      <div className="data-card">
        <div className="search-container">
          <input
            type="text"
            className="form-control"
            placeholder="Tìm kiếm thành viên (Tên/Zalo ID)..."
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
          />
        </div>
        <div className="table-container">
          <table style={{ tableLayout: 'fixed', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Tên thành viên</th>
                <th style={{ width: '110px' }}>Zalo ID</th>
                <th style={{ width: '150px' }}>Tài khoản nhận tiền</th>
                <th style={{ width: '95px', textAlign: 'right' }} title="Đơn đang chờ Shopee đối soát">Chờ xử lý</th>
                <th style={{ width: '150px', textAlign: 'right' }}>Tích lũy hoàn thành</th>
                <th style={{ width: '105px', textAlign: 'right' }} title="Số tiền có thể rút ngay">Khả dụng rút</th>
                <th style={{ width: '90px', textAlign: 'right' }}>Đã rút</th>
                <th style={{ width: '70px', textAlign: 'center' }}>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr className="empty-row"><td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Không tìm thấy thành viên phù hợp</td></tr>
              ) : (
                filteredUsers.map(u => {
                  const bankAndAcc = getBankAndAccount(u);
                  return (
                    <tr key={u.zaloId}>
                      <td data-label="Tên thành viên" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <strong title={u.zaloName}>{u.zaloName || 'Vô danh (Chờ đồng bộ)'}</strong>
                      </td>
                      <td data-label="Zalo ID" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <code style={{ color: 'var(--text-muted)', fontSize: '11.5px' }} title={u.zaloId}>{u.zaloId}</code>
                      </td>
                      <td data-label="Tài khoản nhận tiền">
                        <div style={{ fontSize: '13px', fontWeight: '500' }}>{bankAndAcc.bankName || '⚠️ Chưa cập nhật'}</div>
                        {bankAndAcc.accountNumber && <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}><code>{bankAndAcc.accountNumber}</code></div>}
                      </td>
                      <td data-label="Chờ xử lý" style={{ color: 'var(--color-warning)', textAlign: 'right', fontWeight: '500' }}>{formatMoney(u.wallet?.pendingCommission)}</td>
                      <td data-label="Tích lũy hoàn thành" style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Gốc: {formatMoney(u.wallet?.completedCommission)}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--color-warning)', marginTop: '2px' }}>Sau thuế: {formatMoney((u.wallet?.completedCommission || 0) * 0.9)}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--color-success)', marginTop: '2px', fontWeight: '600' }}>Khách: {formatMoney((u.wallet?.completedCommission || 0) * 0.9 * 0.8)}</div>
                      </td>
                      <td data-label="Khả dụng rút" style={{ color: 'var(--color-success)', fontWeight: '700', textAlign: 'right' }}>{formatMoney(u.wallet?.withdrawableCommission)}</td>
                      <td data-label="Đã rút" style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{formatMoney(u.wallet?.receivedCommission)}</td>
                      <td data-label="Chi tiết" style={{ textAlign: 'center' }}>
                        <button className="user-view-btn" onClick={() => setSelectedUser(u)}>
                          <i className="fa-regular fa-eye"></i> Xem
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      <UserDetailModal selectedUser={selectedUser} onClose={() => setSelectedUser(null)} orders={orders} />
    </>
  );
}
