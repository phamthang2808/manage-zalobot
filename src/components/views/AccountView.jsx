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

  // Clean subId
  const cleanName = (user?.fullName || user?.username || 'user')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9]/g, '');

  const displaySubId = `phamthang_${user?.id || 0}_${cleanName || 'user'}`;

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
    const bName = selectedBank === 'OTHER' ? customBankName.trim() : (bankObj?.name || selectedBank);

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
          bankName: bName,
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
        bankName: bName,
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim().toUpperCase()
      };
      setUser(updatedUser);
      sessionStorage.setItem('adminUser', JSON.stringify(updatedUser));
      showToast('Đã lưu thông tin tài khoản ngân hàng thành công! 🎉', 'success');
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
    <div className="account-view-wrapper" style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
      {/* CARD 1: LIÊN KẾT ZALO ID CHUẨN GIAO DIỆN ORDERLOOKUPVIEW */}
      <div className="lookup-card" style={{ marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: user?.zaloId ? 'rgba(16, 185, 129, 0.14)' : 'rgba(37, 99, 235, 0.14)',
              color: user?.zaloId ? '#10b981' : '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px'
            }}>
              <i className="fa-solid fa-link"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: 'var(--text-bright)' }}>
                Liên Kết Tài Khoản Zalo ID
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                Đồng bộ tự động mọi đơn hàng bạn mua qua Zalo Bot về tài khoản Web
              </p>
            </div>
          </div>

          {user?.zaloId ? (
            <span style={{
              padding: '4px 12px',
              borderRadius: '20px',
              background: 'rgba(16, 185, 129, 0.14)',
              color: '#10b981',
              fontSize: '12px',
              fontWeight: '800',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <i className="fa-solid fa-circle-check"></i>
              Đã liên kết
            </span>
          ) : (
            <span style={{
              padding: '4px 12px',
              borderRadius: '20px',
              background: 'rgba(234, 88, 12, 0.14)',
              color: 'var(--color-primary, #ea580c)',
              fontSize: '12px',
              fontWeight: '800'
            }}>
              Chưa liên kết
            </span>
          )}
        </div>

        {user?.zaloId ? (
          <div>
            <div style={{
              background: 'var(--bg-main)',
              borderRadius: '12px',
              padding: '14px 16px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase' }}>
                  Zalo ID Đang Đồng Bộ:
                </div>
                <div style={{ fontSize: '16px', fontWeight: '900', color: '#0284c7', fontFamily: 'monospace', marginTop: '2px' }}>
                  {user.zaloId}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-subtle)', marginTop: '4px' }}>
                  Đơn hàng đặt qua bot Zalo của ID này sẽ được gộp vào danh sách đơn và ví tiền của bạn.
                </div>
              </div>
              <button
                type="button"
                onClick={handleUnlinkZalo}
                disabled={linkingZalo}
                className="lookup-admin-link"
                style={{ color: '#dc2626', borderColor: 'rgba(220, 38, 38, 0.3)', fontSize: '12px' }}
              >
                <i className="fa-solid fa-unlink"></i>
                <span>Hủy liên kết</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleLinkZalo}>
            <div className="lookup-input-group" style={{ marginBottom: '14px' }}>
              <label className="lookup-label">Nhập Zalo User ID Của Bạn:</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  className="lookup-input"
                  placeholder="VD: 123456789012345678"
                  value={zaloIdInput}
                  onChange={e => setZaloIdInput(e.target.value)}
                  style={{ fontFamily: 'monospace', fontWeight: '700' }}
                />
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                💡 <b>Mẹo tìm Zalo ID:</b> Nhắn tin vào nhóm bot Zalo hoặc gõ lệnh <code>tra cuu</code> trong chat bot Zalo để xem mã Zalo ID của bạn.
              </div>
            </div>

            <button
              type="submit"
              disabled={linkingZalo || !zaloIdInput.trim()}
              className="lookup-btn"
            >
              {linkingZalo ? 'Đang liên kết...' : 'Xác Nhận Liên Kết Zalo ID'}
            </button>
          </form>
        )}
      </div>

      {/* CARD 2: TÀI KHOẢN NGÂN HÀNG NHẬN TIỀN */}
      <div className="lookup-card" style={{ marginBottom: '22px' }}>
        <h3 className="stats-section-title" style={{ margin: 0, marginBottom: '6px' }}>
          🏦 Tài Khoản Ngân Hàng Rút Tiền
        </h3>
        <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
          Dùng để nhận tiền thanh toán hoa hồng khi bạn tạo lệnh rút tiền.
        </p>

        <form onSubmit={handleSaveBank}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '14px' }}>
            <div className="lookup-input-group" style={{ marginBottom: 0 }}>
              <label className="lookup-label">Ngân Hàng</label>
              <select
                className="lookup-input"
                value={selectedBank}
                onChange={e => setSelectedBank(e.target.value)}
                style={{ fontWeight: '700' }}
              >
                {BANKS.map(b => (
                  <option key={b.code} value={b.code}>
                    {b.code} - {b.name}
                  </option>
                ))}
                <option value="OTHER">Ngân hàng khác...</option>
              </select>
            </div>

            {selectedBank === 'OTHER' && (
              <div className="lookup-input-group" style={{ marginBottom: 0 }}>
                <label className="lookup-label">Tên Ngân Hàng Khác</label>
                <input
                  type="text"
                  className="lookup-input"
                  placeholder="Nhập tên ngân hàng..."
                  value={customBankName}
                  onChange={e => setCustomBankName(e.target.value)}
                />
              </div>
            )}

            <div className="lookup-input-group" style={{ marginBottom: 0 }}>
              <label className="lookup-label">Số Tài Khoản</label>
              <input
                type="text"
                className="lookup-input"
                placeholder="Nhập số tài khoản..."
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)}
                style={{ fontFamily: 'monospace', fontWeight: '700' }}
              />
            </div>

            <div className="lookup-input-group" style={{ marginBottom: 0 }}>
              <label className="lookup-label">Tên Chủ Tài Khoản (Không dấu)</label>
              <input
                type="text"
                className="lookup-input"
                placeholder="VD: PHAM VAN THANG"
                value={accountName}
                onChange={e => setAccountName(e.target.value.toUpperCase())}
                style={{ fontWeight: '700' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingBank}
            className="lookup-btn"
          >
            {savingBank ? 'Đang lưu...' : 'Lưu Tài Khoản Ngân Hàng'}
          </button>
        </form>
      </div>

      {/* CARD 3: THÔNG TIN CÁ NHÂN & ĐỊNH DANH */}
      <div className="lookup-card" style={{ marginBottom: '22px' }}>
        <h3 className="stats-section-title" style={{ margin: 0, marginBottom: '6px' }}>
          👤 Thông Tin Cá Nhân
        </h3>
        <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
          Mã định danh SubID tiếp thị của bạn: <strong style={{ color: 'var(--color-primary, #ea580c)', fontFamily: 'monospace' }}>{displaySubId}</strong>
        </p>

        <form onSubmit={handleSaveProfile}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '14px' }}>
            <div className="lookup-input-group" style={{ marginBottom: 0 }}>
              <label className="lookup-label">Họ và Tên</label>
              <input
                type="text"
                className="lookup-input"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Nhập họ và tên..."
              />
            </div>

            <div className="lookup-input-group" style={{ marginBottom: 0 }}>
              <label className="lookup-label">Email Đăng Ký</label>
              <input
                type="text"
                className="lookup-input"
                value={user?.email || ''}
                disabled
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
              />
            </div>

            <div className="lookup-input-group" style={{ marginBottom: 0 }}>
              <label className="lookup-label">Số Điện Thoại</label>
              <input
                type="text"
                className="lookup-input"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Nhập số điện thoại..."
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <button
              type="submit"
              disabled={savingProfile}
              className="lookup-btn"
              style={{ flex: 1 }}
            >
              {savingProfile ? 'Đang lưu...' : 'Cập Nhật Thông Tin Cá Nhân'}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="lookup-admin-link"
              style={{ color: '#dc2626', borderColor: 'rgba(220, 38, 38, 0.3)', padding: '11px 18px' }}
            >
              <i className="fa-solid fa-right-from-bracket"></i>
              <span>Đăng xuất</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
