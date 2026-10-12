import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney, formatDateTime } from '../../utils/formatters';

export default function OrdersView() {
  const { API_URL_ROOT, user, setView, showToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    completedCount: 0,
    pendingCount: 0,
    totalComm: 0,
    completedComm: 0,
    pendingComm: 0
  });

  const [platformFilter, setPlatformFilter] = useState('ALL'); // ALL, SHOPEE, TIKTOK, LAZADA
  const [sourceFilter, setSourceFilter] = useState('ALL'); // ALL, WEB, ZALO
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, COMPLETED, PENDING
  const [dateFilter, setDateFilter] = useState('ALL'); // ALL, TODAY, YESTERDAY, 7DAYS, THIS_MONTH
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const res = await fetch(`${API_URL_ROOT}/api/user/orders/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Lỗi tải danh sách đơn hàng');

      const data = resData.data || {};
      setOrders(data.orders || []);
      setStats(data.stats || {
        totalOrders: 0,
        completedCount: 0,
        pendingCount: 0,
        totalComm: 0,
        completedComm: 0,
        pendingComm: 0
      });
    } catch (err) {
      showToast(err.message || 'Không thể tải đơn hàng', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter logic
  const filteredOrders = orders.filter((o) => {
    // 1. Platform
    if (platformFilter !== 'ALL' && o.platform !== platformFilter) return false;

    // 2. Source
    if (sourceFilter !== 'ALL' && o.source !== sourceFilter) return false;

    // 3. Status
    if (statusFilter === 'COMPLETED' && o.status !== 'Hoàn thành') return false;
    if (statusFilter === 'PENDING' && (o.status === 'Hoàn thành' || o.status === 'Đã hủy' || o.status === 'Hủy')) return false;

    // 4. Date filter
    if (dateFilter !== 'ALL' && o.purchaseTime) {
      const pDate = new Date(o.purchaseTime);
      const now = new Date();
      if (dateFilter === 'TODAY') {
        if (pDate.toDateString() !== now.toDateString()) return false;
      } else if (dateFilter === 'YESTERDAY') {
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

    // 5. Search
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

  const getPlatformIcon = (plat) => {
    switch (plat?.toUpperCase()) {
      case 'SHOPEE':
        return <i className="fa-solid fa-bag-shopping" style={{ color: '#ea580c' }}></i>;
      case 'TIKTOK':
        return <i className="fa-brands fa-tiktok" style={{ color: '#0f172a' }}></i>;
      case 'LAZADA':
        return <i className="fa-solid fa-store" style={{ color: '#2563eb' }}></i>;
      default:
        return <i className="fa-solid fa-box" style={{ color: '#64748b' }}></i>;
    }
  };

  return (
    <div className="orders-view-container" style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px' }}>
      {/* 4 Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div style={{ background: 'var(--bg-card, #fff)', border: '1.5px solid var(--border-color, #e2e8f0)', borderRadius: '16px', padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Tổng Hoa Hồng Nhận
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--bg-main, #f8fafc)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c', fontSize: '13px' }}>
              <i className="fa-solid fa-coins"></i>
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: 'var(--text-bright, #0f172a)' }}>
            {formatMoney(stats.totalComm)}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted, #94a3b8)', marginTop: '4px' }}>
            Gồm đơn hoàn thành & chờ đối soát
          </div>
        </div>

        <div style={{ background: 'var(--bg-card, #fff)', border: '1.5px solid var(--border-color, #e2e8f0)', borderRadius: '16px', padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Đã Duyệt (Có thể rút)
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', fontSize: '13px' }}>
              <i className="fa-solid fa-circle-check"></i>
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#059669' }}>
            {formatMoney(stats.completedComm)}
          </div>
          <div style={{ fontSize: '11.5px', color: '#059669', fontWeight: '700', marginTop: '4px' }}>
            {stats.completedCount} đơn hoàn thành
          </div>
        </div>

        <div style={{ background: 'var(--bg-card, #fff)', border: '1.5px solid var(--border-color, #e2e8f0)', borderRadius: '16px', padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Chờ Đối Soát Sàn
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', fontSize: '13px' }}>
              <i className="fa-solid fa-hourglass-half"></i>
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#d97706' }}>
            {formatMoney(stats.pendingComm)}
          </div>
          <div style={{ fontSize: '11.5px', color: '#d97706', fontWeight: '700', marginTop: '4px' }}>
            {stats.pendingCount} đơn đang xử lý
          </div>
        </div>

        <div style={{ background: 'var(--bg-card, #fff)', border: '1.5px solid var(--border-color, #e2e8f0)', borderRadius: '16px', padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Tổng Số Đơn Hàng
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--bg-main, #f8fafc)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', fontSize: '13px' }}>
              <i className="fa-solid fa-boxes-stacked"></i>
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: 'var(--text-bright, #0f172a)' }}>
            {stats.totalOrders}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted, #94a3b8)', marginTop: '4px' }}>
            Tổng số đơn ghi nhận
          </div>
        </div>
      </div>

      {/* Banner Liên kết Zalo ID */}
      {!user?.zaloId ? (
        <div style={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%)',
          border: '1.5px solid #bfdbfe',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
              <i className="fa-solid fa-link"></i>
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#1e3a8a' }}>
                💡 Bạn đã từng đặt đơn qua Bot Zalo?
              </h4>
              <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: '#3b82f6' }}>
                Hãy liên kết Zalo ID vào tài khoản Web để xem toàn bộ lịch sử đơn hàng đặt từ trước tới nay của bạn!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setView('account')}
            style={{
              padding: '9px 18px',
              borderRadius: '10px',
              border: 'none',
              background: '#2563eb',
              color: '#fff',
              fontSize: '13px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)'
            }}
          >
            <i className="fa-solid fa-arrow-right"></i>
            <span>Liên Kết Zalo ID Ngay</span>
          </button>
        </div>
      ) : (
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '12px',
          padding: '10px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12.5px',
          color: '#166534',
          fontWeight: '700'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-circle-check" style={{ color: '#16a34a' }}></i>
            Đã liên kết Zalo ID: <code style={{ color: '#15803d', fontWeight: '800', background: '#dcfce7', padding: '2px 6px', borderRadius: '6px' }}>{user.zaloId}</code> — Đang hiển thị cả đơn từ Web và Zalo Bot.
          </span>
          <button
            type="button"
            onClick={() => setView('account')}
            style={{ background: 'none', border: 'none', color: '#15803d', textDecoration: 'underline', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}
          >
            Quản lý liên kết
          </button>
        </div>
      )}

      {/* Filter Toolbar Card */}
      <div style={{
        background: 'var(--bg-card, #fff)',
        border: '1.5px solid var(--border-color, #e2e8f0)',
        borderRadius: '16px',
        padding: '16px 20px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
      }}>
        {/* Row 1: Search & Date Presets */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8', fontSize: '13px' }}></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Tìm theo mã đơn hàng, tên sản phẩm..."
              style={{
                width: '100%',
                padding: '9px 12px 9px 34px',
                borderRadius: '10px',
                border: '1.5px solid var(--border-color, #cbd5e1)',
                background: 'var(--bg-main, #f8fafc)',
                color: 'var(--text-bright, #0f172a)',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'Tất cả ngày' },
              { id: 'TODAY', label: 'Hôm nay' },
              { id: 'YESTERDAY', label: 'Hôm qua' },
              { id: '7DAYS', label: '7 ngày qua' },
              { id: 'THIS_MONTH', label: 'Tháng này' }
            ].map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => { setDateFilter(d.id); setCurrentPage(1); }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: dateFilter === d.id ? '1px solid #ea580c' : '1px solid var(--border-color, #e2e8f0)',
                  background: dateFilter === d.id ? '#fff7ed' : 'var(--bg-main, #f8fafc)',
                  color: dateFilter === d.id ? '#ea580c' : 'var(--text-muted, #64748b)',
                  fontSize: '12px',
                  fontWeight: dateFilter === d.id ? '800' : '600',
                  cursor: 'pointer'
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Platform + Source + Status pills */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid var(--border-color, #f1f5f9)', paddingTop: '12px' }}>
          {/* Platform filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted, #64748b)', marginRight: '4px' }}>Sàn:</span>
            {['ALL', 'SHOPEE', 'TIKTOK', 'LAZADA'].map((plat) => (
              <button
                key={plat}
                type="button"
                onClick={() => { setPlatformFilter(plat); setCurrentPage(1); }}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  border: platformFilter === plat ? '1.5px solid #ea580c' : '1px solid var(--border-color, #e2e8f0)',
                  background: platformFilter === plat ? '#ea580c' : 'var(--bg-main, #f8fafc)',
                  color: platformFilter === plat ? '#fff' : 'var(--text-bright, #0f172a)',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {plat === 'ALL' ? 'Tất cả sàn' : plat}
              </button>
            ))}
          </div>

          {/* Source filter: Web vs Zalo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted, #64748b)', marginRight: '4px' }}>Nguồn:</span>
            <button
              type="button"
              onClick={() => { setSourceFilter('ALL'); setCurrentPage(1); }}
              style={{
                padding: '5px 10px',
                borderRadius: '8px',
                border: sourceFilter === 'ALL' ? '1.5px solid #475569' : '1px solid var(--border-color, #e2e8f0)',
                background: sourceFilter === 'ALL' ? '#f1f5f9' : 'transparent',
                color: '#0f172a',
                fontSize: '11.5px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => { setSourceFilter('WEB'); setCurrentPage(1); }}
              style={{
                padding: '5px 10px',
                borderRadius: '8px',
                border: sourceFilter === 'WEB' ? '1.5px solid #7c3aed' : '1px solid var(--border-color, #e2e8f0)',
                background: sourceFilter === 'WEB' ? '#f5f3ff' : 'transparent',
                color: '#7c3aed',
                fontSize: '11.5px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              🌐 Đơn Web
            </button>
            <button
              type="button"
              onClick={() => { setSourceFilter('ZALO'); setCurrentPage(1); }}
              style={{
                padding: '5px 10px',
                borderRadius: '8px',
                border: sourceFilter === 'ZALO' ? '1.5px solid #2563eb' : '1px solid var(--border-color, #e2e8f0)',
                background: sourceFilter === 'ZALO' ? '#eff6ff' : 'transparent',
                color: '#2563eb',
                fontSize: '11.5px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              💬 Đơn Zalo
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div style={{
        background: 'var(--bg-card, #fff)',
        border: '1.5px solid var(--border-color, #e2e8f0)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
      }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '24px', marginBottom: '10px' }}></i>
            <div style={{ fontSize: '13.5px', fontWeight: '700' }}>Đang tải danh sách đơn hàng...</div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--bg-main, #f1f5f9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', margin: '0 auto 12px auto' }}>
              <i className="fa-solid fa-inbox"></i>
            </div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: '800', color: 'var(--text-bright, #0f172a)' }}>
              Không tìm thấy đơn hàng nào
            </h4>
            <p style={{ margin: 0, fontSize: '13px' }}>
              Chưa có đơn hàng nào khớp với điều kiện lọc. Hãy tạo link tiếp thị ở mục Chuyển Đổi để bắt đầu mua hàng!
            </p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-main, #f8fafc)', borderBottom: '1.5px solid var(--border-color, #e2e8f0)' }}>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>Nguồn</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>Sàn</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>Mã đơn hàng</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>Sản phẩm</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>Thời gian</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', textAlign: 'right' }}>Hoa hồng nhận</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', textAlign: 'center' }}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedOrders.map((o, idx) => {
                    const isWeb = o.source === 'WEB';
                    return (
                      <tr
                        key={o.id || idx}
                        style={{
                          borderBottom: '1px solid var(--border-color, #f1f5f9)',
                          transition: 'background 0.15s'
                        }}
                      >
                        {/* Cột Nguồn: Web vs Zalo */}
                        <td style={{ padding: '14px 16px' }}>
                          {isWeb ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: '#ede9fe',
                              color: '#7c3aed',
                              fontSize: '10.5px',
                              fontWeight: '800',
                              border: '1px solid #ddd6fe'
                            }} title="Đơn mua qua link Web">
                              <i className="fa-solid fa-globe" style={{ fontSize: '9px' }}></i> Web
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: '#dbeafe',
                              color: '#2563eb',
                              fontSize: '10.5px',
                              fontWeight: '800',
                              border: '1px solid #bfdbfe'
                            }} title="Đơn mua qua Bot Zalo">
                              <i className="fa-solid fa-comments" style={{ fontSize: '9px' }}></i> Zalo
                            </span>
                          )}
                        </td>

                        {/* Cột Sàn */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'var(--bg-main, #f1f5f9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                              {getPlatformIcon(o.platform)}
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-bright, #0f172a)' }}>
                              {o.platform}
                            </span>
                          </div>
                        </td>

                        {/* Mã đơn */}
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '12.5px', fontWeight: '800', color: 'var(--text-bright, #0f172a)' }}>
                            {o.orderId}
                          </span>
                        </td>

                        {/* Tên sản phẩm */}
                        <td style={{ padding: '14px 16px', maxWidth: '260px' }}>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-bright, #0f172a)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={o.productName}>
                            {o.productName || 'Sản phẩm tiếp thị'}
                          </div>
                        </td>

                        {/* Thời gian */}
                        <td style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--text-muted, #64748b)', whiteSpace: 'nowrap' }}>
                          {formatDateTime(o.purchaseTime)}
                        </td>

                        {/* Hoa hồng */}
                        <td style={{ padding: '14px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: '14px', fontWeight: '900', color: '#ea580c' }}>
                            {formatMoney(o.commission)}
                          </span>
                        </td>

                        {/* Trạng thái */}
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '800',
                            background: o.status === 'Hoàn thành' ? '#ecfdf5' : (o.status === 'Đã hủy' || o.status === 'Hủy') ? '#fef2f2' : '#fffbeb',
                            color: o.status === 'Hoàn thành' ? '#059669' : (o.status === 'Đã hủy' || o.status === 'Hủy') ? '#e11d48' : '#d97706',
                            border: `1px solid ${o.status === 'Hoàn thành' ? '#a7f3d0' : (o.status === 'Đã hủy' || o.status === 'Hủy') ? '#fecdd3' : '#fde68a'}`
                          }}>
                            {o.status || 'Chờ xử lý'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid var(--border-color, #e2e8f0)', background: 'var(--bg-main, #f8fafc)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', fontWeight: '600' }}>
                  Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredOrders.length)} / {filteredOrders.length} đơn
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color, #cbd5e1)',
                      background: '#fff',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      color: currentPage === 1 ? '#94a3b8' : '#0f172a'
                    }}
                  >
                    Trang trước
                  </button>

                  <span style={{ fontSize: '12px', fontWeight: '800', padding: '0 8px' }}>
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color, #cbd5e1)',
                      background: '#fff',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      color: currentPage === totalPages ? '#94a3b8' : '#0f172a'
                    }}
                  >
                    Trang sau
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
