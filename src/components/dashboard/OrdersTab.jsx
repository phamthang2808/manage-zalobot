import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDateTime, formatMoney } from '../../utils/formatters';

const DEMO_ORDERS = [
  {
    id: 101,
    orderId: '57901289410928172',
    productName: 'Áo thun Form Rộng Unisex TikTok Shop Rio',
    zaloId: '27765123456789',
    subId: 'PhamThang',
    platform: 'TikTok Shop',
    commission: 55720,
    status: 'Hoàn thành',
    purchaseTime: '2026-08-16T10:15:00',
    completeTime: '2026-08-16T12:00:00'
  },
  {
    id: 102,
    orderId: '57908124912049182',
    productName: 'Tai Nghe Bluetooth Không Dây TikTok Shop Official',
    zaloId: '27765123456789',
    subId: 'PhamThang',
    platform: 'TikTok Shop',
    commission: 32000,
    status: 'Chờ xử lý',
    purchaseTime: '2026-08-16T13:40:00',
    completeTime: null
  },
  {
    id: 103,
    orderId: 'SPF9182371982',
    productName: 'Trà Sữa Chân Châu Đường Đen ShopeeFood',
    zaloId: '27765123456789',
    subId: 'PhamThang',
    platform: 'ShopeeFood',
    commission: 12000,
    status: 'Hoàn thành',
    purchaseTime: '2026-08-16T11:30:00',
    completeTime: '2026-08-16T11:55:00'
  }
];

export default function OrdersTab() {
  const { orders, users, token, user, fetchData, showToast, API_URL_ROOT } = useApp();
  const [orderSearch, setOrderSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('Shopee');
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [syncLoading, setSyncLoading] = useState(false);

  // Combine real backend orders with DEMO orders for missing platforms
  const combinedOrders = [...(orders || [])];
  DEMO_ORDERS.forEach(demo => {
    if (!combinedOrders.some(o => o.orderId === demo.orderId)) {
      combinedOrders.push(demo);
    }
  });

  const filteredOrders = combinedOrders.filter(o => {
    const matchesSearch =
      o.orderId?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.zaloId?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.productName?.toLowerCase().includes(orderSearch.toLowerCase());
    
    if (!matchesSearch) return false;

    const itemPlatform = o.platform || (o.orderId?.startsWith('579') ? 'TikTok Shop' : o.orderId?.startsWith('SPF') ? 'ShopeeFood' : 'Shopee');
    return itemPlatform === platformFilter;
  });

  const handleImportFile = async () => {
    if (!importFile) return;
    const formData = new FormData();
    formData.append('file', importFile);
    setImportLoading(true);
    setImportResult(null);
    try {
      const res = await fetch(`${API_URL_ROOT}/api/admin/import-excel`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text);
      setImportResult({ success: true, message: text });
      showToast('Import file Excel thành công: ' + text, 'success');
      setImportFile(null);
      fetchData(token, user);
    } catch (err) {
      setImportResult({ success: false, message: err.message });
      showToast('Lỗi Import Excel: ' + err.message, 'error');
    } finally {
      setImportLoading(false);
    }
  };

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

  return (
    <div className="data-card" style={{ padding: '20px' }}>
      {/* Platform Switcher Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        borderBottom: '2px solid var(--border-color, rgba(0,0,0,0.06))',
        paddingBottom: '14px',
        marginBottom: '20px'
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
            { key: 'Shopee', label: '🛒 Shopee', count: combinedOrders.filter(o => !o.platform || o.platform === 'Shopee').length },
            { key: 'TikTok Shop', label: '🎵 TikTok Shop', count: combinedOrders.filter(o => o.platform === 'TikTok Shop' || o.orderId?.startsWith('579')).length },
            { key: 'ShopeeFood', label: '🍔 ShopeeFood', count: combinedOrders.filter(o => o.platform === 'ShopeeFood' || o.orderId?.startsWith('SPF')).length }
          ].map(tab => {
            const isActive = platformFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setPlatformFilter(tab.key)}
                style={{
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  fontSize: '13.5px',
                  fontWeight: isActive ? '700' : '600',
                  background: isActive
                    ? (tab.key === 'TikTok Shop' ? 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)' : tab.key === 'ShopeeFood' ? '#d0011b' : '#ee4d2d')
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

        {/* Sync / Action Controls */}
        {platformFilter === 'TikTok Shop' ? (
          <button
            className="btn btn-primary"
            onClick={handleSyncTiktok}
            disabled={syncLoading}
            style={{
              background: 'linear-gradient(135deg, #000000 0%, #25f4ee 50%, #fe2c55 100%)',
              border: 'none',
              color: '#fff',
              fontWeight: '700',
              fontSize: '13px',
              padding: '8px 18px',
              borderRadius: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {syncLoading ? '⏳ Đang đồng bộ...' : '🎵 Đồng bộ đơn TikTok (RioHub)'}
          </button>
        ) : platformFilter === 'Shopee' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={e => { setImportFile(e.target.files[0]); setImportResult(null); }}
              style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '200px' }}
            />
            <button
              className="btn btn-success"
              onClick={handleImportFile}
              disabled={!importFile || importLoading}
              style={{ minWidth: '120px', whiteSpace: 'nowrap' }}
            >
              {importLoading ? '⏳ Đang import...' : '⬆️ Import Excel Shopee'}
            </button>
          </div>
        ) : null}
      </div>

      {importResult && (
        <div style={{
          marginBottom: '16px', padding: '10px 14px', borderRadius: '8px', fontSize: '13px',
          background: importResult.success ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)',
          border: `1px solid ${importResult.success ? 'var(--color-success)' : 'var(--color-danger)'}`,
          color: importResult.success ? 'var(--color-success)' : 'var(--color-danger)'
        }}>
          {importResult.success ? '✅ ' : '❌ '}{importResult.message}
        </div>
      )}

      {/* Search Input */}
      <div className="search-container" style={{ marginBottom: '16px' }}>
        <input
          type="text"
          className="form-control"
          placeholder={`Tìm kiếm đơn hàng ${platformFilter} (Mã đơn / Sản phẩm / Zalo ID)...`}
          value={orderSearch}
          onChange={e => setOrderSearch(e.target.value)}
        />
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
                  Không có đơn hàng {platformFilter} nào
                </td>
              </tr>
            ) : (
              filteredOrders.map(o => {
                const orderUser = users.find(u => u.zaloId === o.zaloId);
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
                      <span className={`badge ${o.status === 'Hoàn thành' ? 'badge-completed' : o.status === 'Đã hủy' ? 'badge-cancelled' : 'badge-pending'}`}
                        style={{ fontSize: '11px', padding: '4px 10px' }}>
                        {o.status}
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
