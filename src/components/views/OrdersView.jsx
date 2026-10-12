import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney, formatDateTime } from '../../utils/formatters';
import CopyButton from '../common/CopyButton';

export default function OrdersView() {
  const { API_URL_ROOT, user, showToast, setView } = useApp();
  const [orders, setOrders] = useState([]);
  const [walletStats, setWalletStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [platformFilter, setPlatformFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const res = await fetch(`${API_URL_ROOT}/api/user/orders/history`, {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setOrders(data.data.orders || []);
        setWalletStats(data.data.stats || {});
      } else {
        showToast(data.message || 'Lỗi tải lịch sử đơn hàng', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Không thể tải lịch sử đơn hàng', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Tính toán số liệu thống kê
  const totalComm = orders.reduce((acc, o) => acc + (o.commission || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'Chờ xử lý' || o.status === 'Đang xử lý' || o.status === 'Chờ duyệt');
  const completedOrders = orders.filter(o => o.status === 'Hoàn thành' || o.status === 'Đã chốt');
  const pendingComm = pendingOrders.reduce((acc, o) => acc + (o.commission || 0), 0);
  const completedComm = completedOrders.reduce((acc, o) => acc + (o.commission || 0), 0);
  const withdrawableComm = walletStats?.withdrawable || user?.balance || 0;
  const receivedComm = walletStats?.received || 0;

  // Lọc đơn hàng
  const filteredOrders = orders.filter((o) => {
    // Platform filter
    if (platformFilter !== 'ALL') {
      const p = (o.platform || '').toUpperCase();
      if (platformFilter === 'Shopee' && p !== 'SHOPEE' && p !== 'SHOPEE_FOOD') return false;
      if (platformFilter === 'ShopeeFood' && p !== 'SHOPEE_FOOD') return false;
      if (platformFilter === 'TikTok' && p !== 'TIKTOK') return false;
      if (platformFilter === 'Lazada' && p !== 'LAZADA') return false;
    }

    // Source filter (Web vs Zalo)
    if (sourceFilter !== 'ALL' && o.source !== sourceFilter) return false;

    // Status filter
    if (statusFilter === 'COMPLETED' && o.status !== 'Hoàn thành' && o.status !== 'Đã chốt') return false;
    if (statusFilter === 'PENDING' && o.status !== 'Chờ xử lý' && o.status !== 'Đang xử lý' && o.status !== 'Chờ duyệt') return false;
    if (statusFilter === 'CANCELLED' && o.status !== 'Đã hủy' && o.status !== 'Hủy') return false;

    // Date filter
    if (dateFilter !== 'ALL' && o.purchaseTime) {
      const pDate = new Date(o.purchaseTime);
      const now = new Date();
      if (dateFilter === 'TODAY' && pDate.toDateString() !== now.toDateString()) return false;
      if (dateFilter === 'YESTERDAY') {
        const yest = new Date();
        yest.setDate(yest.getDate() - 1);
        if (pDate.toDateString() !== yest.toDateString()) return false;
      } else if (dateFilter === '7DAYS') {
        const d7 = new Date();
        d7.setDate(d7.getDate() - 7);
        if (pDate < d7) return false;
      } else if (dateFilter === 'THIS_MONTH') {
        if (pDate.getMonth() !== now.getMonth() || pDate.getFullYear() !== now.getFullYear()) return false;
      }
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchId = String(o.orderId || '').toLowerCase().includes(q);
      const matchName = String(o.productName || '').toLowerCase().includes(q);
      const matchSub = String(o.subId || '').toLowerCase().includes(q);
      if (!matchId && !matchName && !matchSub) return false;
    }

    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const displayedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="orders-view-wrapper" style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
      {/* 5 Thẻ Thống Kê Chuẩn Bê Từ OrderLookupView (Đẹp, Chuẩn Cả Light/Dark Mode) */}
      <div className="stats-container" style={{ width: '100%', marginBottom: '22px' }}>
        <h3 className="stats-section-title" style={{ fontSize: '17px', fontWeight: '800', marginBottom: '14px', color: 'var(--text-bright)' }}>
          💰 Thống Kê Đơn Hàng Của Bạn: <span style={{ color: 'var(--color-primary, #ea580c)' }}>{user?.fullName || user?.email}</span>
        </h3>

        <div className="stats-cards-grid">
          {/* Thẻ 0: Tổng tích lũy chiếm full hàng */}
          <div className="stat-card-item total" style={{ gridColumn: '1 / -1' }}>
            <span className="stat-card-label">🌟 TỔNG TÍCH LŨY (HOÀN THÀNH + CHỜ)</span>
            <span className="stat-card-sub">(Toàn bộ hoa hồng từ đơn Web & Bot Zalo)</span>
            <span className="stat-card-value primary">
              {formatMoney(totalComm)}
            </span>
          </div>

          {/* Thẻ 1: Đang xử lý */}
          <div className="stat-card-item pending">
            <span className="stat-card-label">⏳ ĐANG XỬ LÝ ({pendingOrders.length} ĐƠN)</span>
            <span className="stat-card-sub">(Đang vận chuyển hoặc đang đối soát)</span>
            <span className="stat-card-value">
              {formatMoney(pendingComm)}
            </span>
          </div>

          {/* Thẻ 2: Đã hoàn thành */}
          <div className="stat-card-item completed">
            <span className="stat-card-label">📦 ĐÃ HOÀN THÀNH ({completedOrders.length} ĐƠN)</span>
            <span className="stat-card-sub">(Đơn giao thành công và ghi nhận HH)</span>
            <span className="stat-card-value">
              {formatMoney(completedComm)}
            </span>
          </div>

          {/* Thẻ 3: Số dư khả dụng */}
          <div className="stat-card-item withdrawable">
            <span className="stat-card-label">💵 SỐ DƯ KHẢ DỤNG</span>
            <span className="stat-card-sub">(Đủ điều kiện rút ngay về tài khoản)</span>
            <span className="stat-card-value">
              {formatMoney(withdrawableComm)}
            </span>
          </div>

          {/* Thẻ 4: Đã nhận tiền */}
          <div className="stat-card-item received">
            <span className="stat-card-label">🏦 ĐÃ RÚT THÀNH CÔNG</span>
            <span className="stat-card-sub">(Tổng tiền đã giải ngân về ngân hàng)</span>
            <span className="stat-card-value">
              {formatMoney(receivedComm)}
            </span>
          </div>
        </div>
      </div>

      {/* Banner Liên Kết Zalo ID Hiện Đại (Tương Thích Cả Dark Mode và Light Mode) */}
      {!user?.zaloId ? (
        <div style={{
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(2, 132, 199, 0.04) 100%)',
          border: '1.5px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: '#2563eb',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              flexShrink: 0
            }}>
              <i className="fa-solid fa-link"></i>
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: 'var(--text-bright)' }}>
                💡 Bạn đã từng mua hàng qua Bot Zalo?
              </h4>
              <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Liên kết Zalo ID vào tài khoản Web để xem trọn vẹn toàn bộ đơn hàng đặt từ trước đến nay!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setView('account')}
            className="lookup-btn"
            style={{
              padding: '9px 18px',
              fontSize: '13px',
              borderRadius: '10px',
              width: 'auto',
              cursor: 'pointer'
            }}
          >
            <i className="fa-solid fa-link"></i>
            <span>Liên Kết Zalo ID Ngay</span>
          </button>
        </div>
      ) : (
        <div style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '14px',
          padding: '12px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '13px',
          color: 'var(--text-bright)',
          fontWeight: '700',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-circle-check" style={{ color: '#10b981', fontSize: '16px' }}></i>
            <span>Đã liên kết Zalo ID: <strong style={{ color: '#0284c7', fontFamily: 'monospace' }}>{user.zaloId}</strong> — Hệ thống đang đồng bộ toàn bộ đơn từ cả Web và Zalo Bot!</span>
          </span>
          <button
            type="button"
            onClick={() => setView('account')}
            style={{ background: 'none', border: 'none', color: 'var(--color-primary, #ea580c)', textDecoration: 'underline', cursor: 'pointer', fontSize: '12.5px', fontWeight: '700' }}
          >
            Quản lý Zalo ID
          </button>
        </div>
      )}

      {/* Filter Tabs & Search Bar Chuẩn Giao Diện OrderLookupView */}
      <div className="lookup-card" style={{ padding: '18px 20px', marginBottom: '20px' }}>
        {/* Row 1: Platform Filter Tabs */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
            Sàn Mua Sắm:
          </div>
          <div className="lookup-tabs" style={{ marginBottom: 0 }}>
            <button className={`lookup-tab ${platformFilter === 'ALL' ? 'active' : ''}`} onClick={() => { setPlatformFilter('ALL'); setCurrentPage(1); }}>
              Tất cả ({orders.length})
            </button>
            <button className={`lookup-tab ${platformFilter === 'Shopee' ? 'active' : ''}`} onClick={() => { setPlatformFilter('Shopee'); setCurrentPage(1); }}>
              Shopee
            </button>
            <button className={`lookup-tab ${platformFilter === 'TikTok' ? 'active' : ''}`} onClick={() => { setPlatformFilter('TikTok'); setCurrentPage(1); }}>
              TikTok Shop
            </button>
            <button className={`lookup-tab ${platformFilter === 'Lazada' ? 'active' : ''}`} onClick={() => { setPlatformFilter('Lazada'); setCurrentPage(1); }}>
              Lazada
            </button>
            <button className={`lookup-tab ${platformFilter === 'ShopeeFood' ? 'active' : ''}`} onClick={() => { setPlatformFilter('ShopeeFood'); setCurrentPage(1); }}>
              ShopeeFood
            </button>
          </div>
        </div>

        {/* Row 2: Source Filter & Quick Date Filter */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
          {/* Nguồn Đơn: Web vs Zalo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>Nguồn:</span>
            {[
              { key: 'ALL', label: 'Tất cả' },
              { key: 'WEB', label: '🌐 Đơn Web' },
              { key: 'ZALO', label: '💬 Đơn Zalo' },
            ].map(s => (
              <button
                key={s.key}
                type="button"
                onClick={() => { setSourceFilter(s.key); setCurrentPage(1); }}
                style={{
                  padding: '5px 12px',
                  borderRadius: '16px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: sourceFilter === s.key ? '800' : '600',
                  background: sourceFilter === s.key ? 'var(--color-primary, #ea580c)' : 'var(--bg-main)',
                  color: sourceFilter === s.key ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Quick Date Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { key: 'ALL', label: 'Tất cả ngày' },
              { key: 'TODAY', label: 'Hôm nay' },
              { key: 'YESTERDAY', label: 'Hôm qua' },
              { key: '7DAYS', label: '7 ngày qua' },
              { key: 'THIS_MONTH', label: 'Tháng này' }
            ].map(d => (
              <button
                key={d.key}
                type="button"
                onClick={() => { setDateFilter(d.key); setCurrentPage(1); }}
                style={{
                  padding: '5px 10px',
                  borderRadius: '14px',
                  border: 'none',
                  fontSize: '11.5px',
                  fontWeight: dateFilter === d.key ? '800' : '600',
                  background: dateFilter === d.key ? 'rgba(249, 115, 22, 0.15)' : 'var(--bg-main)',
                  color: dateFilter === d.key ? 'var(--color-primary, #ea580c)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: Keyword Search Input */}
        <div style={{ position: 'relative', width: '100%' }}>
          <i
            className="fa-solid fa-magnifying-glass"
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-primary, #ea580c)',
              fontSize: '13px'
            }}
          ></i>
          <input
            type="text"
            className="lookup-input"
            style={{ width: '100%', padding: '10px 14px 10px 38px', fontSize: '13.5px', borderRadius: '12px', margin: 0 }}
            placeholder="Lọc nhanh theo tên sản phẩm, mã đơn hàng..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>

      {/* Orders List: Sử Dụng Card Đơn Hàng .order-card-item Y Hệt OrderLookupView */}
      <div className="orders-container" style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h3 className="stats-section-title" style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: 'var(--text-bright)' }}>
            🛒 Danh Sách Đơn Hàng ({filteredOrders.length})
          </h3>
          <button
            type="button"
            onClick={fetchOrders}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary, #ea580c)',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <i className="fa-solid fa-rotate-right"></i>
            <span>Làm mới</span>
          </button>
        </div>

        {loading ? (
          <div className="lookup-card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div className="lookup-spinner" style={{ margin: '0 auto 12px', borderColor: 'rgba(234,88,12,0.3)', borderTopColor: '#ea580c' }}></div>
            <div style={{ fontWeight: '600', fontSize: '14px' }}>Đang tải danh sách đơn hàng của bạn...</div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="lookup-card" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <i className="fa-solid fa-box-open" style={{ fontSize: '32px', color: 'var(--text-subtle)', marginBottom: '12px' }}></i>
            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-bright)' }}>Không tìm thấy đơn hàng nào</div>
            <p style={{ margin: '6px 0 0 0', fontSize: '12.5px' }}>
              Chưa có đơn hàng nào khớp với điều kiện lọc. Hãy tạo link tiếp thị ở mục Chuyển Đổi để bắt đầu mua sắm tích lũy hoa hồng!
            </p>
          </div>
        ) : (
          <>
            {displayedOrders.map((o, idx) => {
              const isCompleted = o.status === 'Hoàn thành' || o.status === 'Đã chốt';
              const isCancelled = o.status === 'Hủy' || o.status === 'Đã hủy';
              const statusColor = isCompleted ? '#059669' : isCancelled ? '#dc2626' : '#d97706';

              return (
                <div key={o.id || idx} className="order-card-item">
                  {/* Header: Date + Source Tag + Order ID + Copy */}
                  <div className="order-card-header">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fa-regular fa-calendar" style={{ color: 'var(--text-muted)', fontSize: '13px' }}></i>
                      <span>{formatDateTime(o.purchaseTime)}</span>

                      {/* Tag Nguồn Đơn: Web vs Zalo */}
                      {o.source === 'WEB' ? (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: 'rgba(249, 115, 22, 0.12)',
                          color: 'var(--color-primary, #ea580c)',
                          fontSize: '10.5px',
                          fontWeight: '800',
                          border: 'none'
                        }}>
                          🌐 Đơn Web
                        </span>
                      ) : (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: 'rgba(2, 132, 199, 0.12)',
                          color: '#0284c7',
                          fontSize: '10.5px',
                          fontWeight: '800',
                          border: 'none'
                        }}>
                          💬 Đơn Zalo
                        </span>
                      )}
                    </span>

                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                      Mã đơn: <span className="order-id-badge" style={{ marginLeft: '4px' }}>{o.orderId}</span>
                      <CopyButton text={o.orderId} title="Copy mã đơn hàng" toastMessage={`Đã copy mã đơn: ${o.orderId}`} />
                    </span>
                  </div>

                  {/* Title & Platform */}
                  <div className="order-card-title" title={o.productName}>
                    <span style={{
                      display: 'inline-block',
                      marginRight: '6px',
                      fontSize: '11px',
                      fontWeight: '800',
                      padding: '2px 6px',
                      borderRadius: '6px',
                      background: o.platform === 'SHOPEE_FOOD' ? 'rgba(220, 38, 38, 0.12)' : (o.platform === 'TIKTOK' ? 'rgba(0, 0, 0, 0.08)' : (o.platform === 'LAZADA' ? 'rgba(37, 99, 235, 0.12)' : 'rgba(234, 88, 12, 0.12)')),
                      color: o.platform === 'SHOPEE_FOOD' ? '#dc2626' : (o.platform === 'TIKTOK' ? 'var(--text-bright)' : (o.platform === 'LAZADA' ? '#2563eb' : '#ea580c'))
                    }}>
                      {o.platform === 'SHOPEE_FOOD' ? 'ShopeeFood' : (o.platform || 'Shopee')}
                    </span>
                    {o.productName || 'Sản phẩm tiếp thị'}
                  </div>

                  {/* Commission Row */}
                  <div className="order-card-commission-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{ color: statusColor, fontSize: '12.5px', fontWeight: '800' }}>
                        {o.status || 'Chờ xử lý'}
                      </span>
                      {o.subId && (
                        <span style={{ fontSize: '11px', color: 'var(--text-subtle)', fontFamily: 'monospace' }}>
                          SubID: {o.subId}
                        </span>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="order-commission-label" style={{ marginRight: '6px' }}>Hoa hồng nhận:</span>
                      <span className="order-commission-val" style={{ color: isCompleted ? '#059669' : '#ea580c' }}>
                        {formatMoney(o.commission)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 4px' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: '600' }}>
                  Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredOrders.length)} / {filteredOrders.length} đơn
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="lookup-admin-link"
                    style={{ padding: '5px 12px', fontSize: '12px' }}
                  >
                    Trước
                  </button>
                  <span style={{ fontSize: '12.5px', fontWeight: '800', color: 'var(--color-primary, #ea580c)', padding: '4px 8px' }}>
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="lookup-admin-link"
                    style={{ padding: '5px 12px', fontSize: '12px' }}
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
