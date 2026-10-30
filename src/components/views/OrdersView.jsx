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
    if (plat === 'SHOPEE') return { label: 'Shopee', color: '#ea580c', bg: 'rgba(234, 88, 12, 0.12)', border: '1px solid rgba(234, 88, 12, 0.25)', icon: 'fa-solid fa-bag-shopping' };
    if (plat === 'TIKTOK' || plat.includes('TIKTOK')) return { label: 'TikTok', color: '#0f172a', bg: 'rgba(15, 23, 42, 0.08)', className: 'platform-badge-tiktok', icon: 'fa-brands fa-tiktok' };
    if (plat === 'LAZADA') return { label: 'Lazada', color: '#0284c7', bg: 'rgba(2, 132, 199, 0.12)', border: '1px solid rgba(2, 132, 199, 0.25)', icon: 'fa-solid fa-bag-shopping' };
    if (plat === 'SHOPEE_FOOD') return { label: 'ShopeeFood', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.12)', border: '1px solid rgba(220, 38, 38, 0.25)', icon: 'fa-solid fa-utensils' };
    return { label: plat || 'Shopee', color: '#ea580c', bg: 'rgba(234, 88, 12, 0.12)', border: '1px solid rgba(234, 88, 12, 0.25)', icon: 'fa-solid fa-bag-shopping' };
  };

  const parseDateInfo = (o) => {
    const s = (o.status || '').toLowerCase();
    const isCompleted =
      s.includes('hoàn thành') ||
      s.includes('thành công') ||
      s.includes('completed') ||
      s.includes('success') ||
      s.includes('đã chốt') ||
      s.includes('đã hoàn');

    const isCancelled =
      s.includes('hủy') ||
      s.includes('cancel') ||
      s.includes('refund') ||
      s.includes('từ chối');

    // 1. Phân tích ngày đặt hàng (orderDate / purchaseTime)
    let orderDateObj = null;
    const orderRaw = o.purchaseTime || o.orderTime || o.orderDate || o.createdAt;
    if (orderRaw) {
      const parsed = new Date(orderRaw);
      if (!isNaN(parsed.getTime())) orderDateObj = parsed;
    }
    if (!orderDateObj && o.orderId && /^\d{6}/.test(o.orderId)) {
      const yr = 2000 + parseInt(o.orderId.substring(0, 2), 10);
      const mo = parseInt(o.orderId.substring(2, 4), 10) - 1;
      const da = parseInt(o.orderId.substring(4, 6), 10);
      const testD = new Date(yr, mo, da);
      if (!isNaN(testD.getTime())) orderDateObj = testD;
    }
    if (!orderDateObj) orderDateObj = new Date();

    const orderDay = String(orderDateObj.getDate()).padStart(2, '0');
    const orderMonthNum = orderDateObj.getMonth() + 1;
    const orderMonthStr = String(orderMonthNum).padStart(2, '0');

    // 2. Nếu đơn ĐÃ HOÀN THÀNH: ô lịch ở trước là ngày đặt, sau chữ 'Ngày hoàn thành' là ngày hoàn thành
    if (isCompleted) {
      let completeDateObj = null;
      const completeRaw =
        o.completeTime ||
        o.completedDate ||
        o.completedAt ||
        o.finishTime ||
        o.updateTime;

      if (completeRaw) {
        const parsed = new Date(completeRaw);
        if (!isNaN(parsed.getTime())) completeDateObj = parsed;
      }

      // Nếu trong data thiếu completeTime hoặc completeTime bị trùng đúng ngày đặt:
      // Tự động tính ngày hoàn thành = ngày đặt + 3 ngày (thực tế vận chuyển & hoàn tất)
      if (!completeDateObj || completeDateObj.toDateString() === orderDateObj.toDateString()) {
        const derived = new Date(orderDateObj.getTime() + 3 * 24 * 60 * 60 * 1000);
        const now = new Date();
        completeDateObj = derived > now ? now : derived;
      }

      const compDay = String(completeDateObj.getDate()).padStart(2, '0');
      const compMonthStr = String(completeDateObj.getMonth() + 1).padStart(2, '0');

      return {
        day: orderDay, // Ô lịch ở trước là NGÀY ĐẶT
        month: `TH${orderMonthNum}`,
        labelText: `Ngày hoàn thành ${compDay}/${compMonthStr}`, // Phía sau là NGÀY HOÀN THÀNH
        isCompleted: true
      };
    }

    // 3. Nếu đơn ĐÃ HỦY:
    if (isCancelled) {
      let cancelDateObj = null;
      const cancelRaw = o.cancelTime || o.updateTime || o.createdAt;
      if (cancelRaw) {
        const parsed = new Date(cancelRaw);
        if (!isNaN(parsed.getTime())) cancelDateObj = parsed;
      }
      if (!cancelDateObj) cancelDateObj = orderDateObj;

      const cancelDay = String(cancelDateObj.getDate()).padStart(2, '0');
      const cancelMonthStr = String(cancelDateObj.getMonth() + 1).padStart(2, '0');

      return {
        day: orderDay, // Ô lịch ở trước là NGÀY ĐẶT
        month: `TH${orderMonthNum}`,
        labelText: `Đã hủy ${cancelDay}/${cancelMonthStr}`,
        isCancelled: true
      };
    }

    // 4. Nếu đơn ĐANG XỬ LÝ (Chưa hoàn thành -> ô lịch phía trước là ngày đặt, text là Ghi nhận ngày đặt)
    return {
      day: orderDay,
      month: `TH${orderMonthNum}`,
      labelText: `Ghi nhận ${orderDay}/${orderMonthStr}`,
      isPending: true
    };
  };

  const getShortOrderDate = (o) => {
    let raw = o.purchaseTime || o.orderTime || o.orderDate || o.createdAt;
    let d = null;
    if (raw) {
      const parsed = new Date(raw);
      if (!isNaN(parsed.getTime())) d = parsed;
    }
    if (!d && o.orderId && /^\d{6}/.test(o.orderId)) {
      const yr = 2000 + parseInt(o.orderId.substring(0, 2), 10);
      const mo = parseInt(o.orderId.substring(2, 4), 10) - 1;
      const da = parseInt(o.orderId.substring(4, 6), 10);
      const testD = new Date(yr, mo, da);
      if (!isNaN(testD.getTime())) d = testD;
    }
    if (!d) return '';
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  return (
    <div className="orders-view-wrapper" style={{ width: '100%', maxWidth: '820px', margin: '0 auto' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .orders-container { width: 100%; max-width: 920px; }
        .orders-grid-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 16px;
          width: 100%;
        }
        @media (max-width: 768px) {
          .orders-grid-list {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }
        .order-card-modern {
          background: var(--bg-card, #ffffff);
          border: 1px solid var(--border-color, rgba(0,0,0,0.07));
          border-radius: 20px;
          padding: 0;
          overflow: hidden;
          box-shadow: 0 4px 16px -2px rgba(0,0,0,0.04);
          transition: all 0.25s ease;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .order-card-modern:hover {
          border-color: var(--border-color, rgba(0,0,0,0.07));
          box-shadow: 0 8px 24px -4px rgba(234, 88, 12, 0.12);
          transform: translateY(-2px);
        }
        .order-card-strip-pending { background: #FFFDF7 !important; }
        .order-card-strip-success { background: #F6FAF7 !important; }
        .order-card-strip-cancelled { background: #F8FAFC !important; }
        html[data-theme="dark"] .order-card-strip-pending,
        html.dark .order-card-strip-pending,
        body.dark .order-card-strip-pending { background: rgba(245, 158, 11, 0.08) !important; }
        html[data-theme="dark"] .order-card-strip-success,
        html.dark .order-card-strip-success,
        body.dark .order-card-strip-success { background: rgba(34, 197, 94, 0.08) !important; }
        html[data-theme="dark"] .order-card-strip-cancelled,
        html.dark .order-card-strip-cancelled,
        body.dark .order-card-strip-cancelled { background: rgba(148, 163, 184, 0.08) !important; }
        html[data-theme="dark"] .order-card-modern,
        html.dark .order-card-modern,
        body.dark .order-card-modern {
          background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%) !important;
          border-color: rgba(255, 255, 255, 0.12) !important;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4) !important;
        }
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
          margin: 0 !important;
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
        .platform-badge-tiktok {
          color: #0f172a !important;
          background: rgba(15, 23, 42, 0.08) !important;
          border: 1px solid rgba(15, 23, 42, 0.15) !important;
        }
        html[data-theme="dark"] .platform-badge-tiktok,
        html.dark .platform-badge-tiktok,
        body.dark .platform-badge-tiktok {
          color: #ffffff !important;
          background: rgba(255, 255, 255, 0.16) !important;
          border: 1px solid rgba(255, 255, 255, 0.28) !important;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25) !important;
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
              <option value="TikTok">Sàn: TikTok</option>
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
          <div className="orders-grid-list">
            {displayedOrders.map((o, idx) => {
              const s = (o.status || '').toLowerCase();
              const isCompleted =
                s.includes('hoàn thành') ||
                s.includes('thành công') ||
                s.includes('completed') ||
                s.includes('success') ||
                s.includes('đã chốt') ||
                s.includes('đã hoàn');
              const isCancelled =
                s.includes('hủy') ||
                s.includes('cancel') ||
                s.includes('refund') ||
                s.includes('từ chối');
              const platBadge = getPlatformBadge(o.platform);
              const dateInfo = parseDateInfo(o);
              const shortOrderDate = getShortOrderDate(o);
              const commissionVal = Math.round(Number(o.commission || o.finalCommission || o.userFinalCommission || 0));

              // Trạng thái chỉ hiển thị chữ (bỏ khối màu nền xung quanh)
              let stBadge = {
                text: 'Đang xử lý',
                color: '#ea580c'
              };

              if (isCompleted) {
                stBadge = {
                  text: 'Đã hoàn thành',
                  color: '#16a34a'
                };
              } else if (isCancelled) {
                stBadge = {
                  text: 'Đã hủy',
                  color: '#dc2626'
                };
              }

              return (
                <div key={o.orderId || o.id || idx} className="order-card-modern">
                  {/* HÀNG 1 (HEADER): NỀN TẢNG + MÃ ĐƠN HÀNG ĐẦY ĐỦ + NÚT COPY & TRẠNG THÁI */}
                  <div
                    style={{
                      padding: '14px 18px 10px 18px',
                      borderBottom: '1px solid var(--border-color, rgba(0,0,0,0.04))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      flexWrap: 'wrap'
                    }}
                  >
                    {/* BÊN TRÁI: Icon sàn + Tên sàn + Mã đơn đầy đủ + Nút Copy */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap', minWidth: 0 }}>
                      <i className={platBadge.icon || 'fa-solid fa-bag-shopping'} style={{ color: platBadge.color || '#ea580c', fontSize: '15px' }}></i>
                      <span style={{ fontWeight: '800', fontSize: '13.5px', color: 'var(--text-bright, #0f172a)' }}>
                        {platBadge.label || 'Shopee'}
                      </span>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: '700',
                          fontFamily: 'monospace, sans-serif',
                          color: '#64748b',
                          letterSpacing: '0.2px'
                        }}
                        title={o.orderId}
                      >
                        {o.orderId}
                      </span>
                      <CopyButton text={o.orderId} title="Copy mã đơn hàng" toastMessage={`Đã copy mã đơn: ${o.orderId}`} />
                    </div>

                    {/* BÊN PHẢI: Trạng thái chỉ hiện chữ */}
                    <span
                      style={{
                        fontSize: '11.5px',
                        fontWeight: '700',
                        color: stBadge.color,
                        flexShrink: 0
                      }}
                    >
                      {stBadge.text}
                    </span>
                  </div>

                  {/* HÀNG 2 (BODY): ẢNH + TÊN SẢN PHẨM */}
                  <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
                    {o.imageUrl ? (
                      <img
                        src={o.imageUrl}
                        alt={o.productName || 'Ảnh sản phẩm'}
                        referrerPolicy="no-referrer"
                        style={{
                          width: '54px',
                          height: '54px',
                          objectFit: 'cover',
                          borderRadius: '12px',
                          border: '1px solid var(--border-color, rgba(0,0,0,0.06))',
                          flexShrink: 0,
                          background: 'var(--bg-main, #f8fafc)',
                          cursor: 'pointer'
                        }}
                        title="Bấm để xem ảnh gốc"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(o.imageUrl, '_blank', 'noopener,noreferrer');
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.nextElementSibling) {
                            e.currentTarget.nextElementSibling.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div
                      style={{
                        width: '54px',
                        height: '54px',
                        borderRadius: '12px',
                        background: 'var(--bg-main, #f8fafc)',
                        border: '1px solid var(--border-color, rgba(0,0,0,0.06))',
                        display: o.imageUrl ? 'none' : 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted, #94a3b8)',
                        fontSize: '20px',
                        flexShrink: 0
                      }}
                    >
                      <i className={platBadge.icon || 'fa-solid fa-bag-shopping'} style={{ opacity: 0.65 }}></i>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        className="order-card-title"
                        title={o.productName}
                        style={{
                          fontSize: '13px',
                          fontWeight: '700',
                          color: 'var(--text-bright, #0f172a)',
                          lineHeight: '1.4',
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {o.productName || 'Sản phẩm mua sắm qua link tiếp thị'}
                      </div>
                    </div>
                  </div>

                  {/* HÀNG 3 (FOOTER): DẢI CHÂN THẺ CÓ MÀU VÀNG NHẠT (ĐANG XỬ LÝ) / XÁM XANH NHẠT (ĐÃ HOÀN THÀNH) */}
                  <div
                    className={`order-card-strip ${isCompleted ? 'order-card-strip-success' : isCancelled ? 'order-card-strip-cancelled' : 'order-card-strip-pending'}`}
                    style={{
                      padding: '10px 18px 12px 18px',
                      borderTop: '1px solid var(--border-color, rgba(0,0,0,0.05))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px'
                    }}
                  >
                    {/* BÊN TRÁI: Ô LỊCH THỜI GIAN & TEXT GHI NHẬN / NGÀY HOÀN THÀNH */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          border: `1.5px solid ${isCompleted ? '#bbf7d0' : isCancelled ? '#fecaca' : '#fed7aa'}`,
                          background: '#ffffff',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: '1',
                          flexShrink: 0,
                          boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                        }}
                      >
                        <span style={{ fontSize: '13px', fontWeight: '900', color: isCompleted ? '#16a34a' : isCancelled ? '#dc2626' : '#ea580c' }}>
                          {dateInfo.day}
                        </span>
                        <span style={{ fontSize: '8px', fontWeight: '800', textTransform: 'uppercase', color: isCompleted ? '#16a34a' : isCancelled ? '#dc2626' : '#ea580c', marginTop: '1px' }}>
                          {dateInfo.month}
                        </span>
                      </div>

                      <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-bright, #334155)' }}>
                        {dateInfo.labelText}
                      </span>
                    </div>

                    {/* BÊN PHẢI: LABEL HOA HỒNG (NHƯ CŨ) & SỐ TIỀN HOA HỒNG TO NỔI BẬT */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.4px', marginBottom: '1px' }}>
                        Hoa hồng
                      </div>
                      <div
                        style={{
                          fontSize: '15.5px',
                          fontWeight: '900',
                          fontFamily: 'monospace, sans-serif',
                          color: isCompleted ? '#059669' : isCancelled ? '#94a3b8' : '#ea580c',
                          letterSpacing: '-0.2px'
                        }}
                      >
                        {commissionVal > 0 ? `+${formatMoney(commissionVal)}` : '0đ'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
