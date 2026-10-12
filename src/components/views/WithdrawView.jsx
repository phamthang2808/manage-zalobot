import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney, formatDateTime } from '../../utils/formatters';
import { BANKS } from '../../utils/banks';

export default function WithdrawView() {
  const { API_URL_ROOT, user, setUser, showToast, setView } = useApp();
  const [wallet, setWallet] = useState({ balance: 0, totalEarned: 0, received: 0, pending: 0, completed: 0 });
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form rút tiền state
  const [amountInput, setAmountInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Bank Info State
  const [selectedBank, setSelectedBank] = useState(user?.bankCode || 'MB');
  const [bankName, setBankName] = useState(user?.bankName || '');
  const [accountNumber, setAccountNumber] = useState(user?.accountNumber || '');
  const [accountName, setAccountName] = useState(user?.accountName || user?.fullName || '');
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [savingBank, setSavingBank] = useState(false);

  const fetchWalletAndPayouts = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const [resWallet, resPayouts] = await Promise.all([
        fetch(`${API_URL_ROOT}/api/user/wallet`, { headers: { 'Authorization': `Bearer ${token}` }, credentials: 'include' }),
        fetch(`${API_URL_ROOT}/api/user/payouts`, { headers: { 'Authorization': `Bearer ${token}` }, credentials: 'include' })
      ]);

      const dataWallet = await resWallet.json();
      const dataPayouts = await resPayouts.json();

      if (resWallet.ok && dataWallet.data) {
        setWallet(dataWallet.data);
      }
      if (resPayouts.ok && dataPayouts.data) {
        setPayouts(dataPayouts.data || []);
      }
    } catch (err) {
      showToast('Lỗi khi tải thông tin ví: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletAndPayouts();
  }, []);

  useEffect(() => {
    if (user) {
      setSelectedBank(user.bankCode || 'MB');
      setBankName(user.bankName || '');
      setAccountNumber(user.accountNumber || '');
      setAccountName(user.accountName || user.fullName || '');
    }
  }, [user]);

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
    const bName = selectedBank === 'OTHER' ? bankName.trim() : (bankObj?.name || selectedBank);

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
      const data = await res.json();
      if (res.ok) {
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
        setIsEditingBank(false);
      } else {
        showToast(data.message || 'Lỗi cập nhật ngân hàng', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Lỗi server khi lưu ngân hàng', 'error');
    } finally {
      setSavingBank(false);
    }
  };

  const handleQuickAddAmount = (addValue) => {
    const current = parseFloat((amountInput || '0').replace(/[^\d]/g, '')) || 0;
    const max = wallet.balance || 0;
    const target = Math.min(max, current + addValue);
    setAmountInput(new Intl.NumberFormat('vi-VN').format(target));
  };

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    const cleanAmount = parseFloat(amountInput.replace(/[^\d]/g, ''));
    if (!cleanAmount || cleanAmount < 50000) {
      showToast('Số tiền rút tối thiểu là 50,000đ!', 'warning');
      return;
    }

    if (cleanAmount > (wallet.balance || 0)) {
      showToast('Số tiền rút vượt quá số dư khả dụng hiện tại!', 'error');
      return;
    }

    if (!user?.accountNumber && !accountNumber) {
      showToast('Vui lòng cập nhật số tài khoản ngân hàng trước khi rút tiền!', 'warning');
      setIsEditingBank(true);
      return;
    }

    setSubmitting(true);
    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const res = await fetch(`${API_URL_ROOT}/api/user/payouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: cleanAmount,
          bankName: user?.bankName || bankName,
          accountNumber: user?.accountNumber || accountNumber,
          accountName: user?.accountName || accountName
        }),
        credentials: 'include'
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Đã gửi yêu cầu rút tiền thành công! Admin sẽ duyệt sớm nhất. 🎉', 'success');
        setAmountInput('');
        fetchWalletAndPayouts();
      } else {
        showToast(data.message || 'Không thể tạo yêu cầu rút tiền', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Lỗi gửi yêu cầu rút tiền', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="withdraw-view-wrapper" style={{ width: '100%', maxWidth: '820px', margin: '0 auto' }}>
      
      {/* 1. GRID STAT CARDS (BÊ TỪ TRANG TRA CỨU ZALO QUA) */}
      <div className="stats-container" style={{ width: '100%', marginBottom: '22px' }}>
        <h3 className="stats-section-title" style={{ fontSize: '17px', fontWeight: '800', marginBottom: '14px', color: 'var(--text-bright)' }}>
          💳 Ví Tiền Hoa Hồng & Quản Lý Rút Tiền: <span style={{ color: 'var(--color-primary, #ea580c)' }}>{user?.fullName || user?.email}</span>
        </h3>

        <div className="stats-cards-grid">
          {/* Thẻ 0: Tổng tích lũy chiếm full hàng */}
          <div className="stat-card-item total" style={{ gridColumn: '1 / -1' }}>
            <span className="stat-card-label">
              <i className="fa-solid fa-sparkles" style={{ color: '#2563eb' }}></i>
              🌟 TỔNG HOA HỒNG ĐÃ KIẾM (TÍCH LŨY)
            </span>
            <span className="stat-card-sub">(Toàn bộ hoa hồng từ đơn Web & Bot Zalo đã ghi nhận)</span>
            <span className="stat-card-value primary">
              {formatMoney(wallet.totalEarned || (wallet.balance + wallet.received + wallet.pending))}
            </span>
          </div>

          {/* Thẻ 1: Số dư khả dụng (Rút ngay) */}
          <div className="stat-card-item withdrawable">
            <span className="stat-card-label">
              <i className="fa-solid fa-money-bill-wave" style={{ color: '#ea580c' }}></i>
              💵 SỐ DƯ KHẢ DỤNG (CÓ THỂ RÚT)
            </span>
            <span className="stat-card-sub">(Hoa hồng đơn hoàn thành đủ 3 ngày)</span>
            <span className="stat-card-value">
              {formatMoney(wallet.balance)}
            </span>
          </div>

          {/* Thẻ 2: Đang chờ duyệt chuyển khoản */}
          <div className="stat-card-item pending">
            <span className="stat-card-label">
              <i className="fa-solid fa-clock-rotate-left" style={{ color: '#d97706' }}></i>
              ⏳ ĐANG CHỜ DUYỆT RÚT
            </span>
            <span className="stat-card-sub">(Lệnh rút đang trong hàng đợi xử lý)</span>
            <span className="stat-card-value">
              {formatMoney(wallet.pending)}
            </span>
          </div>

          {/* Thẻ 3: Đã rút thành công */}
          <div className="stat-card-item received" style={{ gridColumn: '1 / -1' }}>
            <span className="stat-card-label">
              <i className="fa-solid fa-building-columns" style={{ color: '#9333ea' }}></i>
              🏦 ĐÃ RÚT VỀ TÀI KHOẢN BANK THÀNH CÔNG
            </span>
            <span className="stat-card-sub">(Tổng số tiền Admin đã chuyển khoản giải ngân về tài khoản của bạn)</span>
            <span className="stat-card-value">
              {formatMoney(wallet.received)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. CARD: TẠO LỆNH RÚT TIỀN VỀ NGÂN HÀNG */}
      <div className="lookup-card" style={{ marginBottom: '22px' }}>
        <h3 className="stats-section-title" style={{ margin: 0, marginBottom: '8px' }}>
          💸 Tạo Lệnh Rút Tiền Về Ngân Hàng
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px 0', lineHeight: '1.5' }}>
          Số dư khả dụng tối thiểu để tạo lệnh rút là <b>50,000đ</b>. Hoa hồng sẽ được Admin duyệt và giải ngân trực tiếp vào số tài khoản thụ hưởng bên dưới.
        </p>

        {/* Thẻ ATM Thụ Hưởng Nhận Tiền */}
        <div style={{
          background: 'var(--bg-main)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '16px 18px',
          marginBottom: '18px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: user?.accountNumber ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                flexShrink: 0
              }}>
                <i className="fa-solid fa-credit-card"></i>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Tài Khoản Ngân Hàng Thụ Hưởng
                </div>
                {user?.accountNumber ? (
                  <div style={{ fontSize: '14.5px', fontWeight: '900', color: 'var(--text-bright)', marginTop: '2px' }}>
                    {user.bankName || user.bankCode} • <span style={{ fontFamily: 'monospace', color: '#0284c7' }}>{user.accountNumber}</span> • {user.accountName || user.fullName}
                  </div>
                ) : (
                  <div style={{ fontSize: '13px', color: '#dc2626', fontWeight: '800', marginTop: '2px' }}>
                    ⚠️ Chưa thiết lập tài khoản ngân hàng nhận tiền
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsEditingBank(!isEditingBank)}
              className="lookup-admin-link"
              style={{
                fontSize: '12px',
                padding: '7px 14px',
                background: user?.accountNumber ? 'var(--bg-card)' : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                color: user?.accountNumber ? 'var(--text-bright)' : '#ffffff',
                borderColor: user?.accountNumber ? 'var(--border-color)' : 'transparent',
                fontWeight: '700'
              }}
            >
              <i className={isEditingBank ? 'fa-solid fa-xmark' : (user?.accountNumber ? 'fa-solid fa-pen-to-square' : 'fa-solid fa-plus')}></i>
              <span>{isEditingBank ? 'Đóng form' : (user?.accountNumber ? 'Thay đổi' : 'Cập nhật ngay')}</span>
            </button>
          </div>

          {/* Form Chỉnh Sửa Ngân Hàng Tích Hợp */}
          {isEditingBank && (
            <form onSubmit={handleSaveBank} style={{ marginTop: '16px', borderTop: '1px dashed var(--border-color)', paddingTop: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px' }}>
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
                      placeholder="VD: Techcombank..."
                      value={bankName}
                      onChange={e => setBankName(e.target.value)}
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditingBank(false)}
                  className="lookup-admin-link"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingBank}
                  className="lookup-btn"
                  style={{ width: 'auto', padding: '9px 20px', fontSize: '13px' }}
                >
                  {savingBank ? 'Đang lưu...' : 'Lưu Ngân Hàng'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Input Nhập Số Tiền Rút & Chip Chọn Nhanh */}
        {wallet.balance >= 50000 ? (
          <form onSubmit={handleRequestPayout}>
            <div className="lookup-input-group" style={{ marginBottom: '10px' }}>
              <label className="lookup-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Số Tiền Muốn Rút (đ)</span>
                <span style={{ fontSize: '11px', textTransform: 'none', color: 'var(--text-muted)' }}>
                  Khả dụng: <b>{formatMoney(wallet.balance)}</b>
                </span>
              </label>

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  className="lookup-input"
                  placeholder={`Tối thiểu 50.000đ • Tối đa ${formatMoney(wallet.balance)}`}
                  value={amountInput}
                  onChange={e => {
                    const raw = e.target.value.replace(/[^\d]/g, '');
                    setAmountInput(raw ? new Intl.NumberFormat('vi-VN').format(parseFloat(raw)) : '');
                  }}
                  style={{ fontSize: '16px', fontWeight: '800', paddingRight: '90px' }}
                />
                <button
                  type="button"
                  className="lookup-admin-link"
                  style={{
                    position: 'absolute',
                    right: '8px',
                    fontSize: '11.5px',
                    padding: '6px 12px',
                    background: 'rgba(249, 115, 22, 0.12)',
                    color: 'var(--color-primary, #ea580c)',
                    borderColor: 'rgba(249, 115, 22, 0.3)',
                    fontWeight: '800'
                  }}
                  onClick={() => setAmountInput(new Intl.NumberFormat('vi-VN').format(wallet.balance))}
                >
                  Rút hết
                </button>
              </div>
            </div>

            {/* Quick Amount Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-muted)' }}>Chọn nhanh:</span>
              {[50000, 100000, 200000, 500000, 1000000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAddAmount(val)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-bright)',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#ea580c';
                    e.currentTarget.style.color = '#ea580c';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.color = 'var(--text-bright)';
                  }}
                >
                  +{new Intl.NumberFormat('vi-VN').format(val)}đ
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={submitting || !amountInput}
              className="lookup-btn"
            >
              {submitting ? (
                <>
                  <div className="lookup-spinner"></div>
                  <span>Đang xử lý yêu cầu rút...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-paper-plane"></i>
                  <span>Gửi Yêu Cầu Rút Tiền Ngay</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <div style={{
            padding: '16px 20px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px dashed rgba(239, 68, 68, 0.35)',
            borderRadius: '14px',
            textAlign: 'center',
            color: '#dc2626',
            fontSize: '13.5px',
            fontWeight: '600',
            lineHeight: '1.5'
          }}>
            🔒 Số dư khả dụng hiện tại là <b>{formatMoney(wallet.balance)}</b> (Cần tối thiểu <b>50,000đ</b> để tạo lệnh rút tiền). Hãy tiếp tục mua sắm hoặc chia sẻ link tiếp thị để tích lũy thêm hoa hồng nhé!
          </div>
        )}
      </div>

      {/* 3. CARD: LỊCH SỬ YÊU CẦU RÚT TIỀN */}
      <div className="orders-container" style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h3 className="stats-section-title" style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: 'var(--text-bright)' }}>
            📜 Lịch Sử Yêu Cầu Rút Tiền ({payouts.length})
          </h3>
          <button
            type="button"
            onClick={fetchWalletAndPayouts}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary, #ea580c)',
              fontSize: '12.5px',
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

        {payouts.length === 0 ? (
          <div className="lookup-card" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <i className="fa-solid fa-receipt" style={{ fontSize: '32px', color: 'var(--text-subtle)', marginBottom: '10px' }}></i>
            <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-bright)' }}>Chưa có yêu cầu rút tiền nào</div>
            <p style={{ margin: '4px 0 0 0', fontSize: '12.5px' }}>
              Mọi lệnh rút tiền của bạn sẽ được hiển thị và cập nhật trạng thái chi tiết tại đây.
            </p>
          </div>
        ) : (
          payouts.map((p, idx) => {
            const isDone = p.status === 'COMPLETED' || p.status === 'Đã chuyển' || p.status === 'Đã duyệt';
            const isReject = p.status === 'REJECTED' || p.status === 'Đã hủy' || p.status === 'Từ chối';
            const statusText = isDone ? 'Đã chuyển tiền' : (isReject ? 'Đã từ chối' : 'Đang chờ Admin duyệt');
            const statusColor = isDone ? '#059669' : (isReject ? '#dc2626' : '#d97706');

            return (
              <div key={p.id || idx} className="order-card-item">
                <div className="order-card-header">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-regular fa-clock" style={{ color: 'var(--text-muted)', fontSize: '13px' }}></i>
                    <span>{formatDateTime(p.createdAt || p.requestTime)}</span>
                  </span>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '14px',
                    fontSize: '11px',
                    fontWeight: '800',
                    background: isDone ? 'rgba(5, 150, 105, 0.14)' : (isReject ? 'rgba(220, 38, 38, 0.14)' : 'rgba(217, 119, 6, 0.14)'),
                    color: statusColor
                  }}>
                    {statusText}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Tài khoản nhận:</div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-bright)', marginTop: '2px' }}>
                      {p.bankName} • <span style={{ fontFamily: 'monospace', color: '#0284c7' }}>{p.accountNumber}</span>
                    </div>
                    {p.accountName && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Chủ TK: <b>{p.accountName}</b>
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Số tiền rút:</div>
                    <div style={{ fontSize: '19px', fontWeight: '900', color: 'var(--color-primary, #ea580c)', marginTop: '2px' }}>
                      {formatMoney(p.amount)}
                    </div>
                  </div>
                </div>

                {p.adminNote && (
                  <div style={{ marginTop: '12px', padding: '10px 14px', background: 'var(--bg-main)', borderRadius: '10px', fontSize: '12.5px', color: 'var(--text-bright)', borderLeft: '3px solid var(--color-primary, #ea580c)' }}>
                    Ghi chú Admin: <b>{p.adminNote}</b>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
