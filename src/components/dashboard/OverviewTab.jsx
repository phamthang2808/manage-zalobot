import { useApp } from '../../context/AppContext';
import { formatMoney, formatDateTime, getBankAndAccount } from '../../utils/formatters';

export default function OverviewTab() {
  const { stats, payouts, users, handleApprovePayout } = useApp();

  const pendingPayouts = payouts.filter(p => p.status === 'PENDING');

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <span className="stat-label">Tổng thành viên</span>
          <span className="stat-val">{stats.totalMembers}</span>
        </div>
        <div className="stat-card success">
          <div className="stat-icon success">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </div>
          <span className="stat-label">Tổng đơn hàng</span>
          <span className="stat-val">{stats.totalOrders}</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <span className="stat-label">Doanh thu hoa hồng</span>
          <span className="stat-val">{formatMoney(stats.totalCommission)}</span>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon warning">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <span className="stat-label">Chờ duyệt rút tiền</span>
          <span className="stat-val" style={{ color: stats.pendingPayoutsCount > 0 ? '#ea580c' : 'inherit' }}>
            {stats.pendingPayoutsCount}
          </span>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
          </div>
          <span className="stat-label">Đã thanh toán (Thực tế)</span>
          <span className="stat-val">{formatMoney(stats.totalWithdrawn)}</span>
        </div>
      </div>

      <div className="data-card">
        <div className="card-header">
          <h2 className="card-title">🚨 Yêu Cầu Rút Tiền Chờ Duyệt Gần Đây</h2>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Mã GD</th><th>Thành viên</th><th>Ngân hàng</th>
                <th>Số tài khoản</th><th>Số tiền</th><th>Thời gian gửi</th><th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {pendingPayouts.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                    🎉 Không có yêu cầu rút tiền nào đang chờ duyệt!
                  </td>
                </tr>
              ) : (
                pendingPayouts.slice(0, 5).map(p => {
                  const memberUser = users.find(u => u.zaloId === p.zaloId);
                  const bankAndAcc = getBankAndAccount(p);
                  return (
                    <tr key={p.id}>
                      <td><strong>PT_{p.id}</strong></td>
                      <td>{memberUser ? memberUser.zaloName : p.zaloId}</td>
                      <td>{bankAndAcc.bankName || 'Chưa cấu hình'}</td>
                      <td><code>{bankAndAcc.accountNumber || 'Chưa cấu hình'}</code></td>
                      <td style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>{formatMoney(p.amount)}</td>
                      <td>{formatDateTime(p.createdAt)}</td>
                      <td>
                        <button className="btn btn-success" onClick={() => handleApprovePayout(p.id)}>✓ Phê duyệt</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
