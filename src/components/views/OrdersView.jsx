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
      <style dangerouslySetInnerHTML={{ __html: `
        .orders-container { width: 100%; max-width: 820px; }
        .order-card-item {
          background: var(--bg-card) !important;
          border: 1px solid var(--border-color) !important;
          border-radius: 16px !important;
          padding: 18px 20px !important;
          margin-bottom: 14px !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.04) !important;
          transition: all 0.2s ease !important;
        }
        .order-card-item:hover {
          border-color: rgba(234, 88, 12, 0.4) !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important;
        }
        .order-card-header {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          margin-bottom: 10px !important;
          font-size: 13px !important;
          color: var(--text-muted) !important;
          font-weight: 500 !important;
        }
        .order-id-badge {
          font-family: monospace !important;
          font-weight: 700 !important;
          color: #ea580c !important;
          font-size: 13px !important;
        }
        .order-card-title {
          font-size: 14.5px !important;
          font-weight: 650 !important;
          color: var(--text-bright) !important;
          margin-bottom: 12px !important;
          line-height: 1.5 !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          display: -webkit-box !important;
          -webkit-line-clamp: 2 !important;
          -webkit-box-orient: vertical !important;
        }
        .order-card-commission-row {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          border-top: 1px dashed var(--border-color) !important;
          padding-top: 12px !important;
        }
        .order-commission-label {
          font-size: 13px !important;
          color: var(--text-muted) !important;
          font-weight: 500 !important;
        }
        .order-commission-val {
          font-family: var(--font-heading) !important;
          font-size: 17px !important;
          font-weight: 800 !important;
          color: #047857 !important;
        }
        html[data-theme="dark"] .order-commission-val,
        body.dark .order-commission-val {
          color: #34d399 !important;
        }
        @media (max-width: 640px) {
          .order-card-item { padding: 14px 16px !important; border-radius: 14px !important; }
          .order-card-title { font-size: 13.5px !important; }
        }
      `}} />
      
      {/* BỘ LỌC DẠNG ẤN VÀO CHỌN (GỌN GÀNG, TIỆN LỢI TRÊN ĐIỆN THOẠI) & TÌM KIẾM */}
      <div className="lookup-card" style={{ padding: '16px', marginBottom: '20px' }}>
        {/* Row 1: 3 Dropdown Bộ Lọc: Sàn, Nguồn, Thời Gian */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '10px',
          marginBottom: '12px'
        }}>
          {/* 1. Sàn Mua Sắm */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <i
              className="fa-solid fa-store"
              style={{
                position: 'absolute',
                left: '12px',
                color: 'var(--text-muted)',
                fontSize: '13px',
                pointerEvents: 'none'
              }}
            ></i>
            <select
              value={platformFilter}
              onChange={e => { setPlatformFilter(e.target.value); setCurrentPage(1); }}
              style={{
                width: '100%',
                padding: '9px 28px 9px 34px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-main)',
                color: 'var(--text-bright)',
                fontSize: '13px',
                fontWeight: '500',
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none',
                WebkitAppearance: 'none'
              }}
            >
              <option value="ALL">Sàn: Tất cả ({orders.length})</option>
              <option value="Shopee">Sàn: Shopee</option>
              <option value="TikTok">Sàn: TikTok Shop</option>
              <option value="Lazada">Sàn: Lazada</option>
              <option value="ShopeeFood">Sàn: ShopeeFood</option>
            </select>
            <i
              className="fa-solid fa-chevron-down"
              style={{
                position: 'absolute',
                right: '12px',
                color: 'var(--text-muted)',
                fontSize: '11px',
                pointerEvents: 'none'
              }}
            ></i>
          </div>

          {/* 2. Nguồn Đơn */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <i
              className="fa-solid fa-globe"
              style={{
                position: 'absolute',
                left: '12px',
                color: 'var(--text-muted)',
                fontSize: '13px',
                pointerEvents: 'none'
              }}
            ></i>
            <select
              value={sourceFilter}
              onChange={e => { setSourceFilter(e.target.value); setCurrentPage(1); }}
              style={{
                width: '100%',
                padding: '9px 28px 9px 34px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-main)',
                color: 'var(--text-bright)',
                fontSize: '13px',
                fontWeight: '500',
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none',
                WebkitAppearance: 'none'
              }}
            >
              <option value="ALL">Nguồn: Tất cả</option>
              <option value="WEB">Nguồn: Đơn Web</option>
              <option value="ZALO">Nguồn: Đơn Zalo</option>
            </select>
            <i
              className="fa-solid fa-chevron-down"
              style={{
                position: 'absolute',
                right: '12px',
                color: 'var(--text-muted)',
                fontSize: '11px',
                pointerEvents: 'none'
              }}
            ></i>
          </div>

          {/* 3. Khoảng Thời Gian */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <i
              className="fa-solid fa-calendar-days"
              style={{
                position: 'absolute',
                left: '12px',
                color: 'var(--text-muted)',
                fontSize: '13px',
                pointerEvents: 'none'
              }}
            ></i>
            <select
              value={dateFilter}
              onChange={e => { setDateFilter(e.target.value); setCurrentPage(1); }}
              style={{
                width: '100%',
                padding: '9px 28px 9px 34px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-main)',
                color: 'var(--text-bright)',
                fontSize: '13px',
                fontWeight: '500',
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none',
                WebkitAppearance: 'none'
              }}
            >
              <option value="ALL">Thời gian: Tất cả</option>
              <option value="TODAY">Thời gian: Hôm nay</option>
              <option value="YESTERDAY">Thời gian: Hôm qua</option>
              <option value="7DAYS">Thời gian: 7 ngày qua</option>
              <option value="THIS_MONTH">Thời gian: Tháng này</option>
            </select>
            <i
              className="fa-solid fa-chevron-down"
              style={{
                position: 'absolute',
                right: '12px',
                color: 'var(--text-muted)',
                fontSize: '11px',
                pointerEvents: 'none'
              }}
            ></i>
          </div>
        </div>

        {/* Row 2: Ô tìm kiếm từ khóa với icon màu xám */}
        <div style={{ position: 'relative', width: '100%' }}>
          <i
            className="fa-solid fa-magnifying-glass"
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              fontSize: '13px'
            }}
          ></i>
          <input
            type="text"
            className="lookup-input"
            style={{ width: '100%', padding: '9px 12px 9px 34px', fontSize: '13px', borderRadius: '10px', margin: 0, fontWeight: '400' }}
            placeholder="Tìm theo tên sản phẩm, mã đơn, SubID..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>

      {/* 2. ORDERS LIST (CARD DẠNG ORDERLOOKUPVIEW) */}
      <div className="orders-container" style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h3 className="stats-section-title" style={{ fontSize: '16px', fontWeight: '650', margin: 0, color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-boxes-stacked" style={{ color: 'var(--text-muted)', fontSize: '15px' }}></i>
            <span>Danh Sách Đơn Hàng ({filteredOrders.length})</span>
          </h3>
          <button
            type="button"
            onClick={fetchOrders}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '12.5px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-primary, #ea580c)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <i className="fa-solid fa-rotate-right" style={{ color: 'var(--text-muted)' }}></i>
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
