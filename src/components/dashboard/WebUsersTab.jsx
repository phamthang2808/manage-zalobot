import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney } from '../../utils/formatters';
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
  const totalBalance = webUsers.reduce((acc, u) => acc + (u.balance || 0), 0);

  // Helper lấy chữ cái đầu cho Avatar
  const getInitials = (name, email) => {
    const raw = (name || email || 'U').trim();
    if (!raw) return 'U';
    const parts = raw.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return raw.substring(0, 2).toUpperCase();
  };

  return (
    <div className="web-users-tab-container" style={{ padding: '4px 0' }}>
      {/* 3 Metric Cards Hiện Đại Tương Thích Dark/Light Mode */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '22px'
      }}>
        {/* Card 1: Tổng Tài Khoản Web */}
        <div style={{
          background: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border-color, rgba(226, 232, 240, 0.8))',
          borderRadius: '16px',
          padding: '18px 22px',
          boxShadow: '0 4px 16px -2px rgba(0,0,0,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}>
          <div>
            <div style={{
              fontSize: '11px',
              fontWeight: '800',
              color: 'var(--text-muted, #64748b)',
              textTransform: 'uppercase',
              letterSpacing: '0.6px'
            }}>
              Tổng Tài Khoản Web
            </div>
            <div style={{
              fontSize: '26px',
              fontWeight: '900',
              color: 'var(--text-bright, #0f172a)',
              marginTop: '4px',
              lineHeight: 1.2
            }}>
              {webUsers.length}
            </div>
            <div style={{
              fontSize: '12px',
              color: 'var(--text-subtle, #94a3b8)',
              marginTop: '3px'
            }}>
              Thành viên trên cổng Web
            </div>
          </div>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: 'rgba(249, 115, 22, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary, #ea580c)',
            fontSize: '20px',
            flexShrink: 0
          }}>
            <i className="fa-solid fa-users"></i>
          </div>
        </div>

        {/* Card 2: Đã Liên Kết Zalo ID */}
        <div style={{
          background: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border-color, rgba(226, 232, 240, 0.8))',
          borderRadius: '16px',
          padding: '18px 22px',
          boxShadow: '0 4px 16px -2px rgba(0,0,0,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}>
          <div>
            <div style={{
              fontSize: '11px',
              fontWeight: '800',
              color: 'var(--text-muted, #64748b)',
              textTransform: 'uppercase',
              letterSpacing: '0.6px'
            }}>
              Đã Liên Kết Zalo ID
            </div>
            <div style={{
              fontSize: '26px',
              fontWeight: '900',
              color: '#0284c7',
              marginTop: '4px',
              lineHeight: 1.2
            }}>
              {linkedZaloCount}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#0284c7',
              fontWeight: '700',
              marginTop: '3px'
            }}>
              {(webUsers.length > 0 ? (linkedZaloCount / webUsers.length * 100).toFixed(0) : 0)}% thành viên đã liên kết
            </div>
          </div>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: 'rgba(2, 132, 199, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0284c7',
            fontSize: '20px',
            flexShrink: 0
          }}>
            <i className="fa-solid fa-link"></i>
          </div>
        </div>

        {/* Card 3: Tổng Số Dư Chờ Rút */}
        <div style={{
          background: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border-color, rgba(226, 232, 240, 0.8))',
          borderRadius: '16px',
          padding: '18px 22px',
          boxShadow: '0 4px 16px -2px rgba(0,0,0,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}>
          <div>
            <div style={{
              fontSize: '11px',
              fontWeight: '800',
              color: 'var(--text-muted, #64748b)',
              textTransform: 'uppercase',
              letterSpacing: '0.6px'
            }}>
              Tổng Số Dư Chờ Rút
            </div>
            <div style={{
              fontSize: '26px',
              fontWeight: '900',
              color: 'var(--color-primary, #ea580c)',
              marginTop: '4px',
              lineHeight: 1.2
            }}>
              {formatMoney(totalBalance)}
            </div>
            <div style={{
              fontSize: '12px',
              color: 'var(--text-subtle, #94a3b8)',
              marginTop: '3px'
            }}>
              Khả dụng trong ví thành viên
            </div>
          </div>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: 'rgba(249, 115, 22, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary, #ea580c)',
            fontSize: '20px',
            flexShrink: 0
          }}>
            <i className="fa-solid fa-wallet"></i>
          </div>
        </div>
      </div>

      {/* Toolbar Tìm Kiếm Hiện Đại & Đồng Bộ Màu Hệ Thống */}
      <div style={{
        background: 'var(--bg-card, #ffffff)',
        border: '1px solid var(--border-color, rgba(226, 232, 240, 0.8))',
        borderRadius: '16px',
        padding: '14px 18px',
        marginBottom: '18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
      }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '280px' }}>
          <i
            className="fa-solid fa-magnifying-glass"
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-primary, #ea580c)',
              fontSize: '14px'
            }}
          ></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Tìm theo ID, Tên, Email, SĐT, Zalo ID, Ngân hàng..."
            style={{
              width: '100%',
              padding: '10px 14px 10px 38px',
              borderRadius: '12px',
              border: '1px solid var(--border-color, #e2e8f0)',
              background: 'var(--bg-main, #f8fafc)',
              color: 'var(--text-bright, #0f172a)',
              fontSize: '13.5px',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--color-primary, #ea580c)';
              e.target.style.boxShadow = '0 0 0 3px rgba(249, 115, 22, 0.15)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border-color, #e2e8f0)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        <button
          type="button"
          onClick={fetchWebUsers}
          style={{
            padding: '10px 18px',
            borderRadius: '12px',
            border: 'none',
            background: 'rgba(249, 115, 22, 0.1)',
            color: 'var(--color-primary, #ea580c)',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(249, 115, 22, 0.18)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)'; }}
        >
          <i className="fa-solid fa-rotate-right" style={{ color: 'var(--color-primary, #ea580c)' }}></i>
          <span>Làm mới</span>
        </button>
      </div>

      {/* Bảng Danh Sách Thành Viên Web */}
      <div style={{
        background: 'var(--bg-card, #ffffff)',
        border: '1px solid var(--border-color, rgba(226, 232, 240, 0.8))',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)'
      }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '26px', color: 'var(--color-primary, #ea580c)', marginBottom: '10px' }}></i>
            <div style={{ fontWeight: '600', fontSize: '14px' }}>Đang tải danh sách thành viên Web...</div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>
            <i className="fa-solid fa-user-slash" style={{ fontSize: '30px', color: 'var(--text-subtle, #94a3b8)', marginBottom: '10px' }}></i>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>Không tìm thấy thành viên Web nào phù hợp.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '920px' }}>
                <thead>
                  <tr style={{
                    background: 'var(--bg-main, #f8fafc)',
                    borderBottom: '1px solid var(--border-color, rgba(226, 232, 240, 0.8))'
                  }}>
                    <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ID</th>
                    <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Thành viên</th>
                    <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Zalo ID Liên Kết</th>
                    <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ngân hàng</th>
                    <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Số dư</th>
                    <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Tổng kiếm</th>
                    <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>Quyền</th>
                    <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedUsers.map((u) => {
                    const isAdmin = u.role === 'ADMIN' || u.role === 'SUPER_ADMIN';
                    return (
                      <tr
                        key={u.id}
                        style={{
                          borderBottom: '1px solid var(--border-color, rgba(241, 245, 249, 0.8))',
                          transition: 'background 0.15s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover, rgba(249, 115, 22, 0.04))'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        {/* ID: Soft Pill Không Viền */}
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            background: 'rgba(249, 115, 22, 0.12)',
                            color: 'var(--color-primary, #ea580c)',
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            fontWeight: '800',
                            border: 'none'
                          }}>
                            #{u.id}
                          </span>
                        </td>

                        {/* Thông tin Thành viên: Avatar Gradient + Tên + Email */}
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '12px',
                              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '13px',
                              fontWeight: '800',
                              flexShrink: 0,
                              boxShadow: '0 2px 8px rgba(249, 115, 22, 0.25)'
                            }}>
                              {getInitials(u.fullName || u.name, u.email)}
                            </div>
                            <div>
                              <div style={{
                                fontWeight: '800',
                                fontSize: '13.5px',
                                color: 'var(--text-bright, #0f172a)'
                              }}>
                                {u.fullName || u.name || 'Thành viên Web'}
                              </div>
                              <div style={{
                                fontSize: '12px',
                                color: 'var(--text-muted, #64748b)',
                                marginTop: '2px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                flexWrap: 'wrap'
                              }}>
                                <span>{u.email}</span>
                                {u.phone && (
                                  <>
                                    <span style={{ color: 'var(--text-subtle)' }}>•</span>
                                    <span>{u.phone}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Zalo ID badge: Hoàn toàn không viền */}
                        <td style={{ padding: '14px 18px' }}>
                          {u.zaloId ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '5px 12px',
                              borderRadius: '20px',
                              background: 'rgba(2, 132, 199, 0.12)',
                              color: '#0284c7',
                              fontSize: '12px',
                              fontFamily: 'monospace',
                              fontWeight: '800',
                              border: 'none'
                            }} title="Đã liên kết Zalo ID">
                              <i className="fa-solid fa-link" style={{ fontSize: '11px', color: '#0284c7' }}></i>
                              {u.zaloId}
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '5px 12px',
                              borderRadius: '20px',
                              background: 'var(--bg-secondary, rgba(148, 163, 184, 0.12))',
                              color: 'var(--text-subtle, #94a3b8)',
                              fontSize: '11.5px',
                              fontWeight: '600',
                              border: 'none'
                            }}>
                              Chưa liên kết
                            </span>
                          )}
                        </td>

                        {/* Ngân hàng */}
                        <td style={{ padding: '14px 18px', fontSize: '12.5px' }}>
                          {u.bankName ? (
                            <div>
                              <div style={{ fontWeight: '700', color: 'var(--text-bright, #0f172a)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <i className="fa-solid fa-credit-card" style={{ fontSize: '11px', color: 'var(--color-primary, #ea580c)' }}></i>
                                <span>{u.bankName}</span>
                              </div>
                              <div style={{ fontFamily: 'monospace', color: 'var(--text-muted, #64748b)', fontSize: '12px', marginTop: '2px' }}>
                                {u.accountNumber}
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-subtle, #94a3b8)' }}>-</span>
                          )}
                        </td>

                        {/* Số dư khả dụng */}
                        <td style={{
                          padding: '14px 18px',
                          textAlign: 'right',
                          fontWeight: '800',
                          color: 'var(--color-primary, #ea580c)',
                          fontSize: '14px'
                        }}>
                          {formatMoney(u.balance)}
                        </td>

                        {/* Tổng kiếm được */}
                        <td style={{
                          padding: '14px 18px',
                          textAlign: 'right',
                          fontWeight: '800',
                          color: '#10b981',
                          fontSize: '14px'
                        }}>
                          {formatMoney(u.totalEarned)}
                        </td>

                        {/* Quyền: Soft Pill Không Viền */}
                        <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: '800',
                            border: 'none',
                            background: isAdmin ? 'rgba(249, 115, 22, 0.14)' : 'var(--bg-secondary, rgba(148, 163, 184, 0.12))',
                            color: isAdmin ? 'var(--color-primary, #ea580c)' : 'var(--text-muted, #64748b)'
                          }}>
                            {u.role || 'USER'}
                          </span>
                        </td>

                        {/* Hành động: Nút thiết kế mềm mại, không viền cứng */}
                        <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            {/* Nút Xem Chi Tiết */}
                            <button
                              type="button"
                              onClick={() => setSelectedUserForDetail(u)}
                              style={{
                                padding: '7px 12px',
                                borderRadius: '10px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                                color: '#ffffff',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                boxShadow: '0 2px 6px rgba(249, 115, 22, 0.25)',
                                transition: 'all 0.2s ease'
                              }}
                              title="Xem chi tiết đơn hàng & lịch sử rút"
                            >
                              <i className="fa-solid fa-chart-pie" style={{ fontSize: '11px' }}></i>
                              <span>Chi tiết</span>
                            </button>

                            {/* Nút Gán Zalo */}
                            <button
                              type="button"
                              onClick={() => setSelectedUserForLinkZalo(u)}
                              style={{
                                padding: '7px 12px',
                                borderRadius: '10px',
                                border: 'none',
                                background: 'rgba(2, 132, 199, 0.12)',
                                color: '#0284c7',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                transition: 'all 0.2s ease'
                              }}
                              title="Gán hoặc đổi Zalo ID"
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(2, 132, 199, 0.2)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(2, 132, 199, 0.12)'; }}
                            >
                              <i className="fa-solid fa-link" style={{ fontSize: '11px', color: '#0284c7' }}></i>
                              <span>Gán Zalo</span>
                            </button>

                            {/* Nút Khóa / Mở Khóa */}
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(u.id)}
                              style={{
                                padding: '7px 9px',
                                borderRadius: '10px',
                                border: 'none',
                                background: u.isActive !== false ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                                color: u.isActive !== false ? '#ef4444' : '#10b981',
                                fontSize: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
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

            {/* Phân Trang */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                borderTop: '1px solid var(--border-color, rgba(226, 232, 240, 0.8))',
                background: 'var(--bg-main, #f8fafc)'
              }}>
                <span style={{ fontSize: '12.5px', color: 'var(--text-muted, #64748b)', fontWeight: '600' }}>
                  Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredUsers.length)} / {filteredUsers.length} thành viên
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color, #cbd5e1)',
                      background: 'var(--bg-card, #ffffff)',
                      color: 'var(--text-bright, #0f172a)',
                      fontSize: '12.5px',
                      fontWeight: '700',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      opacity: currentPage === 1 ? 0.5 : 1,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Trước
                  </button>
                  <span style={{
                    fontSize: '12.5px',
                    fontWeight: '800',
                    color: 'var(--color-primary, #ea580c)',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    background: 'rgba(249, 115, 22, 0.1)'
                  }}>
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color, #cbd5e1)',
                      background: 'var(--bg-card, #ffffff)',
                      color: 'var(--text-bright, #0f172a)',
                      fontSize: '12.5px',
                      fontWeight: '700',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      opacity: currentPage === totalPages ? 0.5 : 1,
                      transition: 'all 0.2s ease'
                    }}
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
