import React, { useState, useEffect, useMemo } from 'react';
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
  const totalComm = useMemo(() => orders.reduce((acc, o) => acc + (o.commission || 0), 0), [orders]);
  const pendingOrders = useMemo(() => orders.filter(o => o.status === 'Chờ xử lý' || o.status === 'Đang xử lý' || o.status === 'Chờ duyệt'), [orders]);
  const completedOrders = useMemo(() => orders.filter(o => o.status === 'Hoàn thành' || o.status === 'Đã chốt'), [orders]);
  const pendingComm = useMemo(() => pendingOrders.reduce((acc, o) => acc + (o.commission || 0), 0), [pendingOrders]);
  const completedComm = useMemo(() => completedOrders.reduce((acc, o) => acc + (o.commission || 0), 0), [completedOrders]);
  const withdrawableComm = walletStats?.withdrawable || user?.balance || 0;
  const receivedComm = walletStats?.received || 0;

  // Lọc đơn hàng
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
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
  }, [orders, platformFilter, sourceFilter, statusFilter, dateFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const displayedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getPlatformBadge = (p) => {
    const plat = (p || '').toUpperCase();
    if (plat === 'SHOPEE') return { label: 'Shopee', color: '#ea580c', bg: 'rgba(234, 88, 12, 0.12)' };
    if (plat === 'TIKTOK') return { label: 'TikTok Shop', color: '#000000', bg: 'rgba(0, 0, 0, 0.08)' };
    if (plat === 'LAZADA') return { label: 'Lazada', color: '#0284c7', bg: 'rgba(2, 132, 199, 0.12)' };
    if (plat === 'SHOPEE_FOOD') return { label: 'ShopeeFood', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.12)' };
    return { label: plat || 'Sàn TMĐT', color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)' };
  };

  return (
    <div className="orders-view-wrapper" style={{ width: '100%', maxWidth: '820px', margin: '0 auto' }}>
      
      {/* 1. GRID STAT CARDS (BÊ NGUYÊN XI TỪ ORDERLOOKUPVIEW) */}
      <div className="stats-container" style={{ width: '100%', marginBottom: '22px' }}>
        <h3 className="stats-section-title" style={{ fontSize: '17px', fontWeight: '650', marginBottom: '14px', color: 'var(--text-bright)' }}>
          💰 Thống Kê Đơn Hàng Của Bạn: <span style={{ color: 'var(--color-primary, #ea580c)' }}>{user?.fullName || user?.email}</span>
        </h3>

        <div className="stats-cards-grid">
          {/* Thẻ 0: Tổng tích lũy */}
          <div className="stat-card-item total" style={{ gridColumn: '1 / -1' }}>
            <span className="stat-card-label">🌟 TỔNG TÍCH LŨY (HOÀN THÀNH + CHỜ)</span>
            <span className="stat-card-sub">(Toàn bộ hoa hồng từ đơn Web & Bot Zalo của bạn)</span>
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
            <span className="stat-card-sub">(Đơn giao thành công và chốt hoa hồng)</span>
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

          {/* Thẻ 4: Đã rút thành công */}
          <div className="stat-card-item received">
            <span className="stat-card-label">🏦 ĐÃ RÚT THÀNH CÔNG</span>
            <span className="stat-card-sub">(Tổng tiền đã giải ngân về ngân hàng)</span>
            <span className="stat-card-value">
              {formatMoney(receivedComm)}
            </span>
          </div>
        </div>
      </div>



      {/* 3. BỘ LỌC SÀN, NGUỒN & TÌM KIẾM CHUẨN */}
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
                  fontWeight: sourceFilter === s.key ? '600' : '500',
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
                  fontWeight: dateFilter === d.key ? '600' : '500',
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
            placeholder="Lọc nhanh theo tên sản phẩm, mã đơn hàng, SubID..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>

      {/* 4. ORDERS LIST (CARD DẠNG ORDERLOOKUPVIEW) */}
      <div className="orders-container" style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h3 className="stats-section-title" style={{ fontSize: '16px', fontWeight: '650', margin: 0, color: 'var(--text-bright)' }}>
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
              gap: '6px'
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
          displayedOrders.map((o, idx) => {
            const isCompleted = o.status === 'Hoàn thành' || o.status === 'Đã chốt';
            const isPending = o.status === 'Chờ xử lý' || o.status === 'Đang xử lý' || o.status === 'Chờ duyệt';
            const statusColor = isCompleted ? '#059669' : (isPending ? '#ea580c' : '#dc2626');
            const platBadge = getPlatformBadge(o.platform);

            return (
              <div key={o.orderId || o.id || idx} className="order-card-item">
                <div className="order-card-header">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-regular fa-calendar" style={{ color: 'var(--text-muted)', fontSize: '13px' }}></i>
                    <span>{formatDateTime(o.purchaseTime || o.orderTime)}</span>
                    <span style={{
                      padding: '1px 7px',
                      borderRadius: '6px',
                      fontSize: '10.5px',
                      fontWeight: '600',
                      background: platBadge.bg,
                      color: platBadge.color,
                      marginLeft: '4px'
                    }}>
                      {platBadge.label}
                    </span>
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                    Mã đơn: <span className="order-id-badge" style={{ marginLeft: '4px' }}>{o.orderId}</span>
                    <CopyButton text={o.orderId} title="Copy mã đơn hàng" toastMessage={`Đã copy mã đơn: ${o.orderId}`} />
                  </span>
                </div>

                <div className="order-card-title" title={o.productName}>
                  {o.productName || 'Sản phẩm mua sắm qua link tiếp thị'}
                </div>

                <div className="order-card-commission-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{
                      color: statusColor,
                      fontSize: '12.5px',
                      fontWeight: '700'
                    }}>
                      {o.status || 'Chờ xử lý'}
                    </span>
                    {isCompleted && o.completeTime && (
                      <span className="order-complete-time-text" style={{
                        fontSize: '12px',
                        color: '#059669',
                        fontWeight: '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }} title="Thời điểm đơn hàng hoàn thành">
                        <i className="fa-regular fa-calendar-check" style={{ fontSize: '11px' }}></i>
                        <span>Hoàn thành: {formatDateTime(o.completeTime)}</span>
                      </span>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="order-commission-label">Hoa hồng: </span>
                    <span className="order-commission-val">{formatMoney(o.commission || 0)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="lookup-admin-link"
              style={{ padding: '6px 14px' }}
            >
              Trang trước
            </button>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-bright)' }}>
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="lookup-admin-link"
              style={{ padding: '6px 14px' }}
            >
              Trang sau
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
