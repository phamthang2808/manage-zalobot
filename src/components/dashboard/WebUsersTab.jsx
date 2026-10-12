import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney, formatDateTime } from '../../utils/formatters';
import WebUserDetailModal from './WebUserDetailModal';
import AdminLinkZaloModal from './AdminLinkZaloModal';

export default function WebUsersTab() {
  const { API_URL_ROOT, showToast } = useApp();
  const [webUsers, setWebUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserForDetail, setSelectedUserForDetail] = useState(null);
  const [selectedUserForLinkZalo, setSelectedUserForLinkZalo] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

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

  const handleChangeRole = async (userId, currentRole) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!window.confirm(`Bạn có chắc chắn muốn đổi quyền thành viên này sang ${newRole}?`)) return;

    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const res = await fetch(`${API_URL_ROOT}/api/admin/web-users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole }),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Đã cập nhật quyền thành công!', 'success');
        fetchWebUsers();
      }
    } catch (err) {
      showToast('Lỗi cập nhật quyền', 'error');
    }
  };

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
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    const matchId = String(u.id || '').includes(q);
    const matchName = String(u.fullName || u.name || '').toLowerCase().includes(q);
    const matchEmail = String(u.email || '').toLowerCase().includes(q);
    const matchPhone = String(u.phone || '').toLowerCase().includes(q);
    const matchZalo = String(u.zaloId || '').toLowerCase().includes(q);
    const matchBank = String(u.accountNumber || '').toLowerCase().includes(q);
    return matchId || matchName || matchEmail || matchPhone || matchZalo || matchBank;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const displayedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const linkedZaloCount = webUsers.filter(u => u.zaloId).length;

  return (
    <div className="web-users-tab-container" style={{ padding: '4px 0' }}>
      {/* Top Banner & Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px',
        marginBottom: '20px'
      }}>
        <div style={{ background: 'var(--bg-card, #fff)', border: '1.5px solid var(--border-color, #e2e8f0)', borderRadius: '16px', padding: '16px 20px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>
            Tổng Tài Khoản Web
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#7c3aed', marginTop: '4px' }}>
            {webUsers.length}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
            Thành viên đăng ký trên Web
          </div>
        </div>

        <div style={{ background: 'var(--bg-card, #fff)', border: '1.5px solid var(--border-color, #e2e8f0)', borderRadius: '16px', padding: '16px 20px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>
            Đã Liên Kết Zalo ID
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#2563eb', marginTop: '4px' }}>
            {linkedZaloCount}
          </div>
          <div style={{ fontSize: '11.5px', color: '#2563eb', fontWeight: '700', marginTop: '2px' }}>
            {(webUsers.length > 0 ? (linkedZaloCount / webUsers.length * 100).toFixed(0) : 0)}% thành viên đã liên kết
          </div>
        </div>

        <div style={{ background: 'var(--bg-card, #fff)', border: '1.5px solid var(--border-color, #e2e8f0)', borderRadius: '16px', padding: '16px 20px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>
            Tổng Số Dư Chờ Rút
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#ea580c', marginTop: '4px' }}>
            {formatMoney(webUsers.reduce((acc, u) => acc + (u.balance || 0), 0))}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
            Tổng số dư khả dụng của thành viên
          </div>
        </div>
      </div>

      {/* Search Toolbar */}
      <div style={{
        background: 'var(--bg-card, #fff)',
        border: '1.5px solid var(--border-color, #e2e8f0)',
        borderRadius: '16px',
        padding: '16px 20px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '260px' }}>
          <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8', fontSize: '13px' }}></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Tìm theo ID, Tên, Email, SĐT, Zalo ID, Số tài khoản..."
            style={{
              width: '100%',
              padding: '9px 12px 9px 34px',
              borderRadius: '10px',
              border: '1.5px solid var(--border-color, #cbd5e1)',
              background: 'var(--bg-main, #f8fafc)',
              color: 'var(--text-bright, #0f172a)',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <button
          type="button"
          onClick={fetchWebUsers}
          style={{
            padding: '9px 16px',
            borderRadius: '10px',
            border: '1px solid var(--border-color, #cbd5e1)',
            background: 'var(--bg-main, #f8fafc)',
            color: 'var(--text-bright, #0f172a)',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <i className="fa-solid fa-rotate-right"></i>
          <span>Làm mới</span>
        </button>
      </div>

      {/* Users Table */}
      <div style={{
        background: 'var(--bg-card, #fff)',
        border: '1.5px solid var(--border-color, #e2e8f0)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
      }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '24px', marginBottom: '8px' }}></i>
            <div>Đang tải danh sách thành viên Web...</div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <p style={{ margin: 0, fontSize: '13.5px' }}>Không tìm thấy thành viên Web nào phù hợp.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-main, #f8fafc)', borderBottom: '1.5px solid var(--border-color, #e2e8f0)' }}>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>ID</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Thành viên</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Zalo ID Liên Kết</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Ngân hàng</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Số dư</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Tổng kiếm</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', textAlign: 'center' }}>Quyền</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', textAlign: 'center' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedUsers.map((u) => {
                    const isAdmin = u.role === 'ADMIN' || u.role === 'SUPER_ADMIN';
                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color, #f1f5f9)' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: '#7c3aed',
                            color: '#fff',
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            fontWeight: '800'
                          }}>
                            #{u.id}
                          </span>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: '800', fontSize: '13.5px', color: 'var(--text-bright, #0f172a)' }}>
                            {u.fullName || u.name || 'Chưa đặt tên'}
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                            {u.email} {u.phone && `• SĐT: ${u.phone}`}
                          </div>
                        </td>

                        {/* Zalo ID badge */}
                        <td style={{ padding: '14px 16px' }}>
                          {u.zaloId ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '3px 10px',
                              borderRadius: '8px',
                              background: '#dbeafe',
                              color: '#1d4ed8',
                              fontSize: '12px',
                              fontFamily: 'monospace',
                              fontWeight: '800',
                              border: '1px solid #bfdbfe'
                            }} title="Đã liên kết Zalo ID">
                              <i className="fa-solid fa-link" style={{ fontSize: '10px' }}></i>
                              {u.zaloId}
                            </span>
                          ) : (
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: '#f1f5f9',
                              color: '#94a3b8',
                              fontSize: '11px',
                              fontWeight: '600'
                            }}>
                              Chưa liên kết
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '14px 16px', fontSize: '12.5px' }}>
                          {u.bankName ? (
                            <div>
                              <div style={{ fontWeight: '700' }}>{u.bankName}</div>
                              <div style={{ fontFamily: 'monospace', color: '#64748b', fontSize: '11.5px' }}>{u.accountNumber}</div>
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>-</span>
                          )}
                        </td>

                        <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '800', color: '#ea580c', fontSize: '13.5px' }}>
                          {formatMoney(u.balance)}
                        </td>

                        <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '800', color: '#059669', fontSize: '13.5px' }}>
                          {formatMoney(u.totalEarned)}
                        </td>

                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '10px',
                            fontSize: '11px',
                            fontWeight: '800',
                            background: isAdmin ? '#faf5ff' : '#f8fafc',
                            color: isAdmin ? '#9333ea' : '#64748b',
                            border: `1px solid ${isAdmin ? '#e9d5ff' : '#e2e8f0'}`
                          }}>
                            {u.role || 'USER'}
                          </span>
                        </td>

                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => setSelectedUserForDetail(u)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                color: '#fff',
                                fontSize: '11.5px',
                                fontWeight: '800',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Xem chi tiết đơn hàng & lịch sử rút"
                            >
                              <i className="fa-solid fa-chart-line"></i>
                              <span>Chi tiết</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedUserForLinkZalo(u)}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '8px',
                                border: '1px solid #bfdbfe',
                                background: '#eff6ff',
                                color: '#1d4ed8',
                                fontSize: '11.5px',
                                fontWeight: '800',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Gán hoặc đổi Zalo ID"
                            >
                              <i className="fa-solid fa-link"></i>
                              <span>Gán Zalo</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleStatus(u.id)}
                              style={{
                                padding: '6px 8px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                background: u.isActive !== false ? '#fff' : '#fee2e2',
                                color: u.isActive !== false ? '#64748b' : '#ef4444',
                                fontSize: '11.5px',
                                cursor: 'pointer'
                              }}
                              title={u.isActive !== false ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                            >
                              <i className={u.isActive !== false ? "fa-solid fa-lock" : "fa-solid fa-lock-open"}></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid var(--border-color, #e2e8f0)', background: 'var(--bg-main, #f8fafc)' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                  Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredUsers.length)} / {filteredUsers.length} thành viên
                </span>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{ padding: '5px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '12px', fontWeight: '700', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                  >
                    Trước
                  </button>
                  <span style={{ fontSize: '12px', fontWeight: '800', padding: '4px 8px' }}>
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    style={{ padding: '5px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '12px', fontWeight: '700', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
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
    </div>
  );
}
