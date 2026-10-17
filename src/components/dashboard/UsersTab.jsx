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

  // Lấy toàn bộ đơn hàng của thành viên này (theo cả zaloId, subId và tài khoản Web đã liên kết)
  const userOrders = (orders || []).filter(o => {
    if (!o) return false;
    const zid = selectedUser?.zaloId;
    if (o.zaloId && o.zaloId === zid) return true;
    if (o.subId && o.subId === zid) return true;
    if (zid === '5128074989288259190' || zid === 'PhamThang') {
      if (o.zaloId === 'PhamThang' || o.subId === 'PhamThang') return true;
      if (o.subId && (o.subId.startsWith('phamthang_2_') || o.subId.startsWith('u2') || o.subId.startsWith('web_2_'))) return true;
    }
    const webUid = selectedUser?.webUserId;
    if (webUid && o.subId && (o.subId.startsWith(`phamthang_${webUid}_`) || o.subId.startsWith(`u${webUid}`) || o.subId.startsWith(`web_${webUid}_`))) return true;
    return false;
  });

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

          {/* Thẻ thống kê ví hoa hồng thành viên */}
          <div className="stats-grid modal-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            <div className="stat-card" style={{ padding: '14px 16px', background: 'var(--bg-card)', border: '1.5px solid var(--border-color)', borderRadius: '12px' }}>
              <span className="stat-label" style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted, #475569)' }}>Tổng đơn hàng (Xử lý + Hoàn thành)</span>
              <span className="stat-val" style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-primary, #ea580c)' }}>
                {formatMoney((selectedUser.wallet?.pendingCommission || 0) + (selectedUser.wallet?.rawCompletedCommission != null ? selectedUser.wallet.rawCompletedCommission : (selectedUser.wallet?.completedCommission || 0)))}
              </span>
            </div>
            <div className="stat-card" style={{ padding: '14px 16px', background: 'var(--bg-card)', border: '1.5px solid var(--border-color)', borderRadius: '12px' }}>
              <span className="stat-label" style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted, #475569)' }}>Chờ xử lý</span>
              <span className="stat-val" style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-bright)' }}>{formatMoney(selectedUser.wallet?.pendingCommission)}</span>
            </div>
            <div className="stat-card success" style={{ padding: '14px 16px', background: 'var(--bg-card)', border: '1.5px solid var(--border-color)', borderRadius: '12px' }}>
              <span className="stat-label" style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted, #475569)' }}>Đã hoàn thành (Chưa đủ 3 ngày)</span>
              <span className="stat-val" style={{ fontSize: '20px', fontWeight: '800', color: '#059669' }}>
                {formatMoney(selectedUser.wallet?.completedNotYetWithdrawable != null ? selectedUser.wallet.completedNotYetWithdrawable : selectedUser.wallet?.completedCommission)}
              </span>
            </div>
            <div className="stat-card warning" style={{ padding: '14px 16px', background: 'var(--bg-card)', border: '1.5px solid var(--border-color)', borderRadius: '12px' }}>
              <span className="stat-label" style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted, #475569)' }}>Có thể rút (Khả dụng)</span>
              <span className="stat-val" style={{ fontSize: '20px', fontWeight: '800', color: '#ea580c' }}>{formatMoney(selectedUser.wallet?.withdrawableCommission)}</span>
            </div>
            <div className="stat-card" style={{ padding: '14px 16px', background: 'var(--bg-card)', border: '1.5px solid var(--border-color)', borderRadius: '12px' }}>
              <span className="stat-label" style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted, #475569)' }}>Đã rút (Đã thanh toán)</span>
              <span className="stat-val" style={{ fontSize: '20px', fontWeight: '800', color: '#16a34a' }}>{formatMoney(selectedUser.wallet?.receivedCommission)}</span>
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
                  background: platformFilter === 'Shopee' ? '#ee4d2d' : 'var(--bg-main, #f8fafc)',
                  color: platformFilter === 'Shopee' ? '#ffffff' : 'var(--text-main)',
                  transition: 'all 0.2s ease'
                }}
              >
                <svg viewBox="0 0 109.59 122.88" style={{ width: '13px', height: '13px', fill: 'currentColor', flexShrink: 0 }}>
                  <path d="M74.98,91.98C76.15,82.36,69.96,76.22,53.6,71c-7.92-2.7-11.66-6.24-11.57-11.12 c0.33-5.4,5.36-9.34,12.04-9.47c4.63,0.09,9.77,1.22,14.76,4.56c0.59,0.37,1.01,0.32,1.35-0.2c0.46-0.74,1.61-2.53,2-3.17 c0.26-0.42,0.31-0.96-0.35-1.44c-0.95-0.7-3.6-2.13-5.03-2.72c-3.88-1.62-8.23-2.64-12.86-2.63c-9.77,0.04-17.47,6.22-18.12,14.47 c-0.42,5.95,2.53,10.79,8.86,14.47c1.34,0.78,8.6,3.67,11.49,4.57c9.08,2.83,13.8,7.9,12.69,13.81c-1.01,5.36-6.65,8.83-14.43,8.93 c-6.17-0.24-11.71-2.75-16.02-6.1c-0.11-0.08-0.65-0.5-0.72-0.56c-0.53-0.42-1.11-0.39-1.47,0.15c-0.26,0.4-1.92,2.8-2.34,3.43 c-0.39,0.55-0.18,0.86,0.23,1.2c1.8,1.5,4.18,3.14,5.81,3.97c4.47,2.28,9.32,3.53,14.48,3.72c3.32,0.22,7.5-0.49,10.63-1.81 C70.63,102.67,74.25,97.92,74.98,91.98L74.98,91.98z M54.79,7.18c-10.59,0-19.22,9.98-19.62,22.47h39.25 C74.01,17.16,65.38,7.18,54.79,7.18z M94.99,122.88l-0.41,0l-80.82-0.01h0c-5.5-0.21-9.54-4.66-10.09-10.19l-0.05-1 l-3.61-79.5v0C0,32.12,0,32.06,0,32c0-1.28,1.03-2.33,2.3-2.35l0,0h25.48C28.41,13.15,40.26,0,54.79,0s26.39,13.15,27.01,29.65 h25.4h0.04c1.3,0,2.35,1.05,2.35,2.35c0,0.04,0,0.08,0,0.12v0l-3.96,79.81l-0.04,0.68C105.12,118.21,100.59,122.73,94.99,122.88 L94.99,122.88z" />
                </svg>
                <span>Shopee ({shopeeOrdersCount})</span>
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
                  border: platformFilter === 'TikTok' ? '1.5px solid #000000' : '1px solid var(--border-color)',
                  background: platformFilter === 'TikTok' ? '#000000' : 'var(--bg-main, #f8fafc)',
                  color: platformFilter === 'TikTok' ? '#ffffff' : 'var(--text-main)',
                  transition: 'all 0.2s ease',
                  boxShadow: platformFilter === 'TikTok' ? '0 4px 12px rgba(0,0,0,0.3)' : 'none'
                }}
              >
                <svg viewBox="0 0 1024 1024" style={{ width: '13px', height: '13px', fill: 'currentColor', flexShrink: 0 }}>
                  <path d="M800 112.962C800 50.575 749.425 0 687.038 0H112.962C50.575 0 0 50.575 0 112.962v574.076C0 749.426 50.575 800 112.962 800h574.076C749.425 800 800 749.426 800 687.038zM662.759 348.916c-51.615.577-99.71-15.027-141.938-43.927v202.874c0 90.166-61.72 167.62-148.996 187.848-119.068 27.165-219.864-58.954-232.577-161.835-13.294-102.884 52.322-193.051 152.892-213.281 19.651-4.045 49.209-4.045 64.458-.577v108.661c-4.692-1.153-9.086-2.31-13.709-2.888-39.304-6.937-77.371 12.715-92.977 48.55-15.605 35.838-5.16 77.451 26.629 101.73 26.586 20.806 56.085 23.694 86.14 9.822 30.057-13.291 46.21-37.567 49.676-70.512.578-4.622.546-9.826.546-15.028V110.206c0-10.981.086-10.502 11.068-10.502h86.12c6.36 0 8.673.915 9.25 8.433 4.621 67.047 55.526 124.147 120.838 132.818 6.937 1.155 14.369 1.613 22.58 2.19z" transform="translate(112 112)"/>
                </svg>
                <span>TikTok Shop ({tiktokOrdersCount})</span>
              </button>
            </div>
          </div>

          {/* Bảng đơn hàng dành cho Desktop / Mobile (Cuộn ngang) */}
          <div className="table-container user-orders-modal-table-container" style={{ maxHeight: '420px', overflowY: 'auto', overflowX: 'auto', WebkitOverflowScrolling: 'touch', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px' }}>
            <table style={{ width: '100%', minWidth: '780px', borderCollapse: 'collapse', textAlign: 'left' }}>
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
                          <span>{o.orderId}</span>
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
      <style dangerouslySetInnerHTML={{ __html: `
        .users-table-container {
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch !important;
          width: 100% !important;
          display: block !important;
        }
        .users-table-container table,
        .users-table-container table.users-table,
        table.users-table {
          display: table !important;
          min-width: 1050px !important;
          width: 100% !important;
          table-layout: fixed !important;
          border-collapse: collapse !important;
        }
        .users-table-container table thead {
          display: table-header-group !important;
        }
        .users-table-container table thead tr {
          display: table-row !important;
          background: var(--bg-main, #f1f5f9) !important;
        }
        .users-table-container table thead th {
          display: table-cell !important;
          padding: 14px 16px !important;
          white-space: nowrap !important;
          font-weight: 700 !important;
          font-size: 13px !important;
          border-bottom: 2px solid var(--border-color) !important;
        }
        .users-table-container table tbody {
          display: table-row-group !important;
          gap: 0 !important;
        }
        .users-table-container table tbody tr {
          display: table-row !important;
          background: transparent !important;
          border: none !important;
          border-bottom: 1px solid var(--border-color) !important;
          border-radius: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
          margin: 0 !important;
        }
        .users-table-container table tbody tr:hover {
          background: rgba(249, 115, 22, 0.04) !important;
          border-color: var(--border-color) !important;
          box-shadow: none !important;
        }
        .users-table-container table tbody tr td {
          display: table-cell !important;
          padding: 14px 16px !important;
          width: auto !important;
          border-bottom: 1px solid var(--border-color) !important;
          border-top: none !important;
          box-shadow: none !important;
          font-size: 13px !important;
          vertical-align: middle !important;
        }
        .users-table-container table tbody tr td::before {
          display: none !important;
          content: none !important;
        }
        .users-table-container table tbody tr td[data-label="Tên thành viên"] {
          font-size: 13px !important;
          font-weight: normal !important;
          border-bottom: 1px solid var(--border-color) !important;
          padding: 14px 16px !important;
        }
        html[data-theme="dark"] .users-table-container table tbody tr,
        html.dark .users-table-container table tbody tr,
        body.dark .users-table-container table tbody tr {
          background: transparent !important;
          border: none !important;
          border-radius: 0 !important;
          box-shadow: none !important;
        }
        html[data-theme="dark"] .users-table-container table tbody tr td,
        html.dark .users-table-container table tbody tr td,
        body.dark .users-table-container table tbody tr td {
          background: transparent !important;
          border-top: none !important;
          border-left: none !important;
          border-right: none !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
          box-shadow: none !important;
        }
        html[data-theme="dark"] .users-table-container table tbody tr:hover,
        html.dark .users-table-container table tbody tr:hover,
        body.dark .users-table-container table tbody tr:hover {
          background: rgba(255, 255, 255, 0.03) !important;
        }
        html[data-theme="dark"] .users-table-container table thead th,
        html.dark .users-table-container table thead th,
        body.dark .users-table-container table thead th {
          background: #0f172a !important;
          color: #94a3b8 !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
        }
        .user-orders-modal-table-container {
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch !important;
          display: block !important;
        }
        .user-orders-modal-table-container table {
          display: table !important;
          min-width: 780px !important;
          width: 100% !important;
          border-collapse: collapse !important;
        }
        .user-orders-modal-table-container table thead {
          display: table-header-group !important;
        }
        .user-orders-modal-table-container table thead tr {
          display: table-row !important;
        }
        .user-orders-modal-table-container table thead th {
          display: table-cell !important;
          white-space: nowrap !important;
        }
        .user-orders-modal-table-container table tbody {
          display: table-row-group !important;
        }
        .user-orders-modal-table-container table tbody tr {
          display: table-row !important;
          background: transparent !important;
          border-radius: 0 !important;
          border: none !important;
          border-bottom: 1px solid var(--border-color) !important;
          box-shadow: none !important;
        }
        .user-orders-modal-table-container table tbody tr td {
          display: table-cell !important;
          white-space: nowrap !important;
          border-bottom: 1px solid var(--border-color) !important;
        }
        .user-orders-modal-table-container table tbody tr td::before {
          display: none !important;
          content: none !important;
        }
        .user-orders-modal-table-container table tfoot {
          display: table-footer-group !important;
        }
        .user-orders-modal-table-container table tfoot tr {
          display: table-row !important;
        }
        .user-orders-modal-table-container table tfoot td {
          display: table-cell !important;
          white-space: nowrap !important;
        }
        .user-orders-modal-table-container table tfoot td::before {
          display: none !important;
          content: none !important;
        }
        .users-table-container table tbody tr td[data-label="Khả dụng rút"] {
          background: transparent !important;
          border: none !important;
          border-bottom: 1px solid var(--border-color) !important;
          box-shadow: none !important;
          text-shadow: none !important;
        }
        .users-table-container table tbody tr td[data-label="Chi tiết"] button,
        .user-view-btn {
          background: none !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
      `}} />
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
        <div className="table-container users-table-container" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="users-table" style={{ tableLayout: 'fixed', width: '100%', minWidth: '1050px' }}>
            <thead>
              <tr>
                <th style={{ width: '165px' }}>Tên thành viên</th>
                <th style={{ width: '160px' }}>Zalo ID</th>
                <th style={{ width: '185px' }}>
                  <i className="fa-solid fa-building-columns" style={{ marginRight: '6px', color: '#ea580c' }}></i>
                  Tài khoản nhận tiền
                </th>
                <th style={{ width: '110px', textAlign: 'right' }} title="Đơn đang chờ Shopee đối soát">Chờ xử lý</th>
                <th style={{ width: '135px', textAlign: 'right' }}>Tổng đơn hàng</th>
                <th style={{ width: '130px', textAlign: 'right' }} title="Số tiền có thể rút ngay">Khả dụng rút</th>
                <th style={{ width: '105px', textAlign: 'right' }}>Đã rút</th>
                <th style={{ width: '85px', textAlign: 'center' }}>Chi tiết</th>
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
                        <strong title={u.zaloName} style={{ fontSize: '13.5px' }}>{u.zaloName || 'Vô danh (Chờ đồng bộ)'}</strong>
                      </td>
                      <td data-label="Zalo ID" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <code style={{ color: 'var(--text-muted)', fontSize: '12px' }} title={u.zaloId}>{u.zaloId}</code>
                      </td>
                      <td data-label="Tài khoản nhận tiền" style={{ whiteSpace: 'nowrap' }}>
                        {bankAndAcc.bankName ? (
                          <div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '6px',
                                background: 'rgba(234, 88, 12, 0.1)',
                                color: '#ea580c',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                flexShrink: 0
                              }}>
                                <i className="fa-solid fa-building-columns"></i>
                              </span>
                              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-bright)' }}>
                                {bankAndAcc.bankName}
                              </span>
                            </div>
                            {bankAndAcc.accountNumber && (
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '5px', paddingLeft: '28px' }}>
                                <i className="fa-regular fa-credit-card" style={{ fontSize: '10px', opacity: 0.7 }}></i>
                                <code>{bankAndAcc.accountNumber}</code>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ fontSize: '12.5px', fontWeight: '600', color: '#eab308', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <i className="fa-solid fa-triangle-exclamation"></i>
                            <span>Chưa cập nhật</span>
                          </div>
                        )}
                      </td>
                      <td data-label="Chờ xử lý" style={{ color: 'var(--color-warning)', textAlign: 'right', fontWeight: '500' }}>{formatMoney(u.wallet?.pendingCommission)}</td>
                      <td data-label="Tổng đơn hàng" style={{ textAlign: 'right', fontWeight: '700', color: 'var(--color-primary, #ea580c)' }}>
                        {formatMoney((u.wallet?.pendingCommission || 0) + (u.wallet?.rawCompletedCommission != null ? u.wallet.rawCompletedCommission : (u.wallet?.completedCommission || 0)))}
                      </td>
                      <td data-label="Khả dụng rút" style={{ color: '#10b981', fontWeight: '700', textAlign: 'right', background: 'transparent' }}>
                        {formatMoney(u.wallet?.withdrawableCommission)}
                      </td>
                      <td data-label="Đã rút" style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{formatMoney(u.wallet?.receivedCommission)}</td>
                      <td data-label="Chi tiết" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="user-view-btn"
                          onClick={() => setSelectedUser(u)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ea580c',
                            fontWeight: '700',
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: 0
                          }}
                        >
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
