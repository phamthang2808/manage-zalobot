import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney, getBankAndAccount } from '../../utils/formatters';

function UserDetailModal({ selectedUser, onClose, orders }) {
  if (!selectedUser) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content user-detail-modal" onClick={e => e.stopPropagation()}>
        <header className="modal-header" style={{ marginBottom: '20px' }}>
          <h2 className="modal-title" style={{ fontSize: '24px' }}>👤 Chi Tiết Thành Viên</h2>
          <button className="modal-close" onClick={onClose} style={{ fontSize: '28px' }}>&times;</button>
        </header>
        <div className="modal-body">
          <div className="member-detail-grid">
            <div className="detail-item" style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-main)' }}>
              <div className="detail-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', color: 'var(--text-muted)' }}>Tên thành viên</div>
              <div className="detail-value" style={{ color: 'var(--color-primary)', fontSize: '22px', fontWeight: '700' }}>{selectedUser.zaloName || 'Vô danh'}</div>
            </div>
            <div className="detail-item" style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-main)' }}>
              <div className="detail-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', color: 'var(--text-muted)' }}>Zalo ID</div>
              <div className="detail-value" style={{ fontSize: '16px', wordBreak: 'break-all', fontFamily: 'monospace', color: 'var(--text-bright)' }}>{selectedUser.zaloId}</div>
            </div>
            <div className="detail-item" style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-main)' }}>
              <div className="detail-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', color: 'var(--text-muted)' }}>Ngân hàng nhận tiền</div>
              <div className="detail-value" style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-bright)' }}>{getBankAndAccount(selectedUser).bankName || '⚠️ Chưa cập nhật'}</div>
            </div>
            <div className="detail-item" style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-main)' }}>
              <div className="detail-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', color: 'var(--text-muted)' }}>Số tài khoản</div>
              <div className="detail-value"><code style={{ fontSize: '20px', letterSpacing: '2px', fontWeight: '700', color: 'var(--color-success)' }}>{getBankAndAccount(selectedUser).accountNumber || '⚠️ Chưa cập nhật'}</code></div>
            </div>
          </div>

          <div className="stats-grid modal-stats-grid">
            <div className="stat-card" style={{ padding: '16px' }}>
              <span className="stat-label">Chờ xử lý</span>
              <span className="stat-val" style={{ fontSize: '22px' }}>{formatMoney(selectedUser.wallet?.pendingCommission)}</span>
            </div>
            <div className="stat-card success" style={{ padding: '16px' }}>
              <span className="stat-label">Đã hoàn thành</span>
              <span className="stat-val" style={{ fontSize: '22px' }}>{formatMoney(selectedUser.wallet?.completedCommission)}</span>
            </div>
            <div className="stat-card warning" style={{ padding: '16px' }}>
              <span className="stat-label">Sau thuế</span>
              <span className="stat-val" style={{ fontSize: '22px', color: 'var(--color-warning)' }}>{formatMoney((selectedUser.wallet?.completedCommission || 0) * 0.9)}</span>
            </div>
            <div className="stat-card success" style={{ padding: '16px' }}>
              <span className="stat-label">Thực nhận</span>
              <span className="stat-val" style={{ fontSize: '22px', color: 'var(--color-success)' }}>{formatMoney((selectedUser.wallet?.completedCommission || 0) * 0.9 * 0.8)}</span>
            </div>
            <div className="stat-card warning" style={{ padding: '16px' }}>
              <span className="stat-label">Có thể rút</span>
              <span className="stat-val" style={{ fontSize: '22px', color: 'var(--color-success)' }}>{formatMoney(selectedUser.wallet?.withdrawableCommission)}</span>
            </div>
            <div className="stat-card" style={{ padding: '16px' }}>
              <span className="stat-label">Đã rút</span>
              <span className="stat-val" style={{ fontSize: '22px' }}>{formatMoney(selectedUser.wallet?.receivedCommission)}</span>
            </div>
          </div>

          <h3 style={{ marginBottom: '12px', fontSize: '16px' }}>🛒 Đơn hàng gần đây</h3>
          <div className="table-container" style={{ maxHeight: '240px', overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Mã đơn</th><th>Sản phẩm</th>
                  <th>HH Gốc</th><th title="Sau thuế 10%">Sau thuế</th>
                  <th title="Sau thuế & trừ 20%">Thực nhận</th><th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {orders.filter(o => o.zaloId === selectedUser.zaloId).length === 0 ? (
                  <tr className="empty-row"><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có đơn hàng nào.</td></tr>
                ) : (
                  orders.filter(o => o.zaloId === selectedUser.zaloId).slice(0, 10).map(o => {
                    const isTiktok = o.platform === 'TikTok Shop' || (o.orderId && o.orderId.length > 15 && !o.orderId.startsWith('2608'));
                    const afterTax = isTiktok ? (o.commission || 0) : (o.commission || 0) * 0.9;
                    const afterDeduction = isTiktok ? (o.commission || 0) * 0.8 : afterTax * 0.8;
                    return (
                      <tr key={o.id}>
                        <td data-label="Mã đơn" style={{ fontSize: '11px' }}>{o.orderId}</td>
                        <td data-label="Sản phẩm" style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.productName}</td>
                        <td data-label="HH Gốc" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{formatMoney(o.commission)}</td>
                        <td data-label="Sau thuế" style={{ color: 'var(--color-warning)', fontSize: '12px' }}>{isTiktok ? '-' : formatMoney(afterTax)}</td>
                        <td data-label="Thực nhận" style={{ color: 'var(--color-success)', fontWeight: '700', fontSize: '12px' }}>{formatMoney(afterDeduction)}</td>
                        <td data-label="Trạng thái">
                          <span className={`badge ${o.status === 'Hoàn thành' ? 'badge-completed' : o.status === 'Hủy' ? 'badge-cancelled' : 'badge-pending'}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
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
        <footer className="modal-footer">
          <button className="btn" onClick={onClose}>Đóng lại</button>
        </footer>
      </div>
    </div>
  );
}

export default function UsersTab() {
  const { users, orders } = useApp();
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  const filteredUsers = users.filter(u =>
    u.zaloName?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.zaloId?.includes(userSearch)
  );

  return (
    <>
      <div className="data-card">
        <div className="search-container">
          <input
            type="text"
            className="form-control"
            placeholder="Tìm kiếm thành viên (Tên/Zalo ID)..."
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
          />
        </div>
        <div className="table-container">
          <table style={{ tableLayout: 'fixed', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Tên thành viên</th>
                <th style={{ width: '110px' }}>Zalo ID</th>
                <th style={{ width: '150px' }}>Tài khoản nhận tiền</th>
                <th style={{ width: '95px', textAlign: 'right' }} title="Đơn đang chờ Shopee đối soát">Chờ xử lý</th>
                <th style={{ width: '150px', textAlign: 'right' }}>Tích lũy hoàn thành</th>
                <th style={{ width: '105px', textAlign: 'right' }} title="Số tiền có thể rút ngay">Khả dụng rút</th>
                <th style={{ width: '90px', textAlign: 'right' }}>Đã rút</th>
                <th style={{ width: '70px', textAlign: 'center' }}>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr className="empty-row"><td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Không tìm thấy thành viên phù hợp</td></tr>
              ) : (
                filteredUsers.map(u => {
                  const bankAndAcc = getBankAndAccount(u);
                  return (
                    <tr key={u.zaloId}>
                      <td data-label="Tên thành viên" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <strong title={u.zaloName}>{u.zaloName || 'Vô danh (Chờ đồng bộ)'}</strong>
                      </td>
                      <td data-label="Zalo ID" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <code style={{ color: 'var(--text-muted)', fontSize: '11.5px' }} title={u.zaloId}>{u.zaloId}</code>
                      </td>
                      <td data-label="Tài khoản nhận tiền">
                        <div style={{ fontSize: '13px', fontWeight: '500' }}>{bankAndAcc.bankName || '⚠️ Chưa cập nhật'}</div>
                        {bankAndAcc.accountNumber && <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}><code>{bankAndAcc.accountNumber}</code></div>}
                      </td>
                      <td data-label="Chờ xử lý" style={{ color: 'var(--color-warning)', textAlign: 'right', fontWeight: '500' }}>{formatMoney(u.wallet?.pendingCommission)}</td>
                      <td data-label="Tích lũy hoàn thành" style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Gốc: {formatMoney(u.wallet?.completedCommission)}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--color-warning)', marginTop: '2px' }}>Sau thuế: {formatMoney((u.wallet?.completedCommission || 0) * 0.9)}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--color-success)', marginTop: '2px', fontWeight: '600' }}>Khách: {formatMoney((u.wallet?.completedCommission || 0) * 0.9 * 0.8)}</div>
                      </td>
                      <td data-label="Khả dụng rút" style={{ color: 'var(--color-success)', fontWeight: '700', textAlign: 'right' }}>{formatMoney(u.wallet?.withdrawableCommission)}</td>
                      <td data-label="Đã rút" style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{formatMoney(u.wallet?.receivedCommission)}</td>
                      <td data-label="Chi tiết" style={{ textAlign: 'center' }}>
                        <button className="user-view-btn" onClick={() => setSelectedUser(u)}>
                          <i className="fa-regular fa-eye"></i> Xem
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      <UserDetailModal selectedUser={selectedUser} onClose={() => setSelectedUser(null)} orders={orders} />
    </>
  );
}
