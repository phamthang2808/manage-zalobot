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
    orderId: '24081691823901',
    productName: 'Son Kem Lì Mịn Môi Chống Nước Shopee Store',
    zaloId: '27765123456789',
    subId: 'PhamThang',
    platform: 'Shopee',
    commission: 18500,
    status: 'Hoàn thành',
    purchaseTime: '2026-08-15T16:20:00',
    completeTime: '2026-08-16T09:30:00'
  },
  {
    id: 104,
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
  const [platformFilter, setPlatformFilter] = useState('ALL');
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [syncLoading, setSyncLoading] = useState(false);

  // Combine real backend orders with DEMO orders if empty or showcase
  const displayOrders = (orders && orders.length > 0) ? orders : DEMO_ORDERS;

  const filteredOrders = displayOrders.filter(o => {
    const matchesSearch =
      o.orderId?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.zaloId?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.productName?.toLowerCase().includes(orderSearch.toLowerCase());
    
    if (!matchesSearch) return false;

    if (platformFilter === 'ALL') return true;
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

  const getPlatformBadge = (order) => {
    const platform = order.platform || (order.orderId?.startsWith('579') ? 'TikTok Shop' : order.orderId?.startsWith('SPF') ? 'ShopeeFood' : 'Shopee');
    if (platform === 'TikTok Shop') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: '700',
          background: '#000000',
          color: '#00f2fe',
          border: '1px solid #fe2c55'
        }}>
          🎵 TikTok Shop
        </span>
      );
    } else if (platform === 'ShopeeFood') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: '700',
          background: 'rgba(208, 1, 27, 0.12)',
          color: '#d0011b',
          border: '1px solid rgba(208, 1, 27, 0.3)'
        }}>
          🍔 ShopeeFood
        </span>
      );
    }
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: '700',
        background: 'rgba(238, 77, 45, 0.12)',
        color: '#ee4d2d',
        border: '1px solid rgba(238, 77, 45, 0.3)'
      }}>
        🛒 Shopee
      </span>
    );
  };

  return (
    <div className="data-card">
      {/* Action Bar & Controls */}
      <div style={{ padding: '16px 0 20px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📦 Báo Cáo Đối Soát Đơn Hàng Tiếp Thị
          </h3>

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
              padding: '7px 16px',
              borderRadius: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            {syncLoading ? '⏳ Đang đồng bộ...' : '🎵 Đồng bộ đơn TikTok (RioHub)'}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={e => { setImportFile(e.target.files[0]); setImportResult(null); }}
            style={{ color: 'var(--text-muted)', fontSize: '13px' }}
          />
          <button
            className="btn btn-success"
            onClick={handleImportFile}
            disabled={!importFile || importLoading}
            style={{ minWidth: '120px' }}
          >
            {importLoading ? '⏳ Đang import...' : '⬆️ Import Excel Shopee'}
          </button>
          {importFile && <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{importFile.name}</span>}
        </div>

        {importResult && (
          <div style={{
            marginTop: '10px', padding: '10px 14px', borderRadius: '8px', fontSize: '13px',
            background: importResult.success ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)',
            border: `1px solid ${importResult.success ? 'var(--color-success)' : 'var(--color-danger)'}`,
            color: importResult.success ? 'var(--color-success)' : 'var(--color-danger)'
          }}>
            {importResult.success ? '✅ ' : '❌ '}{importResult.message}
          </div>
        )}
      </div>

      {/* Filter and Search */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
        <div style={{ flex: '1', minWidth: '220px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Tìm kiếm đơn hàng (Mã đơn / Sản phẩm / Zalo ID / Sub ID)..."
            value={orderSearch}
            onChange={e => setOrderSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-secondary, rgba(0,0,0,0.04))', padding: '4px', borderRadius: '8px' }}>
          {[
            { key: 'ALL', label: 'Tất cả sàn' },
            { key: 'Shopee', label: '🛒 Shopee' },
            { key: 'TikTok Shop', label: '🎵 TikTok Shop' },
            { key: 'ShopeeFood', label: '🍔 ShopeeFood' }
          ].map(p => (
            <button
              key={p.key}
              onClick={() => setPlatformFilter(p.key)}
              style={{
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12.5px',
                fontWeight: platformFilter === p.key ? '700' : '500',
                background: platformFilter === p.key ? 'var(--bg-card, #ffffff)' : 'transparent',
                color: platformFilter === p.key ? 'var(--text-main, #111)' : 'var(--text-muted, #666)',
                boxShadow: platformFilter === p.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="table-container">
        <table style={{ tableLayout: 'fixed', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ width: '150px' }}>Sàn & Mã đơn</th>
              <th style={{ width: '230px' }}>Tên sản phẩm</th>
              <th style={{ width: '160px' }}>Thành viên / Sub ID</th>
              <th style={{ width: '140px', textAlign: 'right' }}>Tích lũy hoa hồng</th>
              <th style={{ width: '145px' }}>Thời gian</th>
              <th style={{ width: '100px', textAlign: 'center' }}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr className="empty-row"><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Không tìm thấy đơn hàng nào</td></tr>
            ) : (
              filteredOrders.map(o => {
                const orderUser = users.find(u => u.zaloId === o.zaloId);
                const afterTax = (o.commission || 0) * 0.9;
                const afterDeduction = afterTax * 0.8;
                return (
                  <tr key={o.id}>
                    <td data-label="Mã đơn">
                      <div style={{ marginBottom: '4px' }}>
                        {getPlatformBadge(o)}
                      </div>
                      <code className="order-id-code" style={{ fontSize: '11.5px' }}>{o.orderId}</code>
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
                      <div style={{ marginTop: '2px' }}>
                        <code style={{ fontSize: '11.5px', color: 'var(--text-muted)' }} title={o.subId}>SubID: {o.subId || '-'}</code>
                      </div>
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
                        style={{ fontSize: '11px', padding: '3px 8px' }}>
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
