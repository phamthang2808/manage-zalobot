import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDateTime, formatMoney } from '../../utils/formatters';

// Helper to reliably parse any date into YYYY-MM-DD
const parseDateToYMD = (val) => {
  if (!val) return '';
  if (typeof val === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(val)) {
      return val.substring(0, 10);
    }
    const match = val.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (match) {
      const day = match[1].padStart(2, '0');
      const month = match[2].padStart(2, '0');
      const year = match[3];
      return `${year}-${month}-${day}`;
    }
  }
  if (Array.isArray(val) && val.length >= 3) {
    const year = val[0];
    const month = String(val[1]).padStart(2, '0');
    const day = String(val[2]).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch (e) {}
  return '';
};

export default function OrdersTab() {
  const { orders, users, token, user, fetchData, showToast, API_URL_ROOT } = useApp();
  const [orderSearch, setOrderSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('Shopee');
  const [syncLoading, setSyncLoading] = useState(false);
  const [activeDatePreset, setActiveDatePreset] = useState('ALL');

  useEffect(() => {
    if (token && user) {
      fetchData(token, user);
    }
  }, [token, user]);

  const getPlatformName = (o) => {
    if (!o) return 'Shopee';
    const p = (o.platform || '').trim().toLowerCase();
    if (p.includes('tiktok')) return 'TikTok Shop';
    if (p.includes('shopeefood') || (o.orderId && o.orderId.startsWith('SPF'))) return 'ShopeeFood';
    return 'Shopee';
  };

  // Real backend orders
  const combinedOrders = orders || [];

  // Dynamic presets based on platform (Shopee removes "Hôm nay", others show "Hôm nay" then "Hôm qua")
  const datePresets = platformFilter === 'Shopee' ? [
    { key: 'ALL', label: 'Tất cả ngày' },
    { key: 'YESTERDAY', label: 'Hôm qua' },
    { key: 'LAST_7_DAYS', label: '7 ngày qua' },
    { key: 'THIS_MONTH', label: 'Tháng này' }
  ] : [
    { key: 'ALL', label: 'Tất cả ngày' },
    { key: 'TODAY', label: 'Hôm nay' },
    { key: 'YESTERDAY', label: 'Hôm qua' },
    { key: 'LAST_7_DAYS', label: '7 ngày qua' },
    { key: 'THIS_MONTH', label: 'Tháng này' }
  ];

  const filteredOrders = combinedOrders.filter(o => {
    // 1. Platform filter
    const itemPlatform = getPlatformName(o);
    if (itemPlatform !== platformFilter) return false;

    // 2. Keyword Search
    const q = orderSearch.trim().toLowerCase();
    if (q) {
      const matchKeyword =
        o.orderId?.toLowerCase().includes(q) ||
        o.zaloId?.toLowerCase().includes(q) ||
        o.subId?.toLowerCase().includes(q) ||
        o.productName?.toLowerCase().includes(q);
      if (!matchKeyword) return false;
    }

    // 3. Quick Date Preset Filter
    if (activeDatePreset !== 'ALL') {
      const rawDate = o.purchaseTime || o.orderDate || o.createdTime || o.completeTime;
      const orderDateStr = parseDateToYMD(rawDate);
      if (orderDateStr) {
        const today = new Date();
        const formatDate = (d) => {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };
        const todayStr = formatDate(today);

        if (activeDatePreset === 'TODAY') {
          if (orderDateStr !== todayStr) return false;
        } else if (activeDatePreset === 'YESTERDAY') {
          const yesterday = new Date();
          yesterday.setDate(today.getDate() - 1);
          if (orderDateStr !== formatDate(yesterday)) return false;
        } else if (activeDatePreset === 'LAST_7_DAYS') {
          const past = new Date();
          past.setDate(today.getDate() - 7);
          const pastStr = formatDate(past);
          if (orderDateStr < pastStr || orderDateStr > todayStr) return false;
        } else if (activeDatePreset === 'THIS_MONTH') {
          const firstDayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
          if (orderDateStr < firstDayStr || orderDateStr > todayStr) return false;
        }
      }
    }

    return true;
  });

  const handleSyncTiktok = async () => {
    setSyncLoading(true);
    try {
      const res = await fetch(`${API_URL_ROOT}/api/v1/riohub/sync`, {
        method: 'POST',
        credentials: 'include'
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text);
      showToast('Đồng bộ đơn TikTok Shop thành công: ' + text, 'success');
      fetchData(token, user);
    } catch (err) {
      showToast('Đồng bộ TikTok Shop (Mẫu thử nghiệm): ' + err.message, 'info');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleSelectPlatform = (key) => {
    setPlatformFilter(key);
    setActiveDatePreset('ALL'); // Reset date filter to "Tất cả ngày" when switching platforms!
  };

  return (
    <div className="data-card" style={{ padding: '20px' }}>
      {/* Top Bar: Platform Switcher Tabs + Sync Action */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        borderBottom: '2px solid var(--border-color, rgba(0,0,0,0.06))',
        paddingBottom: '14px',
        marginBottom: '18px'
      }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          maxWidth: '100%',
          paddingBottom: '4px',
          WebkitOverflowScrolling: 'touch'
        }}>
          {[
            { key: 'Shopee', iconClass: 'fa-solid fa-bag-shopping', label: 'Shopee', count: combinedOrders.filter(o => getPlatformName(o) === 'Shopee').length },
            { key: 'TikTok Shop', iconClass: 'fa-brands fa-tiktok', label: 'TikTok Shop', count: combinedOrders.filter(o => getPlatformName(o) === 'TikTok Shop').length },
            { key: 'ShopeeFood', iconClass: 'fa-solid fa-utensils', label: 'ShopeeFood', count: combinedOrders.filter(o => getPlatformName(o) === 'ShopeeFood').length }
          ].map(tab => {
            const isActive = platformFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleSelectPlatform(tab.key)}
                style={{
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  fontSize: '13.5px',
                  fontWeight: isActive ? '700' : '600',
                  background: isActive
                    ? (tab.key === 'TikTok Shop' ? '#000000' : tab.key === 'ShopeeFood' ? '#d0011b' : '#ee4d2d')
                    : 'var(--bg-secondary, rgba(0,0,0,0.04))',
                  color: isActive ? '#ffffff' : 'var(--text-muted, #64748b)',
                  boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <i className={tab.iconClass} style={{ fontSize: '14px' }}></i>
                <span>{tab.label}</span>
                <span style={{
                  fontSize: '11px',
                  padding: '2px 7px',
                  borderRadius: '12px',
                  background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)',
                  color: isActive ? '#ffffff' : 'var(--text-main, #334155)'
                }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        {platformFilter === 'TikTok Shop' && (
          <button
            className="btn btn-refresh"
            onClick={handleSyncTiktok}
            disabled={syncLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: 'var(--color-primary-light, rgba(249, 115, 22, 0.1))',
              color: 'var(--color-primary, #ea580c)',
              border: '1px solid var(--color-primary-border, rgba(249, 115, 22, 0.3))',
              fontWeight: '600',
              fontSize: '13.5px',
              borderRadius: '8px',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.5s ease', transform: syncLoading ? 'rotate(360deg)' : 'none' }}>
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l.73-.73"/>
            </svg>
            {syncLoading ? 'Đang cập nhật...' : 'Cập nhật'}
          </button>
        )}
      </div>

      {/* Modern Clean Search & Quick Preset Chips Bar */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        background: 'var(--bg-secondary, rgba(0, 0, 0, 0.02))',
        padding: '12px 14px',
        borderRadius: '12px',
        border: '1px solid var(--border-color, rgba(0, 0, 0, 0.08))',
        marginBottom: '18px'
      }}>
        {/* Row 1: Keyword Search Input */}
        <div style={{ position: 'relative', width: '100%' }}>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted, #94a3b8)',
              pointerEvents: 'none'
            }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="form-control"
            placeholder={`Tìm đơn ${platformFilter} (Mã đơn / Sản phẩm / Zalo ID / Sub ID)...`}
            value={orderSearch}
            onChange={e => setOrderSearch(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '38px',
              paddingRight: orderSearch ? '32px' : '14px',
              height: '42px',
              borderRadius: '10px',
              border: '1px solid var(--border-color, #cbd5e1)',
              background: 'var(--bg-card, #ffffff)',
              color: 'var(--text-main, #0f172a)',
              fontSize: '13.5px',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
          />
          {orderSearch && (
            <button
              onClick={() => setOrderSearch('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted, #94a3b8)',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '2px 4px'
              }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>

        {/* Row 2: Date Preset Quick Filter Chips */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '2px',
          WebkitOverflowScrolling: 'touch'
        }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', fontWeight: '600', marginRight: '4px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <i className="fa-regular fa-calendar-days" style={{ color: 'var(--color-primary, #ea580c)' }}></i> Lọc nhanh:
          </span>
          {datePresets.map(preset => {
            const isSelected = activeDatePreset === preset.key;
            return (
              <button
                key={preset.key}
                onClick={() => setActiveDatePreset(preset.key)}
                style={{
                  border: isSelected ? '1px solid var(--color-primary, #ea580c)' : '1px solid var(--border-color, #cbd5e1)',
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: isSelected ? '700' : '500',
                  background: isSelected ? 'var(--color-primary-light, rgba(249, 115, 22, 0.12))' : 'var(--bg-card, #ffffff)',
                  color: isSelected ? 'var(--color-primary, #ea580c)' : 'var(--text-main, #475569)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Responsive Orders Table */}
      <div className="table-container" style={{ overflowX: 'auto' }}>
        <table style={{ tableLayout: 'fixed', width: '100%', minWidth: '780px' }}>
          <thead>
            <tr>
              <th style={{ width: '150px' }}>Mã đơn hàng</th>
              <th style={{ width: '250px' }}>Tên sản phẩm</th>
              <th style={{ width: '160px' }}>Thành viên / Zalo ID</th>
              <th style={{ width: '150px', textAlign: 'right' }}>Tích lũy hoa hồng</th>
              <th style={{ width: '145px' }}>Thời gian</th>
              <th style={{ width: '110px', textAlign: 'center' }}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr className="empty-row">
                <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 16px' }}>
                  Không tìm thấy đơn hàng {platformFilter} nào phù hợp
                </td>
              </tr>
            ) : (
              filteredOrders.map(o => {
                const orderUser = users.find(u => u.zaloId === o.zaloId || u.zaloId === o.subId);
                const afterTax = (o.commission || 0) * 0.9;
                const afterDeduction = afterTax * 0.8;
                return (
                  <tr key={o.id}>
                    <td data-label="Mã đơn">
                      <code className="order-id-code" style={{ fontSize: '12px' }}>{o.orderId}</code>
                    </td>
                    <td data-label="Sản phẩm" title={o.productName}>
                      <span style={{ fontWeight: '600', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {o.productName}
                      </span>
                    </td>
                    <td data-label="Thành viên">
                      <div style={{ fontWeight: '600', fontSize: '13.5px' }} title={orderUser ? orderUser.zaloName : (o.zaloId || 'UNKNOWN')}>
                        {orderUser ? orderUser.zaloName : <code style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{o.zaloId || 'UNKNOWN'}</code>}
                      </div>
                      {o.subId && (
                        <div style={{ marginTop: '2px' }}>
                          <code style={{ fontSize: '11.5px', color: 'var(--text-muted)' }} title={o.subId}>{o.subId}</code>
                        </div>
                      )}
                    </td>
                    <td data-label="Hoa hồng" style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end', fontSize: '12px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Gốc: {formatMoney(o.commission)}</span>
                        <span style={{ color: 'var(--color-warning)' }}>Sau thuế: {formatMoney(afterTax)}</span>
                        <span style={{ color: 'var(--color-success)', fontWeight: '700' }}>Khách: {formatMoney(afterDeduction)}</span>
                      </div>
                    </td>
                    <td data-label="Thời gian">
                      <div style={{ fontSize: '12px' }} title={`Đặt mua: ${formatDateTime(o.purchaseTime)}`}>Đặt: {formatDateTime(o.purchaseTime)}</div>
                      {o.completeTime && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Xong: {formatDateTime(o.completeTime)}</div>
                      )}
                    </td>
                    <td data-label="Trạng thái" style={{ textAlign: 'center' }}>
                      <span className={`badge ${o.status === 'Hoàn thành' || o.status === 'Đã chốt HH' || o.status === 'Đã chốt' || o.status === 2 ? 'badge-completed' : o.status === 'Đã hủy' || o.status === 3 ? 'badge-cancelled' : 'badge-pending'}`}
                        style={{ fontSize: '11px', padding: '4px 10px' }}>
                        {o.status === 2 || o.status === 'Hoàn thành' || o.status === 'Đã chốt HH' ? 'Hoàn thành (Đã chốt)' : o.status === 3 || o.status === 'Đã hủy' ? 'Đã hủy' : (typeof o.status === 'number' ? (o.status === 2 ? 'Hoàn thành' : o.status === 3 ? 'Đã hủy' : 'Chờ kiểm duyệt') : (o.status || 'Chờ kiểm duyệt'))}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
