import { useApp } from '../../context/AppContext';
import { formatDateTime, formatMoney, getBankAndAccount } from '../../utils/formatters';

export default function OverviewTab() {
  const { stats, payouts, users, orders, handleApprovePayout, handleRejectPayout } = useApp();

  const pendingPayouts = payouts.filter(p => p.status === 'PENDING');

  // Calculate separate counts & commissions for Shopee and TikTok
  const shopeeOrdersCount = stats.shopeeOrdersCount !== undefined 
    ? stats.shopeeOrdersCount 
    : (orders || []).filter(o => !o.platform || o.platform === 'Shopee').length;

  const tiktokOrdersCount = stats.tiktokOrdersCount !== undefined 
    ? stats.tiktokOrdersCount 
    : (orders || []).filter(o => o.platform === 'TikTok Shop').length;

  const shopeeCommission = stats.shopeeCommission !== undefined
    ? stats.shopeeCommission
    : (orders || []).filter(o => !o.platform || o.platform === 'Shopee').reduce((sum, o) => sum + (o.commission || 0), 0);

  const tiktokCommission = stats.tiktokCommission !== undefined
    ? stats.tiktokCommission
    : (orders || []).filter(o => o.platform === 'TikTok Shop').reduce((sum, o) => sum + (o.commission || 0), 0);

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
          <span className="stat-val">{stats.totalMembers || 0}</span>
        </div>

        {/* Shopee Orders Card */}
        <div className="stat-card stat-shopee">
          <div className="stat-icon" style={{ background: 'rgba(238, 77, 45, 0.12)', color: '#ee4d2d' }}>
            <svg viewBox="0 0 109.59 122.88" style={{ width: '18px', height: '18px', fill: '#ee4d2d' }}>
              <path d="M74.98,91.98C76.15,82.36,69.96,76.22,53.6,71c-7.92-2.7-11.66-6.24-11.57-11.12 c0.33-5.4,5.36-9.34,12.04-9.47c4.63,0.09,9.77,1.22,14.76,4.56c0.59,0.37,1.01,0.32,1.35-0.2c0.46-0.74,1.61-2.53,2-3.17 c0.26-0.42,0.31-0.96-0.35-1.44c-0.95-0.7-3.6-2.13-5.03-2.72c-3.88-1.62-8.23-2.64-12.86-2.63c-9.77,0.04-17.47,6.22-18.12,14.47 c-0.42,5.95,2.53,10.79,8.86,14.47c1.34,0.78,8.6,3.67,11.49,4.57c9.08,2.83,13.8,7.9,12.69,13.81c-1.01,5.36-6.65,8.83-14.43,8.93 c-6.17-0.24-11.71-2.75-16.02-6.1c-0.11-0.08-0.65-0.5-0.72-0.56c-0.53-0.42-1.11-0.39-1.47,0.15c-0.26,0.4-1.92,2.8-2.34,3.43 c-0.39,0.55-0.18,0.86,0.23,1.2c1.8,1.5,4.18,3.14,5.81,3.97c4.47,2.28,9.32,3.53,14.48,3.72c3.32,0.22,7.5-0.49,10.63-1.81 C70.63,102.67,74.25,97.92,74.98,91.98L74.98,91.98z M54.79,7.18c-10.59,0-19.22,9.98-19.62,22.47h39.25 C74.01,17.16,65.38,7.18,54.79,7.18z M94.99,122.88l-0.41,0l-80.82-0.01h0c-5.5-0.21-9.54-4.66-10.09-10.19l-0.05-1 l-3.61-79.5v0C0,32.12,0,32.06,0,32c0-1.28,1.03-2.33,2.3-2.35l0,0h25.48C28.41,13.15,40.26,0,54.79,0s26.39,13.15,27.01,29.65 h25.4h0.04c1.3,0,2.35,1.05,2.35,2.35c0,0.04,0,0.08,0,0.12v0l-3.96,79.81l-0.04,0.68C105.12,118.21,100.59,122.73,94.99,122.88 L94.99,122.88z" />
            </svg>
          </div>
          <span className="stat-label">Đơn Hàng Shopee</span>
          <span className="stat-val" style={{ color: '#ee4d2d' }}>{shopeeOrdersCount} <small style={{ fontSize: '13px', fontWeight: '400', opacity: 0.85 }}>({formatMoney(shopeeCommission)})</small></span>
        </div>

        {/* TikTok Orders Card */}
        <div className="stat-card stat-tiktok">
          <div className="stat-icon" style={{ background: 'rgba(0, 200, 230, 0.12)', color: '#0284c7' }}>
            <svg viewBox="0 0 1024 1024" style={{ width: '18px', height: '18px', fill: 'currentColor' }}>
              <path d="M800 112.962C800 50.575 749.425 0 687.038 0H112.962C50.575 0 0 50.575 0 112.962v574.076C0 749.426 50.575 800 112.962 800h574.076C749.425 800 800 749.426 800 687.038zM662.759 348.916c-51.615.577-99.71-15.027-141.938-43.927v202.874c0 90.166-61.72 167.62-148.996 187.848-119.068 27.165-219.864-58.954-232.577-161.835-13.294-102.884 52.322-193.051 152.892-213.281 19.651-4.045 49.209-4.045 64.458-.577v108.661c-4.692-1.153-9.086-2.31-13.709-2.888-39.304-6.937-77.371 12.715-92.977 48.55-15.605 35.838-5.16 77.451 26.629 101.73 26.586 20.806 56.085 23.694 86.14 9.822 30.057-13.291 46.21-37.567 49.676-70.512.578-4.622.546-9.826.546-15.028V110.206c0-10.981.086-10.502 11.068-10.502h86.12c6.36 0 8.673.915 9.25 8.433 4.621 67.047 55.526 124.147 120.838 132.818 6.937 1.155 14.369 1.613 22.58 2.19z" transform="translate(112 112)"/>
            </svg>
          </div>
          <span className="stat-label">Đơn Hàng TikTok</span>
          <span className="stat-val" style={{ color: '#38bdf8' }}>{tiktokOrdersCount} <small style={{ fontSize: '13px', fontWeight: '400', opacity: 0.85 }}>({formatMoney(tiktokCommission)})</small></span>
        </div>

        <div className="stat-card stat-commission">
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
            {stats.pendingPayoutsCount || 0}
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
          <h2 className="card-title">
            <i className="fa-solid fa-money-check-dollar" style={{ color: '#f97316', marginRight: '8px' }}></i> Yêu Cầu Rút Tiền Chờ Duyệt Gần Đây
          </h2>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          .overview-table-container {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
            width: 100% !important;
            display: block !important;
          }
          .overview-table-container table {
            display: table !important;
            min-width: 780px !important;
            width: 100% !important;
            border-collapse: collapse !important;
          }
          .overview-table-container table thead {
            display: table-header-group !important;
          }
          .overview-table-container table thead tr {
            display: table-row !important;
          }
          .overview-table-container table thead th {
            display: table-cell !important;
            white-space: nowrap !important;
          }
          .overview-table-container table tbody {
            display: table-row-group !important;
          }
          .overview-table-container table tbody tr {
            display: table-row !important;
            background: transparent !important;
            border: none !important;
            border-bottom: 1px solid var(--border-color) !important;
            border-radius: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          .overview-table-container table tbody tr td {
            display: table-cell !important;
            white-space: nowrap !important;
            border-bottom: 1px solid var(--border-color) !important;
          }
          .overview-table-container table tbody tr td::before {
            display: none !important;
            content: none !important;
          }
          .overview-table-container table tbody tr td[data-label="Số tiền"] {
            background: transparent !important;
            border: none !important;
            border-bottom: 1px solid var(--border-color) !important;
            box-shadow: none !important;
            text-shadow: none !important;
          }
        `}} />
        <div className="table-container overview-table-container" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ minWidth: '780px' }}>
            <thead>
              <tr>
                <th>Mã GD</th><th>Thành viên</th><th>Ngân hàng</th>
                <th>Số tài khoản</th><th>Số tiền</th><th>Thời gian gửi</th><th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {pendingPayouts.length === 0 ? (
                <tr className="empty-row">
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                      <i className="fa-solid fa-money-check-dollar" style={{ fontSize: '1.2em', color: '#f97316' }}></i> Không có yêu cầu rút tiền nào đang chờ duyệt!
                    </span>
                  </td>
                </tr>
              ) : (
                pendingPayouts.slice(0, 5).map(p => {
                  const memberUser = users.find(u => u.zaloId === p.zaloId);
                  const bankAndAcc = getBankAndAccount(p);
                  return (
                    <tr key={p.id}>
                      <td data-label="Mã GD"><strong>PT_{p.id}</strong></td>
                      <td data-label="Thành viên">{memberUser ? memberUser.zaloName : p.zaloId}</td>
                      <td data-label="Ngân hàng">{bankAndAcc.bankName || 'Chưa cấu hình'}</td>
                      <td data-label="Số tài khoản"><code>{bankAndAcc.accountNumber || 'Chưa cấu hình'}</code></td>
                      <td data-label="Số tiền" style={{ color: '#10b981', fontWeight: '700', fontSize: '13.5px', background: 'transparent' }}>
                        {formatMoney(p.amount)}
                      </td>
                      <td data-label="Thời gian gửi">{formatDateTime(p.createdAt)}</td>
                      <td data-label="Hành động">
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleApprovePayout(p.id)}
                            style={{
                              background: 'rgba(16, 185, 129, 0.1)',
                              border: '1px solid rgba(16, 185, 129, 0.4)',
                              borderRadius: '6px',
                              color: '#10b981',
                              fontWeight: '700',
                              fontSize: '12px',
                              cursor: 'pointer',
                              padding: '3px 8px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            ✓ Duyệt
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectPayout(p.id)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.4)',
                              borderRadius: '6px',
                              color: '#ef4444',
                              fontWeight: '700',
                              fontSize: '12px',
                              cursor: 'pointer',
                              padding: '3px 8px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            ✕ Từ chối
                          </button>
                        </div>
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
