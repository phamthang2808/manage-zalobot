import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDateTime, formatMoney } from '../../utils/formatters';

export default function OrdersTab() {
  const { orders, users, token, user, fetchData, showToast, API_URL_ROOT } = useApp();
  const [orderSearch, setOrderSearch] = useState('');
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const filteredOrders = orders.filter(o =>
    o.orderId?.toLowerCase().includes(orderSearch.toLowerCase()) ||
    o.zaloId?.toLowerCase().includes(orderSearch.toLowerCase()) ||
    o.productName?.toLowerCase().includes(orderSearch.toLowerCase())
  );

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

  return (
    <div className="data-card">
      {/* Upload file import */}
      <div style={{ padding: '16px 0 20px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '12px', fontSize: '15px' }}>📥 Import báo cáo đối soát Shopee (CSV/Excel)</h3>
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
            {importLoading ? '⏳ Đang import...' : '⬆️ Import'}
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

      <div className="search-container">
        <input
          type="text"
          className="form-control"
          placeholder="Tìm kiếm đơn hàng (ID/Sản phẩm/Zalo ID)..."
          value={orderSearch}
          onChange={e => setOrderSearch(e.target.value)}
        />
      </div>

      <div className="table-container">
        <table style={{ tableLayout: 'fixed', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ width: '135px' }}>Mã đơn hàng</th>
              <th style={{ width: '240px' }}>Tên sản phẩm</th>
              <th style={{ width: '160px' }}>Thành viên / Zalo ID</th>
              <th style={{ width: '140px', textAlign: 'right' }}>Tích lũy hoa hồng</th>
              <th style={{ width: '145px' }}>Thời gian</th>
              <th style={{ width: '100px', textAlign: 'center' }}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Không tìm thấy đơn hàng nào</td></tr>
            ) : (
              filteredOrders.map(o => {
                const orderUser = users.find(u => u.zaloId === o.zaloId);
                const afterTax = (o.commission || 0) * 0.9;
                const afterDeduction = afterTax * 0.8;
                return (
                  <tr key={o.id}>
                    <td><code className="order-id-code">{o.orderId}</code></td>
                    <td title={o.productName} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {o.productName}
                    </td>
                    <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: '600', fontSize: '13.5px' }} title={orderUser ? orderUser.zaloName : (o.zaloId || 'UNKNOWN')}>
                        {orderUser ? orderUser.zaloName : <code style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{o.zaloId || 'UNKNOWN'}</code>}
                      </div>
                      <div style={{ marginTop: '4px' }}>
                        <code style={{ fontSize: '11.5px', color: 'var(--color-primary)' }} title={o.subId}>{o.subId || '-'}</code>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Gốc: {formatMoney(o.commission)}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--color-warning)', marginTop: '2px' }}>Sau thuế: {formatMoney(afterTax)}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--color-success)', marginTop: '2px', fontWeight: '600' }}>Khách: {formatMoney(afterDeduction)}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px' }} title={`Đặt mua: ${formatDateTime(o.purchaseTime)}`}>Đặt: {formatDateTime(o.purchaseTime)}</div>
                      {o.completeTime && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Xong: {formatDateTime(o.completeTime)}</div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
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
