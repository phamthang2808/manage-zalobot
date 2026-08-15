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
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Mã giao dịch</th>
              <th>Thành viên</th>
              <th>Ngân hàng</th>
              <th>Số tài khoản</th>
              <th>Số tiền yêu cầu</th>
              <th>Ngày yêu cầu</th>
              <th>Ngày phê duyệt</th>
              <th>Trạng thái</th>
              <th>Duyệt nhanh</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayouts.length === 0 ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Không tìm thấy yêu cầu rút tiền nào</td></tr>
            ) : (
              filteredPayouts.map(p => {
                const memberUser = users.find(u => u.zaloId === p.zaloId);
                const bankAndAcc = getBankAndAccount(p);
                return (
                  <tr key={p.id}>
                    <td><strong>PT_{p.id}</strong></td>
                    <td>{memberUser ? memberUser.zaloName : p.zaloId}</td>
                    <td>{bankAndAcc.bankName || 'Chưa cấu hình'}</td>
                    <td style={{ fontSize: '13px' }}><code>{bankAndAcc.accountNumber || 'Chưa cấu hình'}</code></td>
                    <td style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>{formatMoney(p.amount)}</td>
                    <td>{formatDateTime(p.createdAt)}</td>
                    <td>{formatDateTime(p.completedAt)}</td>
                    <td>
                      <span className={`badge ${p.status === 'COMPLETED' ? 'badge-completed' : 'badge-pending'}`}>
                        {p.status === 'COMPLETED' ? 'Đã thanh toán' : 'Chờ duyệt'}
                      </span>
                    </td>
                    <td>
                      {p.status === 'PENDING' ? (
                        <button className="btn btn-success" onClick={() => handleApprovePayout(p.id)}>✓ Duyệt</button>
                      ) : (
                        <span style={{ color: 'var(--color-success)', fontSize: '18px' }}>✓</span>
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
  );
}
