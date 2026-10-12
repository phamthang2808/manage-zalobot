import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { BANKS } from '../../utils/banks';

export default function AccountView() {
  const { API_URL_ROOT, user, setUser, showToast, handleLogout } = useApp();

  const [fullName, setFullName] = useState(user?.fullName || user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const fileInputRef = useRef(null);

  // Bank states
  const [selectedBank, setSelectedBank] = useState(user?.bankCode || 'MB');
  const [customBankName, setCustomBankName] = useState(user?.bankName || '');
  const [accountNumber, setAccountNumber] = useState(user?.accountNumber || '');
  const [accountName, setAccountName] = useState(user?.accountName || '');
  const [savingBank, setSavingBank] = useState(false);

  // Zalo ID states
  const [zaloIdInput, setZaloIdInput] = useState(user?.zaloId || '');
  const [linkingZalo, setLinkingZalo] = useState(false);

  useEffect(() => {
    if (user?.avatarUrl) setAvatarUrl(user.avatarUrl);
    if (user?.fullName) setFullName(user.fullName);
    if (user?.phone) setPhone(user.phone);
    if (user?.bankCode) setSelectedBank(user.bankCode);
    if (user?.bankName) setCustomBankName(user.bankName);
    if (user?.accountNumber) setAccountNumber(user.accountNumber);
    if (user?.accountName) setAccountName(user.accountName);
    if (user?.zaloId) setZaloIdInput(user.zaloId);
  }, [user]);

  // Clean subId
  const cleanName = (user?.fullName || user?.username || 'user')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9]/g, '');

  const displaySubId = `phamthang_${user?.id || 0}_${cleanName || 'user'}`;

  const handleCopySubId = () => {
    navigator.clipboard.writeText(displaySubId).then(() => {
      showToast(`Đã sao chép SubID: ${displaySubId} 🎉`, 'success');
    }).catch(() => {
      showToast('Không thể sao chép SubID', 'error');
    });
  };

  const handleAvatarFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP)', 'warning');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      showToast('Dung lượng ảnh tối đa 8MB!', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 360;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setAvatarUrl(dataUrl);
        showToast('Đã chọn ảnh đại diện! Nhấn "Lưu Thông Tin Cá Nhân" để lưu lại 🎉', 'info');
      };
      img.src = readerEvent.target.result;
    };
    reader.readAsDataURL(file);
  };

  const formatCardNumber = (num) => {
    if (!num) return '••••  ••••  ••••  ••••';
    const cleaned = String(num).replace(/\s+/g, '');
    return cleaned.match(/.{1,4}/g)?.join('  ') || cleaned;
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const currentName = user?.fullName || fullName || '';
    setSavingProfile(true);
    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const res = await fetch(`${API_URL_ROOT}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: currentName,
          phone: phone.trim(),
          avatarUrl: avatarUrl.trim()
        }),
        credentials: 'include'
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Lỗi cập nhật hồ sơ');

      const savedAvatar = resData?.data?.avatarUrl || avatarUrl;
      const updatedUser = {
        ...user,
        fullName: currentName,
        phone: phone.trim(),
        avatarUrl: savedAvatar
      };
      setUser(updatedUser);
      sessionStorage.setItem('adminUser', JSON.stringify(updatedUser));
      showToast('Đã cập nhật thông tin cá nhân và ảnh đại diện thành công! 🎉', 'success');
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
    <div className="account-view-wrapper" style={{ width: '100%', maxWidth: '820px', margin: '0 auto' }}>
      
      {/* HEADER TIÊU ĐỀ RÕ RÀNG */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '650', color: 'var(--text-bright)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-solid fa-address-card" style={{ color: 'var(--color-primary, #ea580c)' }}></i>
          <span>Thông Tin Cá Nhân & Tài Khoản Của Bạn</span>
        </h1>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
          Quản lý thông tin hồ sơ, số điện thoại, liên kết Zalo ID và tài khoản ngân hàng nhận tiền hoa hồng
        </p>
      </div>

      {/* 1. THẺ ĐỊNH DANH VIP & SUBID TIẾP THỊ */}
      <div className="lookup-card" style={{
        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, var(--bg-card) 100%)',
        border: '1.5px solid rgba(249, 115, 22, 0.35)',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: '20px'
      }}>
        <div style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(249, 115, 22, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div 
              style={{ position: 'relative', cursor: 'pointer' }}
              onClick={() => fileInputRef.current?.click()}
              title="Nhấn để đổi ảnh đại diện"
            >
              {avatarUrl || user?.avatarUrl ? (
                <img
                  src={avatarUrl || user.avatarUrl}
                  alt="Avatar"
                  referrerPolicy="no-referrer"
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid rgba(249, 115, 22, 0.6)',
                    boxShadow: '0 4px 14px rgba(249, 115, 22, 0.3)',
                    display: 'block'
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  boxShadow: '0 6px 16px rgba(249, 115, 22, 0.35)',
                  flexShrink: 0
                }}>
                  <i className="fa-solid fa-crown"></i>
                </div>
              )}
              {/* Badge camera to edit */}
              <div style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: '#ea580c',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                border: '2px solid var(--bg-card)',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
              }}>
                <i className="fa-solid fa-camera"></i>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '650', margin: 0, color: 'var(--text-bright)' }}>
                  {user?.fullName || 'Thành Viên'}
                </h2>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: 'rgba(249, 115, 22, 0.15)',
                  color: 'var(--color-primary, #ea580c)',
                  textTransform: 'uppercase'
                }}>
                  {user?.role || 'MEMBER'}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '3px' }}>
                {user?.email || 'Tài khoản thành viên 28Symues'}
              </div>
            </div>
          </div>

          {/* SubID Copy Box */}
          <div style={{
            background: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div>
              <div style={{ fontSize: '10.5px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                SubID Tiếp Thị
              </div>
              <div style={{ fontSize: '14px', fontWeight: '900', color: 'var(--color-primary, #ea580c)', fontFamily: 'monospace' }}>
                {displaySubId}
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopySubId}
              title="Sao chép SubID"
              style={{
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                border: 'none',
                color: '#fff',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(249, 115, 22, 0.25)',
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <i className="fa-solid fa-copy" style={{ fontSize: '13px' }}></i>
            </button>
          </div>
        </div>
      </div>

      {/* 2. CARD: THÔNG TIN CÁ NHÂN (ĐẶT LÊN ĐẦU ĐỂ DỄ THẤY NHẤT) */}
      <div className="lookup-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'rgba(139, 92, 246, 0.14)',
            color: '#8b5cf6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px'
          }}>
            <i className="fa-solid fa-user-pen"></i>
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: 'var(--text-bright)' }}>
              Thông Tin Hồ Sơ Cá Nhân
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
              Cập nhật ảnh đại diện, họ tên hiển thị và số điện thoại liên lạc của bạn
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile}>
          {/* Avatar Upload / Change Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '12px 16px',
            borderRadius: '14px',
            background: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            marginBottom: '16px',
            flexWrap: 'wrap'
          }}>
            <div style={{ position: 'relative' }}>
              {avatarUrl || user?.avatarUrl ? (
                <img
                  src={avatarUrl || user.avatarUrl}
                  alt="Avatar"
                  referrerPolicy="no-referrer"
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid rgba(249, 115, 22, 0.5)',
                    display: 'block'
                  }}
                />
              ) : (
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: '700'
                }}>
                  {(user?.fullName || 'U').substring(0, 1).toUpperCase()}
                </div>
              )}
            </div>

            <div style={{ flex: 1, minWidth: '180px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-bright)' }}>
                Ảnh đại diện (Avatar)
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {user?.isGoogleLinked ? 'Đã liên kết ảnh Gmail / Google. Bạn có thể chọn ảnh khác bất kỳ lúc nào.' : 'Tải ảnh đại diện từ máy tính hoặc điện thoại của bạn.'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarFile}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="lookup-admin-link"
                style={{ fontSize: '12.5px', padding: '7px 12px', gap: '6px' }}
              >
                <i className="fa-solid fa-camera"></i>
                <span>Tải ảnh mới</span>
              </button>
              {avatarUrl && avatarUrl !== user?.avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl(user?.avatarUrl || '')}
                  className="lookup-admin-link"
                  style={{ fontSize: '12.5px', padding: '7px 12px', color: '#ef4444' }}
                >
                  <i className="fa-solid fa-rotate-left"></i>
                  <span>Hoàn tác</span>
                </button>
              )}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
            <div className="lookup-input-group" style={{ marginBottom: 0 }}>
              <label className="lookup-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Họ và Tên</span>
                <span style={{ fontSize: '11px', color: '#ea580c', fontWeight: '700', textTransform: 'none' }}>
                  🔒 Cố định theo SubID
                </span>
              </label>
              <input
                type="text"
                className="lookup-input"
                value={user?.fullName || fullName || ''}
                disabled
                readOnly
                style={{ opacity: 0.85, cursor: 'not-allowed', background: 'var(--bg-main)', fontWeight: '700' }}
                title="Họ và tên gắn liền với SubID tiếp thị của bạn, không thể tự ý thay đổi."
              />
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', display: 'block', lineHeight: '1.4' }}>
                💡 Họ tên gắn liền với mã SubID tiếp thị để đối soát đơn chuẩn xác, không thể tự ý đổi.
              </span>
            </div>

            <div className="lookup-input-group" style={{ marginBottom: 0 }}>
              <label className="lookup-label">Email Đăng Ký (Không thể đổi)</label>
              <input
                type="text"
                className="lookup-input"
                value={user?.email || ''}
                disabled
                style={{ opacity: 0.7, cursor: 'not-allowed', background: 'var(--bg-main)' }}
              />
            </div>

            <div className="lookup-input-group" style={{ marginBottom: 0 }}>
              <label className="lookup-label">Số Điện Thoại Nhận Thông Báo</label>
              <input
                type="text"
                className="lookup-input"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Nhập số điện thoại..."
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="submit"
              disabled={savingProfile}
              className="lookup-btn"
              style={{ flex: 1, minWidth: '220px' }}
            >
              <i className="fa-solid fa-check"></i>
              <span>{savingProfile ? 'Đang lưu...' : 'Lưu Thông Tin Cá Nhân'}</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="lookup-admin-link"
              style={{
                color: '#dc2626',
                borderColor: 'rgba(220, 38, 38, 0.3)',
                padding: '12px 20px',
                borderRadius: '12px',
                fontSize: '13.5px'
              }}
            >
              <i className="fa-solid fa-right-from-bracket"></i>
              <span>Đăng xuất</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. CARD: LIÊN KẾT ZALO ID */}
      <div className="lookup-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
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
              <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: 'var(--text-bright)' }}>
                Liên Kết Tài Khoản Zalo ID
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Đồng bộ tự động mọi đơn hàng bạn mua qua Zalo Bot về tài khoản Web
              </p>
            </div>
          </div>

          {user?.zaloId ? (
            <span style={{
              padding: '5px 12px',
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
              padding: '5px 12px',
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
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase' }}>
                  Zalo User ID Đang Đồng Bộ:
                </div>
                <div style={{ fontSize: '17px', fontWeight: '900', color: '#0284c7', fontFamily: 'monospace', marginTop: '3px' }}>
                  {user.zaloId}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Toàn bộ đơn hàng mua qua Bot Zalo sẽ tự động cộng dồn hoa hồng vào tài khoản web của bạn.
                </div>
              </div>
              <button
                type="button"
                onClick={handleUnlinkZalo}
                disabled={linkingZalo}
                className="lookup-admin-link"
                style={{ color: '#dc2626', borderColor: 'rgba(220, 38, 38, 0.3)', fontSize: '12.5px', padding: '8px 14px' }}
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
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: '1.4' }}>
                💡 <b>Mẹo tìm Zalo ID:</b> Nhắn tin vào nhóm bot Zalo hoặc gõ lệnh <code>tra cuu</code> trong chat bot Zalo để xem mã Zalo ID của bạn.
              </div>
            </div>

            <button
              type="submit"
              disabled={linkingZalo || !zaloIdInput.trim()}
              className="lookup-btn"
            >
              <i className="fa-solid fa-link"></i>
              <span>{linkingZalo ? 'Đang liên kết...' : 'Xác Nhận Liên Kết Zalo ID'}</span>
            </button>
          </form>
        )}
      </div>

      {/* 4. CARD: TÀI KHOẢN NGÂN HÀNG RÚT TIỀN */}
      <div className="lookup-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.14)',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px'
          }}>
            <i className="fa-solid fa-building-columns"></i>
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: 'var(--text-bright)' }}>
              Tài Khoản Ngân Hàng Rút Tiền
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
              Nhận thanh toán hoa hồng khi bạn gửi yêu cầu rút tiền
            </p>
          </div>
        </div>

        {/* Xem trước Thẻ ATM nếu đã có STK */}
        {/* Luxury ATM Card Live Preview */}
        <div style={{
          maxWidth: '440px',
          margin: '0 auto 20px auto',
          background: 'linear-gradient(135deg, #091322 0%, #0f172a 45%, #1e293b 100%)',
          borderRadius: '18px',
          padding: '22px 24px',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 16px 36px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }}>
          {/* Holographic light spots */}
          <div style={{
            position: 'absolute',
            top: '-35px',
            right: '-35px',
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.22) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-40px',
            left: '-30px',
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(249, 115, 22, 0.18) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          {/* Top card header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255, 255, 255, 0.12)'
              }}>
                <i className="fa-solid fa-building-columns" style={{ color: '#38bdf8', fontSize: '14px' }}></i>
              </div>
              <div style={{ fontSize: '13px', fontWeight: '800', letterSpacing: '0.6px', color: '#f8fafc', textTransform: 'uppercase' }}>
                {selectedBank === 'OTHER'
                  ? (customBankName.trim() || 'NGÂN HÀNG THỤ HƯỞNG')
                  : (BANKS.find(b => b.code === selectedBank)?.name ? `${selectedBank} - ${BANKS.find(b => b.code === selectedBank)?.name}` : (selectedBank || 'NGÂN HÀNG'))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-wifi" style={{ transform: 'rotate(90deg)', color: 'rgba(255, 255, 255, 0.6)', fontSize: '16px' }}></i>
              <span style={{
                fontSize: '9.5px',
                fontWeight: '800',
                letterSpacing: '1px',
                padding: '2px 7px',
                borderRadius: '5px',
                background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(217, 119, 6, 0.25))',
                border: '1px solid rgba(251, 191, 36, 0.4)',
                color: '#fbbf24',
                textTransform: 'uppercase'
              }}>
                PLATINUM
              </span>
            </div>
          </div>

          {/* EMV Gold Chip */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              width: '42px',
              height: '32px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #fef08a 0%, #eab308 50%, #ca8a04 100%)',
              boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid #a16207'
            }}>
              <div style={{ position: 'absolute', top: '15px', left: 0, right: 0, height: '1px', background: '#854d0e' }} />
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: '13px', width: '1px', background: '#854d0e' }} />
              <div style={{ position: 'absolute', top: 0, bottom: 0, right: '13px', width: '1px', background: '#854d0e' }} />
              <div style={{ position: 'absolute', top: '8px', left: '13px', right: '13px', height: '15px', borderRadius: '3px', border: '1px solid #854d0e' }} />
            </div>
          </div>

          {/* Account Number */}
          <div style={{
            fontSize: '19px',
            fontWeight: '700',
            letterSpacing: '3px',
            fontFamily: 'monospace',
            color: '#38bdf8',
            textShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
            marginBottom: '16px',
            wordBreak: 'break-all'
          }}>
            {formatCardNumber(accountNumber || user?.accountNumber)}
          </div>

          {/* Cardholder + Status */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '600' }}>
                CHỦ TÀI KHOẢN
              </div>
              <div style={{ fontSize: '14px', fontWeight: '800', letterSpacing: '1px', color: '#ffffff', textTransform: 'uppercase', marginTop: '2px' }}>
                {accountName || user?.accountName || user?.fullName || 'CHỦ TÀI KHOẢN'}
              </div>
            </div>

            {user?.accountNumber || accountNumber ? (
              <span style={{
                fontSize: '10.5px',
                fontWeight: '700',
                color: '#38bdf8',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '3px 9px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <i className="fa-solid fa-circle-check" style={{ fontSize: '10px' }}></i>
                {user?.accountNumber ? 'ĐÃ THIẾT LẬP' : 'XEM TRƯỚC'}
              </span>
            ) : (
              <span style={{ fontSize: '10.5px', color: '#94a3b8', fontStyle: 'italic' }}>
                Chưa nhập STK
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSaveBank}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
            <div className="lookup-input-group" style={{ marginBottom: 0 }}>
              <label className="lookup-label">Chọn Ngân Hàng</label>
              <select
                className="lookup-input lookup-select"
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
            <i className="fa-solid fa-floppy-disk"></i>
            <span>{savingBank ? 'Đang lưu thông tin...' : 'Lưu Tài Khoản Ngân Hàng'}</span>
          </button>
        </form>
      </div>

    </div>
  );
}
