import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDateTime, formatMoney, getBankAndAccount } from '../../utils/formatters';

export default function PayoutsTab() {
  const { payouts, users, handleApprovePayout } = useApp();
  const [payoutSearch, setPayoutSearch] = useState('');

  const filteredPayouts = payouts.filter(p => {
    const memberUser = users.find(u => u.zaloId === p.zaloId);
    const name = memberUser ? memberUser.zaloName : 'UNKNOWN';
    return name.toLowerCase().includes(payoutSearch.toLowerCase()) ||
      p.zaloId.includes(payoutSearch) ||
      String(p.id).includes(payoutSearch);
  });

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .payouts-table-container {
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch !important;
          width: 100% !important;
          display: block !important;
        }
        .payouts-table-container table,
        .payouts-table-container table.payouts-table,
        table.payouts-table {
          display: table !important;
          min-width: 900px !important;
          width: 100% !important;
          table-layout: fixed !important;
          border-collapse: collapse !important;
        }
        .payouts-table-container table thead {
          display: table-header-group !important;
        }
        .payouts-table-container table thead tr {
          display: table-row !important;
          background: var(--bg-main, #f1f5f9) !important;
        }
        .payouts-table-container table thead th {
          display: table-cell !important;
          padding: 12px 10px !important;
          white-space: nowrap !important;
          font-weight: 700 !important;
          font-size: 13px !important;
          border-bottom: 2px solid var(--border-color) !important;
        }
        .payouts-table-container table tbody {
          display: table-row-group !important;
          gap: 0 !important;
        }
        .payouts-table-container table tbody tr {
          display: table-row !important;
          background: transparent !important;
          border: none !important;
          border-bottom: 1px solid var(--border-color) !important;
          border-radius: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
          margin: 0 !important;
        }
        .payouts-table-container table tbody tr:hover {
          background: rgba(249, 115, 22, 0.04) !important;
          border-color: var(--border-color) !important;
          box-shadow: none !important;
        }
        .payouts-table-container table tbody tr td {
          display: table-cell !important;
          padding: 12px 10px !important;
          width: auto !important;
          border-bottom: 1px solid var(--border-color) !important;
          border-top: none !important;
          box-shadow: none !important;
          font-size: 13px !important;
          vertical-align: middle !important;
        }
        .payouts-table-container table tbody tr td::before {
          display: none !important;
          content: none !important;
        }
        html[data-theme="dark"] .payouts-table-container table tbody tr,
        html.dark .payouts-table-container table tbody tr,
        body.dark .payouts-table-container table tbody tr {
          background: transparent !important;
          border: none !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-radius: 0 !important;
          box-shadow: none !important;
        }
        html[data-theme="dark"] .payouts-table-container table tbody tr:hover,
        html.dark .payouts-table-container table tbody tr:hover,
        body.dark .payouts-table-container table tbody tr:hover {
          background: rgba(255, 255, 255, 0.04) !important;
        }
        html[data-theme="dark"] .payouts-table-container table thead th,
        html.dark .payouts-table-container table thead th,
        body.dark .payouts-table-container table thead th {
          background: #1b1e28 !important;
          color: #94a3b8 !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.12) !important;
        }
      `}} />
      <div className="data-card">
        <div className="search-container">
          <input
            type="text"
            className="form-control"
            placeholder="Tìm kiếm lệnh rút (Tên/Zalo ID/Mã GD)..."
            value={payoutSearch}
            onChange={e => setPayoutSearch(e.target.value)}
          />
        </div>
        <div className="table-container payouts-table-container" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="payouts-table" style={{ tableLayout: 'fixed', width: '100%', minWidth: '920px' }}>
            <thead>
              <tr>
                <th style={{ width: '105px' }}>Mã GD</th>
                <th style={{ width: '150px' }}>Thành viên</th>
                <th style={{ width: '135px' }}>Ngân hàng</th>
                <th style={{ width: '135px' }}>Số tài khoản</th>
                <th style={{ width: '130px', textAlign: 'right' }}>Số tiền yêu cầu</th>
                <th style={{ width: '125px' }}>Ngày gửi</th>
                <th style={{ width: '125px' }}>Phê duyệt</th>
                <th style={{ width: '110px', textAlign: 'center' }}>Trạng thái</th>
                <th style={{ width: '90px', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayouts.length === 0 ? (
                <tr className="empty-row"><td colSpan="9" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 16px' }}>Không tìm thấy yêu cầu rút tiền nào</td></tr>
              ) : (
                filteredPayouts.map(p => {
                  const memberUser = users.find(u => u.zaloId === p.zaloId);
                  const bankAndAcc = getBankAndAccount(p);
                  return (
                    <tr key={p.id}>
                      <td data-label="Mã GD"><strong>PT_{p.id}</strong></td>
                      <td data-label="Thành viên" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={memberUser ? memberUser.zaloName : p.zaloId}>
                        <strong>{memberUser ? memberUser.zaloName : p.zaloId}</strong>
                      </td>
                      <td data-label="Ngân hàng" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={bankAndAcc.bankName || 'Chưa cấu hình'}>
                        {bankAndAcc.bankName || 'Chưa cấu hình'}
                      </td>
                      <td data-label="Số tài khoản" style={{ fontSize: '12.5px' }}><code>{bankAndAcc.accountNumber || 'Chưa cấu hình'}</code></td>
                      <td data-label="Số tiền" style={{ color: 'var(--color-primary, #ea580c)', fontWeight: 'bold', textAlign: 'right' }}>{formatMoney(p.amount)}</td>
                      <td data-label="Ngày gửi" style={{ fontSize: '12px' }}>{formatDateTime(p.createdAt)}</td>
                      <td data-label="Phê duyệt" style={{ fontSize: '12px' }}>{p.completedAt ? formatDateTime(p.completedAt) : '-'}</td>
                      <td data-label="Trạng thái" style={{ textAlign: 'center' }}>
                        <span className={`badge ${p.status === 'COMPLETED' ? 'badge-completed' : 'badge-pending'}`}>
                          {p.status === 'COMPLETED' ? 'Đã thanh toán' : 'Chờ duyệt'}
                        </span>
                      </td>
                      <td data-label="Thao tác" style={{ textAlign: 'center' }}>
                        {p.status === 'PENDING' ? (
                          <button className="btn btn-success" style={{ padding: '4px 12px', fontSize: '12px', borderRadius: '6px' }} onClick={() => handleApprovePayout(p.id)}>✓ Duyệt</button>
                        ) : (
                          <span style={{ color: 'var(--color-success)', fontSize: '16px', fontWeight: 'bold' }}>✓</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
