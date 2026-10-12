import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BANKS } from '../../utils/banks';

export default function AccountView() {
  const { API_URL_ROOT, user, setUser, showToast, handleLogout } = useApp();

  const [fullName, setFullName] = useState(user?.fullName || user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Bank states
  const [selectedBank, setSelectedBank] = useState(user?.bankCode || 'MB');
  const [customBankName, setCustomBankName] = useState(user?.bankName || '');
  const [accountNumber, setAccountNumber] = useState(user?.accountNumber || '');
  const [accountName, setAccountName] = useState(user?.accountName || '');
  const [savingBank, setSavingBank] = useState(false);

  // Zalo ID states
  const [zaloIdInput, setZaloIdInput] = useState(user?.zaloId || '');
  const [linkingZalo, setLinkingZalo] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast('Vui lòng nhập họ và tên!', 'warning');
      return;
    }

    setSavingProfile(true);
    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const res = await fetch(`${API_URL_ROOT}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fullName: fullName.trim(), phone: phone.trim() }),
        credentials: 'include'
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Lỗi cập nhật hồ sơ');

      const updatedUser = { ...user, fullName: fullName.trim(), phone: phone.trim() };
      setUser(updatedUser);
      sessionStorage.setItem('adminUser', JSON.stringify(updatedUser));
      showToast('Đã cập nhật thông tin cá nhân thành công! 🎉', 'success');
    } catch (err) {
      showToast(err.message || 'Lỗi cập nhật thông tin', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveBank = async (e) => {
    e.preventDefault();
    if (!accountNumber.trim()) {
      showToast('Vui lòng nhập số tài khoản ngân hàng!', 'warning');
      return;
    }
    if (!accountName.trim()) {
      showToast('Vui lòng nhập tên chủ tài khoản!', 'warning');
      return;
    }

    const bankObj = BANKS.find(b => b.code === selectedBank);
    const bankName = selectedBank === 'OTHER' ? customBankName.trim() : (bankObj?.name || selectedBank);

    setSavingBank(true);
    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const res = await fetch(`${API_URL_ROOT}/api/user/bank`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bankCode: selectedBank,
          bankName: bankName,
          accountNumber: accountNumber.trim(),
          accountName: accountName.trim().toUpperCase()
        }),
        credentials: 'include'
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Lỗi lưu thông tin ngân hàng');

      const updatedUser = {
        ...user,
        bankCode: selectedBank,
        bankName: bankName,
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim().toUpperCase()
      };
      setUser(updatedUser);
      sessionStorage.setItem('adminUser', JSON.stringify(updatedUser));
      showToast(resData.message || 'Đã lưu thông tin tài khoản ngân hàng thành công! 🎉', 'success');
    } catch (err) {
      showToast(err.message || 'Lỗi lưu tài khoản ngân hàng', 'error');
    } finally {
      setSavingBank(false);
    }
  };

  const handleLinkZalo = async (e) => {
    e.preventDefault();
    if (!zaloIdInput.trim()) {
      showToast('Vui lòng nhập Zalo User ID!', 'warning');
      return;
    }

    setLinkingZalo(true);
    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const res = await fetch(`${API_URL_ROOT}/api/user/link-zalo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ zaloId: zaloIdInput.trim() }),
        credentials: 'include'
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Lỗi liên kết Zalo ID');

      const updatedUser = { ...user, zaloId: zaloIdInput.trim() };
      setUser(updatedUser);
      sessionStorage.setItem('adminUser', JSON.stringify(updatedUser));
      showToast(resData.message || `Đã liên kết Zalo ID: ${zaloIdInput.trim()} thành công! 🎉`, 'success');
    } catch (err) {
      showToast(err.message || 'Lỗi liên kết Zalo ID', 'error');
    } finally {
      setLinkingZalo(false);
    }
  };

  const handleUnlinkZalo = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy liên kết Zalo ID này không?')) return;

    setLinkingZalo(true);
    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const res = await fetch(`${API_URL_ROOT}/api/user/link-zalo`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include'
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Lỗi hủy liên kết');

      const updatedUser = { ...user, zaloId: null };
      setUser(updatedUser);
      setZaloIdInput('');
      sessionStorage.setItem('adminUser', JSON.stringify(updatedUser));
      showToast('Đã hủy liên kết Zalo ID thành công!', 'success');
    } catch (err) {
      showToast(err.message || 'Lỗi hủy liên kết Zalo ID', 'error');
    } finally {
      setLinkingZalo(false);
    }
  };

  return (
    <div className="account-view-container" style={{ maxWidth: '850px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 6px 0', color: 'var(--text-bright, #0f172a)' }}>
          👤 Cài Đặt Tài Khoản & Thông Tin Cá Nhân
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted, #64748b)' }}>
          Quản lý hồ sơ, tài khoản ngân hàng nhận tiền hoa hồng và liên kết định danh Zalo ID của bạn.
        </p>
      </div>

      {/* CARD 1: LIÊN KẾT ZALO ID (FEATURE TRỌNG TÂM) */}
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        border: user?.zaloId ? '2px solid #22c55e' : '2px solid #3b82f6',
        borderRadius: '18px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: user?.zaloId ? '#dcfce7' : '#dbeafe',
              color: user?.zaloId ? '#15803d' : '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px'
            }}>
              <i className="fa-solid fa-link"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: 'var(--text-bright, #0f172a)' }}>
                Liên Kết Tài Khoản Zalo ID
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
                Đồng bộ tự động mọi đơn hàng bạn mua qua Zalo Bot về tài khoản Web
              </p>
            </div>
          </div>

          {user?.zaloId && (
            <span style={{
              padding: '4px 12px',
              borderRadius: '20px',
              background: '#dcfce7',
              color: '#15803d',
              fontSize: '11.5px',
              fontWeight: '800',
              border: '1px solid #bbf7d0',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <i className="fa-solid fa-circle-check"></i> Đang liên kết
            </span>
          )}
        </div>

        {user?.zaloId ? (
          <div>
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#166534', marginBottom: '4px' }}>
                ZALO USER ID ĐANG LIÊN KẾT:
              </div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#15803d', fontFamily: 'monospace' }}>
                {user.zaloId}
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '12.5px', color: '#166534' }}>
                ✓ Đơn hàng của bạn bên Zalo Bot và Web đã được hợp nhất trong mục <b>Đơn hàng</b>. Bạn có thể xem cả đơn gắn nhãn <b>[Web]</b> và <b>[Zalo]</b> cùng lúc!
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={handleUnlinkZalo}
                disabled={linkingZalo}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  border: '1px solid #fecdd3',
                  background: '#fff1f2',
                  color: '#e11d48',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Hủy liên kết Zalo ID
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleLinkZalo}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-bright, #0f172a)', marginBottom: '6px' }}>
                Nhập Zalo User ID của bạn:
              </label>
              <input
                type="text"
                value={zaloIdInput}
                onChange={(e) => setZaloIdInput(e.target.value)}
                placeholder="Ví dụ: 5128074989288259190..."
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '12px',
                  border: '1.5px solid var(--border-color, #cbd5e1)',
                  background: 'var(--bg-main, #f8fafc)',
                  color: 'var(--text-bright, #0f172a)',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  fontWeight: '700',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{
              background: '#eff6ff',
              borderRadius: '10px',
              padding: '10px 14px',
              marginBottom: '16px',
              fontSize: '12px',
              color: '#1e40af',
              lineHeight: '1.5'
            }}>
              💡 <b>Cách lấy Zalo ID:</b> Nhắn tin vào nhóm hoặc chat riêng với Bot Zalo, gõ lệnh <code>/me</code> hoặc <code>#id</code>. Bot sẽ trả về Zalo ID của bạn, hãy copy và dán vào ô trên.
            </div>

            <button
              type="submit"
              disabled={linkingZalo || !zaloIdInput.trim()}
              style={{
                padding: '11px 24px',
                borderRadius: '12px',
                border: 'none',
                background: linkingZalo || !zaloIdInput.trim() ? '#94a3b8' : '#2563eb',
                color: '#fff',
                fontSize: '13.5px',
                fontWeight: '800',
                cursor: linkingZalo || !zaloIdInput.trim() ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
              }}
            >
              {linkingZalo ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>Đang kết nối...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-link"></i>
                  <span>Xác Nhận Liên Kết Zalo ID</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* CARD 2: THÔNG TIN CÁ NHÂN */}
      <div style={{
        background: 'var(--bg-card, #fff)',
        border: '1.5px solid var(--border-color, #e2e8f0)',
        borderRadius: '18px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 16px 0', color: 'var(--text-bright, #0f172a)' }}>
          👤 Thông Tin Cá Nhân
        </h2>

        <form onSubmit={handleSaveProfile}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: 'var(--text-muted, #64748b)', marginBottom: '6px' }}>
                Họ và Tên:
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid var(--border-color, #cbd5e1)',
                  background: 'var(--bg-main, #f8fafc)',
                  color: 'var(--text-bright, #0f172a)',
                  fontSize: '13.5px',
                  fontWeight: '600',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: 'var(--text-muted, #64748b)', marginBottom: '6px' }}>
                Số Điện Thoại:
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0987xxxxxx"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid var(--border-color, #cbd5e1)',
                  background: 'var(--bg-main, #f8fafc)',
                  color: 'var(--text-bright, #0f172a)',
                  fontSize: '13.5px',
                  fontWeight: '600',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: 'var(--text-muted, #64748b)', marginBottom: '6px' }}>
                Email đăng nhập:
              </label>
              <input
                type="text"
                disabled
                value={user?.email || ''}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  background: 'var(--bg-main, #f1f5f9)',
                  color: 'var(--text-muted, #64748b)',
                  fontSize: '13.5px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            style={{
              padding: '10px 22px',
              borderRadius: '10px',
              border: 'none',
              background: '#ea580c',
              color: '#fff',
              fontSize: '13px',
              fontWeight: '800',
              cursor: 'pointer'
            }}
          >
            {savingProfile ? 'Đang lưu...' : 'Lưu Thay Đổi'}
          </button>
        </form>
      </div>

      {/* CARD 3: THÔNG TIN NGÂN HÀNG */}
      <div style={{
        background: 'var(--bg-card, #fff)',
        border: '1.5px solid var(--border-color, #e2e8f0)',
        borderRadius: '18px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 16px 0', color: 'var(--text-bright, #0f172a)' }}>
          🏦 Tài Khoản Ngân Hàng Nhận Tiền
        </h2>

        <form onSubmit={handleSaveBank}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: 'var(--text-muted, #64748b)', marginBottom: '6px' }}>
                Chọn Ngân Hàng:
              </label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid var(--border-color, #cbd5e1)',
                  background: 'var(--bg-main, #f8fafc)',
                  color: 'var(--text-bright, #0f172a)',
                  fontSize: '13px',
                  fontWeight: '700',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                {BANKS.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            {selectedBank === 'OTHER' && (
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: 'var(--text-muted, #64748b)', marginBottom: '6px' }}>
                  Tên Ngân Hàng Khác:
                </label>
                <input
                  type="text"
                  value={customBankName}
                  onChange={(e) => setCustomBankName(e.target.value)}
                  placeholder="Nhập tên ngân hàng..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
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
            )}

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: 'var(--text-muted, #64748b)', marginBottom: '6px' }}>
                Số Tài Khoản:
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="0123456789..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid var(--border-color, #cbd5e1)',
                  background: 'var(--bg-main, #f8fafc)',
                  color: 'var(--text-bright, #0f172a)',
                  fontSize: '13.5px',
                  fontFamily: 'monospace',
                  fontWeight: '700',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: 'var(--text-muted, #64748b)', marginBottom: '6px' }}>
                Tên Chủ Tài Khoản (In hoa không dấu):
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                placeholder="NGUYEN VAN A"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid var(--border-color, #cbd5e1)',
                  background: 'var(--bg-main, #f8fafc)',
                  color: 'var(--text-bright, #0f172a)',
                  fontSize: '13.5px',
                  fontWeight: '800',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingBank}
            style={{
              padding: '10px 22px',
              borderRadius: '10px',
              border: 'none',
              background: '#059669',
              color: '#fff',
              fontSize: '13px',
              fontWeight: '800',
              cursor: 'pointer'
            }}
          >
            {savingBank ? 'Đang lưu...' : 'Lưu Tài Khoản Ngân Hàng'}
          </button>
        </form>
      </div>

      {/* Logout button */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          type="button"
          onClick={handleLogout}
          style={{
            padding: '10px 24px',
            borderRadius: '10px',
            border: '1px solid var(--border-color, #cbd5e1)',
            background: 'transparent',
            color: '#e11d48',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          <i className="fa-solid fa-arrow-right-from-bracket" style={{ marginRight: '6px' }}></i>
          Đăng xuất tài khoản
        </button>
      </div>
    </div>
  );
}
