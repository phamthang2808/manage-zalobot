import { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDateTime, formatMoney } from '../../utils/formatters';
import AssignOrderModal from './AssignOrderModal';
import CopyButton from '../common/CopyButton';

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
  const [selectedOrderForAssign, setSelectedOrderForAssign] = useState(null);

  // Import file states
  const [importingLazada, setImportingLazada] = useState(false);
  const [importingFood, setImportingFood] = useState(false);
  const lazadaFileInputRef = useRef(null);
  const foodFileInputRef = useRef(null);

  const getPlatformName = (o) => {
    if (!o) return 'Shopee';
    const p = (o.platform || '').trim().toLowerCase();
    if (p.includes('tiktok')) return 'TikTok Shop';
    if (p.includes('lazada')) return 'Lazada';
    if (p.includes('shopeefood') || (o.orderId && o.orderId.toUpperCase().startsWith('SPF')) || (o.productName && o.productName.toLowerCase().includes('shopeefood'))) return 'ShopeeFood';
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

  const handleImportLazada = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setImportingLazada(true);
    try {
      const t = sessionStorage.getItem('adminToken') || token;
      const res = await fetch(`${API_URL_ROOT}/api/admin/orders/import-lazada`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${t}` },
        body: formData,
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi import file Lazada');

      showToast(`Đã import thành công ${data.newOrders || 0} đơn mới, cập nhật ${data.updatedOrders || 0} đơn Lazada! 🎉`, 'success');
      fetchData(token, user);
    } catch (err) {
      showToast(err.message || 'Lỗi khi import file Lazada', 'error');
    } finally {
      setImportingLazada(false);
      if (lazadaFileInputRef.current) lazadaFileInputRef.current.value = '';
    }
  };

  const handleImportFood = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setImportingFood(true);
    try {
      const t = sessionStorage.getItem('adminToken') || token;
      const res = await fetch(`${API_URL_ROOT}/api/admin/orders/import-shopeefood`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${t}` },
        body: formData,
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi import file ShopeeFood');

      showToast(data.message || `Đã import thành công đơn hàng ShopeeFood! 🎉`, 'success');
      fetchData(token, user);
    } catch (err) {
      showToast(err.message || 'Lỗi khi import file ShopeeFood', 'error');
    } finally {
      setImportingFood(false);
      if (foodFileInputRef.current) foodFileInputRef.current.value = '';
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
            { key: 'Lazada', iconClass: 'fa-solid fa-store', label: 'Lazada', count: combinedOrders.filter(o => getPlatformName(o) === 'Lazada').length },
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
                    ? (tab.key === 'TikTok Shop' ? '#000000' : tab.key === 'ShopeeFood' ? '#d0011b' : tab.key === 'Lazada' ? '#0f146d' : '#ee4d2d')
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
                {tab.count !== null && tab.count !== undefined && (
                  <span style={{
                    fontSize: '11px',
                    padding: '2px 7px',
                    borderRadius: '12px',
                    background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)',
                    color: isActive ? '#ffffff' : 'var(--text-main, #334155)'
                  }}>
                    {tab.count}
                  </span>
                )}
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

      {/* Import Báo Cáo Đối Soát Cho Lazada */}
      {platformFilter === 'Lazada' && (
        <div style={{
          background: 'var(--bg-card, #ffffff)',
          border: '1.5px solid var(--border-color, #e2e8f0)',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#0f146d', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
              <i className="fa-solid fa-file-excel"></i>
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: '800', color: 'var(--text-bright, #0f172a)' }}>
                📥 Import Báo Cáo Đối Soát Lazada (Excel / CSV)
              </h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
                Tải file báo cáo đối soát từ Lazada Portal để tự động cập nhật trạng thái đơn, hoa hồng và cộng số dư thành viên.
              </p>
            </div>
          </div>
          <div>
            <input type="file" ref={lazadaFileInputRef} accept=".xlsx, .xls, .csv" onChange={handleImportLazada} style={{ display: 'none' }} />
            <button
              type="button"
              disabled={importingLazada}
              onClick={() => lazadaFileInputRef.current?.click()}
              style={{
                padding: '9px 20px',
                borderRadius: '10px',
                border: 'none',
                background: importingLazada ? '#94a3b8' : '#0f146d',
                color: '#fff',
                fontSize: '13px',
                fontWeight: '700',
                cursor: importingLazada ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(15, 20, 109, 0.25)'
              }}
            >
              {importingLazada ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-upload"></i>
                  <span>Chọn File Excel Lazada</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Import Báo Cáo Đối Soát Cho ShopeeFood */}
      {platformFilter === 'ShopeeFood' && (
        <div style={{
          background: 'var(--bg-card, #ffffff)',
          border: '1.5px solid var(--border-color, #e2e8f0)',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#d0011b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
              <i className="fa-solid fa-utensils"></i>
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: '800', color: 'var(--text-bright, #0f172a)' }}>
                📥 Import Báo Cáo Đối Soát ShopeeFood (Excel / CSV)
              </h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
                Tải file báo cáo đối soát từ ShopeeFood Portal để tự động cập nhật trạng thái đơn, hoa hồng và cộng số dư thành viên.
              </p>
            </div>
          </div>
          <div>
            <input type="file" ref={foodFileInputRef} accept=".xlsx, .xls, .csv" onChange={handleImportFood} style={{ display: 'none' }} />
            <button
              type="button"
              disabled={importingFood}
              onClick={() => foodFileInputRef.current?.click()}
              style={{
                padding: '9px 20px',
                borderRadius: '10px',
                border: 'none',
                background: importingFood ? '#94a3b8' : '#d0011b',
                color: '#fff',
                fontSize: '13px',
                fontWeight: '700',
                cursor: importingFood ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(208, 1, 27, 0.25)'
              }}
            >
              {importingFood ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-upload"></i>
                  <span>Chọn File Excel ShopeeFood</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

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

      {/* Responsive Orders Table (Dùng chung 100% cho cả 4 sàn: Shopee, TikTok Shop, Lazada, ShopeeFood) */}
      <style dangerouslySetInnerHTML={{ __html: `
        .orders-table-container {
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch !important;
          width: 100% !important;
          display: block !important;
        }
        .orders-table-container table,
        .orders-table-container table.orders-table,
        table.orders-table {
          display: table !important;
          min-width: 860px !important;
          width: 100% !important;
          table-layout: fixed !important;
          border-collapse: collapse !important;
        }
        .orders-table-container table thead {
          display: table-header-group !important;
        }
        .orders-table-container table thead tr {
          display: table-row !important;
          background: var(--bg-main, #f1f5f9) !important;
        }
        .orders-table-container table thead th {
          display: table-cell !important;
          padding: 12px 10px !important;
          white-space: nowrap !important;
          font-weight: 700 !important;
          font-size: 13px !important;
          border-bottom: 2px solid var(--border-color) !important;
        }
        .orders-table-container table tbody {
          display: table-row-group !important;
          gap: 0 !important;
        }
        .orders-table-container table tbody tr {
          display: table-row !important;
          background: transparent !important;
          border: none !important;
          border-bottom: 1px solid var(--border-color) !important;
          border-radius: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
          margin: 0 !important;
        }
        .orders-table-container table tbody tr:hover {
          background: rgba(249, 115, 22, 0.04) !important;
          border-color: var(--border-color) !important;
          box-shadow: none !important;
        }
        .orders-table-container table tbody tr td {
          display: table-cell !important;
          padding: 12px 10px !important;
          width: auto !important;
          border-bottom: 1px solid var(--border-color) !important;
          border-top: none !important;
          box-shadow: none !important;
          font-size: 13px !important;
          vertical-align: middle !important;
        }
        .orders-table-container table tbody tr td::before {
          display: none !important;
          content: none !important;
        }
        .orders-table-container table tbody tr td[data-label="Sản phẩm"],
        .orders-table-container table tbody tr td[data-label="Mã đơn"],
        .orders-table-container table tbody tr td[data-label="Mã đơn & Thời gian"] {
          font-size: 13px !important;
          font-weight: normal !important;
          border-bottom: 1px solid var(--border-color) !important;
          padding: 12px 10px !important;
        }
        html[data-theme="dark"] .orders-table-container table tbody tr,
        html.dark .orders-table-container table tbody tr,
        body.dark .orders-table-container table tbody tr {
          background: transparent !important;
          border: none !important;
          border-radius: 0 !important;
          box-shadow: none !important;
        }
        html[data-theme="dark"] .orders-table-container table tbody tr td,
        html.dark .orders-table-container table tbody tr td,
        body.dark .orders-table-container table tbody tr td {
          background: transparent !important;
          border-top: none !important;
          border-left: none !important;
          border-right: none !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
          box-shadow: none !important;
        }
        html[data-theme="dark"] .orders-table-container table tbody tr:hover,
        html.dark .orders-table-container table tbody tr:hover,
        body.dark .orders-table-container table tbody tr:hover {
          background: rgba(255, 255, 255, 0.03) !important;
        }
        html[data-theme="dark"] .orders-table-container table thead th,
        html.dark .orders-table-container table thead th,
        body.dark .orders-table-container table thead th {
          background: #0f172a !important;
          color: #94a3b8 !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
        }
        @media (max-width: 768px) {
          .order-dates-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 2px !important;
          }
          .desktop-separator {
            display: none !important;
          }
        }
      `}} />

      <div className="table-container orders-table-container" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table className="orders-table" style={{ tableLayout: 'fixed', width: '100%', minWidth: '940px' }}>
          <thead>
            <tr>
              <th style={{ width: '190px' }}>Mã đơn & Thời gian</th>
              <th style={{ width: '310px' }}>Tên sản phẩm</th>
              <th style={{ width: '190px' }}>Thành viên / Zalo ID</th>
              <th style={{ width: '150px', textAlign: 'right' }}>Tích lũy hoa hồng</th>
              <th style={{ width: '110px', textAlign: 'center' }}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr className="empty-row">
                <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 16px' }}>
                  Không tìm thấy đơn hàng {platformFilter} nào phù hợp
                </td>
              </tr>
            ) : (
              filteredOrders.map(o => {
                const orderUser = users.find(u => u.zaloId === o.zaloId || u.zaloId === o.subId);
                const commRaw = o.commission != null ? o.commission : (o.payout != null ? o.payout : 0);
                const afterTax = commRaw * 0.9;
                const afterDeduction = afterTax * 0.8;
                const isCompleted = o.status === 2 || o.status === 'Hoàn thành' || o.status === 'Đã chốt HH' || o.status === 'Đã chốt';
                const isCancelled = o.status === 3 || o.status === 'Đã hủy' || o.status === 'Hủy';

                return (
                  <tr key={o.id}>
                    <td data-label="Mã đơn & Thời gian">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{
                            fontFamily: 'monospace',
                            fontSize: '12.5px',
                            fontWeight: '750',
                            color: '#ea580c',
                            letterSpacing: '0.2px'
                          }}>
                            {o.orderId}
                          </span>
                          <CopyButton text={o.orderId} title="Copy mã đơn hàng" toastMessage={`Đã copy mã đơn: ${o.orderId}`} />
                        </div>
                        <div className="order-dates-row" style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          flexWrap: 'wrap',
                          fontSize: '11px',
                          marginTop: '2px',
                          lineHeight: '1.4'
                        }}>
                          <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }} title={`Đặt mua: ${formatDateTime(o.purchaseTime || o.orderDate || o.createdTime)}`}>
                            Đặt: {formatDateTime(o.purchaseTime || o.orderDate || o.createdTime)}
                          </span>
                          {(isCompleted || o.completeTime) && o.completeTime && (
                            <span style={{ color: '#059669', fontWeight: '700', whiteSpace: 'nowrap' }} title={`Hoàn thành: ${formatDateTime(o.completeTime)}`}>
                              <span className="desktop-separator">• </span>Xong: {formatDateTime(o.completeTime)}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td data-label="Sản phẩm" title={o.productName}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {o.imageUrl ? (
                          <img
                            src={o.imageUrl}
                            alt={o.productName || 'Ảnh sản phẩm'}
                            referrerPolicy="no-referrer"
                            style={{
                              width: '46px',
                              height: '46px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              border: '1px solid var(--border-color, #cbd5e1)',
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
                            width: '46px',
                            height: '46px',
                            borderRadius: '8px',
                            background: 'var(--bg-main, #f1f5f9)',
                            border: '1px solid var(--border-color, #e2e8f0)',
                            display: o.imageUrl ? 'none' : 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            color: 'var(--text-muted, #94a3b8)'
                          }}
                        >
                          <i className="fa-solid fa-bag-shopping" style={{ fontSize: '18px', opacity: 0.6 }}></i>
                        </div>
                        <span style={{ fontWeight: '600', fontSize: '13px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.4' }}>
                          {o.productName || `Sản phẩm ${platformFilter}`}
                        </span>
                      </div>
                    </td>
                    <td data-label="Thành viên">
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '5px' }}>
                        <div style={{ fontWeight: '600', fontSize: '13.5px', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={orderUser ? orderUser.zaloName : (o.zaloId || o.subId || 'UNKNOWN')}>
                          {orderUser ? orderUser.zaloName : <code style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{o.zaloId || o.subId || 'UNKNOWN'}</code>}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedOrderForAssign(o)}
                            style={{
                              background: o.manuallyAssigned ? 'rgba(249,115,22,0.12)' : 'var(--bg-main, #f1f5f9)',
                              color: o.manuallyAssigned ? '#ea580c' : 'var(--text-main, #334155)',
                              border: `1px solid ${o.manuallyAssigned ? '#fed7aa' : 'var(--border-color, #cbd5e1)'}`,
                              borderRadius: '6px',
                              padding: '2.5px 8px',
                              fontSize: '11px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.2s ease',
                              whiteSpace: 'nowrap'
                            }}
                            title="Gắn đơn cho thành viên khác"
                          >
                            <i className="fa-solid fa-link" style={{ fontSize: '10px' }}></i>
                            <span>{o.manuallyAssigned ? 'Đổi chủ' : 'Gắn đơn'}</span>
                          </button>

                          {o.source === 'WEB' && (
                            <span style={{ fontSize: '10px', background: 'rgba(124, 58, 237, 0.12)', color: '#7c3aed', borderRadius: '4px', padding: '1px 5px', fontWeight: '800' }}>
                              🌐 Web
                            </span>
                          )}
                        </div>
                      </div>

                      {o.subId && o.subId !== o.zaloId && (
                        <div style={{ marginTop: '2px', display: 'flex', alignItems: 'center' }}>
                          <code style={{ fontSize: '11px', color: 'var(--text-muted)' }} title={o.subId}>Sub: {o.subId}</code>
                        </div>
                      )}
                      {o.manuallyAssigned && (
                        <div style={{ marginTop: '3px' }}>
                          <span style={{ fontSize: '10px', background: 'rgba(249,115,22,0.15)', color: '#ea580c', border: '1px solid rgba(249,115,22,0.3)', borderRadius: '6px', padding: '1px 5px', fontWeight: '700' }}>
                            🔒 Đã gắn tay
                          </span>
                        </div>
                      )}
                    </td>
                    <td data-label="Hoa hồng" style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end', fontSize: '12px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Gốc: {formatMoney(commRaw)}</span>
                        <span style={{ color: 'var(--color-warning)' }}>Sau thuế: {formatMoney(afterTax)}</span>
                        <span style={{ color: 'var(--color-success)', fontWeight: '700' }}>Khách: {formatMoney(afterDeduction)}</span>
                      </div>
                    </td>
                    <td data-label="Trạng thái" style={{ textAlign: 'center' }}>
                      {(() => {
                        const text = isCompleted ? 'Hoàn thành' : isCancelled ? 'Đã hủy' : (typeof o.status === 'number' ? (o.status === 2 ? 'Hoàn thành' : o.status === 3 ? 'Đã hủy' : 'Chờ kiểm duyệt') : (o.status || 'Chờ kiểm duyệt'));
                        const color = isCompleted ? '#10b981' : isCancelled ? '#ef4444' : '#f59e0b';
                        return (
                          <span style={{ color, fontWeight: '700', fontSize: '12.5px' }}>
                            {text}
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Assign Order Modal */}
      {selectedOrderForAssign && (
        <AssignOrderModal
          order={selectedOrderForAssign}
          onClose={() => setSelectedOrderForAssign(null)}
          onSuccess={() => fetchData(token, user)}
        />
      )}
    </div>
  );
}
