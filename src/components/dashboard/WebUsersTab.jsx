import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney } from '../../utils/formatters';
import WebUserDetailModal from './WebUserDetailModal';
import AdminLinkZaloModal from './AdminLinkZaloModal';

export default function WebUsersTab() {
  const { API_URL_ROOT, showToast } = useApp();
  const [webUsers, setWebUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserForDetail, setSelectedUserForDetail] = useState(null);
  const [selectedUserForLinkZalo, setSelectedUserForLinkZalo] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const fetchWebUsers = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const res = await fetch(`${API_URL_ROOT}/api/admin/web-users`, {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        setWebUsers(data || []);
      } else {
        showToast(data.message || 'Lỗi tải danh sách thành viên Web', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Không thể tải thành viên Web', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebUsers();
  }, []);

  const handleToggleStatus = async (userId) => {
    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const res = await fetch(`${API_URL_ROOT}/api/admin/web-users/${userId}/toggle-status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Đã cập nhật trạng thái tài khoản!', 'success');
        fetchWebUsers();
      }
    } catch (err) {
      showToast('Lỗi thay đổi trạng thái', 'error');
    }
  };

  const filteredUsers = webUsers.filter((u) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.trim().toLowerCase();
    const matchId = String(u.id || '').includes(q);
    const matchName = String(u.fullName || u.name || '').toLowerCase().includes(q);
    const matchEmail = String(u.email || '').toLowerCase().includes(q);
    const matchPhone = String(u.phone || '').toLowerCase().includes(q);
    const matchZalo = String(u.zaloId || '').toLowerCase().includes(q);
    const matchBank = String(u.accountNumber || '').toLowerCase().includes(q);
    return matchId || matchName || matchEmail || matchPhone || matchZalo || matchBank;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const displayedUsers = filteredUsers.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .users-table-container {
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch !important;
          width: 100% !important;
          display: block !important;
        }
        .users-table-container table,
        .users-table-container table.users-table,
        table.users-table {
          display: table !important;
          min-width: 1050px !important;
          width: 100% !important;
          table-layout: fixed !important;
          border-collapse: collapse !important;
        }
        .users-table-container table thead {
          display: table-header-group !important;
        }
        .users-table-container table thead tr {
          display: table-row !important;
          background: var(--bg-main, #f1f5f9) !important;
        }
        .users-table-container table thead th {
          display: table-cell !important;
          padding: 14px 16px !important;
          white-space: nowrap !important;
          font-weight: 700 !important;
          font-size: 13px !important;
          border-bottom: 2px solid var(--border-color) !important;
        }
        .users-table-container table tbody {
          display: table-row-group !important;
          gap: 0 !important;
        }
        .users-table-container table tbody tr {
          display: table-row !important;
          background: transparent !important;
          border: none !important;
          border-bottom: 1px solid var(--border-color) !important;
          border-radius: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
          margin: 0 !important;
        }
        .users-table-container table tbody tr:hover {
          background: rgba(249, 115, 22, 0.04) !important;
          border-color: var(--border-color) !important;
          box-shadow: none !important;
        }
        .users-table-container table tbody tr td {
          display: table-cell !important;
          padding: 14px 16px !important;
          width: auto !important;
          border-bottom: 1px solid var(--border-color) !important;
          border-top: none !important;
          box-shadow: none !important;
          font-size: 13px !important;
          vertical-align: middle !important;
        }
        .users-table-container table tbody tr td::before {
          display: none !important;
          content: none !important;
        }
        .users-table-container table tbody tr td[data-label="Tên thành viên"] {
          font-size: 13px !important;
          font-weight: normal !important;
          border-bottom: 1px solid var(--border-color) !important;
          padding: 14px 16px !important;
        }
        html[data-theme="dark"] .users-table-container table tbody tr,
        html.dark .users-table-container table tbody tr,
        body.dark .users-table-container table tbody tr {
          background: transparent !important;
          border: none !important;
          border-radius: 0 !important;
          box-shadow: none !important;
        }
        html[data-theme="dark"] .users-table-container table tbody tr td,
        html.dark .users-table-container table tbody tr td,
        body.dark .users-table-container table tbody tr td {
          background: transparent !important;
          border-top: none !important;
          border-left: none !important;
          border-right: none !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
          box-shadow: none !important;
        }
        html[data-theme="dark"] .users-table-container table tbody tr:hover,
        html.dark .users-table-container table tbody tr:hover,
        body.dark .users-table-container table tbody tr:hover {
          background: rgba(255, 255, 255, 0.03) !important;
        }
        html[data-theme="dark"] .users-table-container table thead th,
        html.dark .users-table-container table thead th,
        body.dark .users-table-container table thead th {
          background: #0f172a !important;
          color: #94a3b8 !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
        }
      `}} />

      <div className="data-card">
        <div className="search-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Tìm kiếm tài khoản Web (Tên/Email/SĐT/Zalo ID)..."
            value={userSearch}
            onChange={e => { setUserSearch(e.target.value); setCurrentPage(1); }}
            style={{ flex: 1 }}
          />

          <button
            type="button"
            className="btn btn-refresh"
            onClick={fetchWebUsers}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <i className="fa-solid fa-rotate-right"></i> Làm mới
          </button>
        </div>

        <div className="table-container users-table-container" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="users-table" style={{ tableLayout: 'fixed', width: '100%', minWidth: '1050px' }}>
            <thead>
              <tr>
                <th style={{ width: '180px' }}>Tên thành viên</th>
                <th style={{ width: '160px' }}>Zalo ID</th>
                <th style={{ width: '185px' }}>Tài khoản nhận tiền</th>
                <th style={{ width: '110px', textAlign: 'right' }} title="Đơn đang chờ đối soát">Chờ xử lý</th>
                <th style={{ width: '135px', textAlign: 'right' }}>Tổng đơn hàng</th>
                <th style={{ width: '130px', textAlign: 'right' }} title="Số tiền có thể rút ngay">Khả dụng rút</th>
                <th style={{ width: '105px', textAlign: 'right' }}>Đã rút</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="empty-row">
                  <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '36px 16px' }}>
                    <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i> Đang tải danh sách tài khoản Web...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr className="empty-row">
                  <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '36px 16px' }}>
                    Không tìm thấy tài khoản Web nào phù hợp
                  </td>
                </tr>
              ) : (
                displayedUsers.map(u => {
                  return (
                    <tr key={u.id}>
                      <td data-label="Tên thành viên" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <strong title={u.fullName || u.name || 'Thành viên Web'} style={{ fontSize: '13.5px' }}>
                          {u.fullName || u.name || 'Thành viên Web'}
                        </strong>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748b)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={u.email}>
                          {u.email}
                        </div>
                        {u.phone && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>
                            {u.phone}
                          </div>
                        )}
                      </td>

                      <td data-label="Zalo ID">
                        {u.zaloId ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '3px' }}>
                            <code style={{ color: 'var(--text-muted)', fontSize: '12px' }} title={u.zaloId}>
                              {u.zaloId}
                            </code>
                            <button
                              type="button"
                              onClick={() => setSelectedUserForLinkZalo(u)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#0284c7',
                                fontSize: '11px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                padding: 0,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                              title="Đổi Zalo ID"
                            >
                              <i className="fa-solid fa-link" style={{ fontSize: '10px' }}></i> Đổi Zalo
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedUserForLinkZalo(u)}
                            style={{
                              background: 'rgba(2, 132, 199, 0.08)',
                              border: '1px solid rgba(2, 132, 199, 0.25)',
                              color: '#0284c7',
                              borderRadius: '6px',
                              padding: '2.5px 8px',
                              fontSize: '11px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <i className="fa-solid fa-link" style={{ fontSize: '10px' }}></i> Gán Zalo
                          </button>
                        )}
                      </td>

                      <td data-label="Tài khoản nhận tiền" style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: u.bankName ? 'var(--text-bright)' : '#eab308' }}>
                          {u.bankName || '⚠️ Chưa cập nhật'}
                        </div>
                        {u.accountNumber && (
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'monospace' }}>
                            <code>{u.accountNumber}</code>
                          </div>
                        )}
                      </td>

                      <td data-label="Chờ xử lý" style={{ color: 'var(--color-warning)', textAlign: 'right', fontWeight: '500' }}>
                        {formatMoney(u.pendingCommission || 0)}
                      </td>

                      <td data-label="Tổng đơn hàng" style={{ textAlign: 'right', fontWeight: '700', color: 'var(--color-primary, #ea580c)' }}>
                        {formatMoney(u.totalEarned || 0)}
                      </td>

                      <td data-label="Khả dụng rút" style={{ color: '#10b981', fontWeight: '700', textAlign: 'right', background: 'transparent' }}>
                        {formatMoney(u.balance || 0)}
                      </td>

                      <td data-label="Đã rút" style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                        {formatMoney(u.withdrawnAmount || 0)}
                      </td>

                      <td data-label="Chi tiết" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            className="user-view-btn"
                            onClick={() => setSelectedUserForDetail(u)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ea580c',
                              fontWeight: '700',
                              fontSize: '13px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: 0
                            }}
                          >
                            <i className="fa-regular fa-eye"></i> Xem
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: u.isActive !== false ? '#ef4444' : '#10b981',
                              cursor: 'pointer',
                              padding: '0 2px',
                              fontSize: '12px'
                            }}
                            title={u.isActive !== false ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                          >
                            <i className={u.isActive !== false ? "fa-solid fa-lock" : "fa-solid fa-lock-open"}></i>
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

        {/* Thanh Phân Trang */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            borderTop: '1px solid var(--border-color)',
            flexWrap: 'wrap',
            gap: '10px',
            fontSize: '13px',
            color: 'var(--text-muted)'
          }}>
            <div>
              Hiển thị <strong>{(safePage - 1) * itemsPerPage + 1}</strong> - <strong>{Math.min(safePage * itemsPerPage, filteredUsers.length)}</strong> trên tổng số <strong>{filteredUsers.length}</strong> tài khoản
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                className="btn"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                style={{ padding: '5px 12px', fontSize: '12px', opacity: safePage <= 1 ? 0.5 : 1, cursor: safePage <= 1 ? 'not-allowed' : 'pointer' }}
              >
                <i className="fa-solid fa-chevron-left" style={{ marginRight: '4px' }}></i> Trước
              </button>

              <span style={{
                fontSize: '12px',
                fontWeight: '700',
                color: 'var(--color-primary, #ea580c)',
                padding: '4px 10px',
                borderRadius: '8px',
                background: 'rgba(249, 115, 22, 0.1)'
              }}>
                Trang {safePage} / {totalPages}
              </span>

              <button
                type="button"
                className="btn"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                style={{ padding: '5px 12px', fontSize: '12px', opacity: safePage >= totalPages ? 0.5 : 1, cursor: safePage >= totalPages ? 'not-allowed' : 'pointer' }}
              >
                Sau <i className="fa-solid fa-chevron-right" style={{ marginLeft: '4px' }}></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedUserForDetail && (
        <WebUserDetailModal
          user={selectedUserForDetail}
          onClose={() => setSelectedUserForDetail(null)}
          API_URL_ROOT={API_URL_ROOT}
        />
      )}

      {selectedUserForLinkZalo && (
        <AdminLinkZaloModal
          user={selectedUserForLinkZalo}
          onClose={() => setSelectedUserForLinkZalo(null)}
          onSave={() => { setSelectedUserForLinkZalo(null); fetchWebUsers(); }}
          API_URL_ROOT={API_URL_ROOT}
          showToast={showToast}
        />
      )}
    </>
  );
}
