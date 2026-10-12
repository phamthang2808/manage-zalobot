import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney, formatDateTime } from '../../utils/formatters';
import { BANKS } from '../../utils/banks';
import CopyButton from '../common/CopyButton';

export default function WithdrawView() {
  const { API_URL_ROOT, user, setUser, showToast, setView } = useApp();
  const [wallet, setWallet] = useState({ balance: 0, totalEarned: 0, received: 0, pending: 0, completed: 0 });
  const [payouts, setPayouts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form rút tiền state
  const [amountInput, setAmountInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form chỉnh sửa ngân hàng inline
  const [showEditBank, setShowEditBank] = useState(false);
  const [selectedBank, setSelectedBank] = useState(user?.bankCode || 'MB');
  const [customBankName, setCustomBankName] = useState(user?.bankName || '');
  const [accountNumberInput, setAccountNumberInput] = useState(user?.accountNumber || '');
  const [accountNameInput, setAccountNameInput] = useState(user?.accountName || user?.fullName || '');
  const [savingBank, setSavingBank] = useState(false);

  useEffect(() => {
    if (user?.bankCode) setSelectedBank(user.bankCode);
    if (user?.bankName) setCustomBankName(user.bankName);
    if (user?.accountNumber) setAccountNumberInput(user.accountNumber);
    if (user?.accountName || user?.fullName) setAccountNameInput(user.accountName || user.fullName);
  }, [user]);

  const handleSaveBank = async (e) => {
    e.preventDefault();
    if (!accountNumberInput.trim()) {
      showToast('Vui lòng nhập số tài khoản ngân hàng!', 'warning');
      return;
    }
    if (!accountNameInput.trim()) {
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
          accountNumber: accountNumberInput.trim(),
          accountName: accountNameInput.trim().toUpperCase()
        }),
        credentials: 'include'
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Lỗi lưu thông tin ngân hàng');

      const updatedUser = {
        ...user,
        bankCode: selectedBank,
        bankName: bName,
        accountNumber: accountNumberInput.trim(),
        accountName: accountNameInput.trim().toUpperCase()
      };
      setUser(updatedUser);
      sessionStorage.setItem('adminUser', JSON.stringify(updatedUser));
      showToast('Đã lưu tài khoản ngân hàng thành công! 🎉', 'success');
      setShowEditBank(false); // Tự động thu nhỏ lại sau khi lưu thành công!
    } catch (err) {
      showToast(err.message || 'Lỗi lưu tài khoản ngân hàng', 'error');
    } finally {
      setSavingBank(false);
    }
  };

  const fetchWalletAndPayouts = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const [resWallet, resPayouts, resOrders] = await Promise.all([
        fetch(`${API_URL_ROOT}/api/user/wallet`, { headers: { 'Authorization': `Bearer ${token}` }, credentials: 'include' }),
        fetch(`${API_URL_ROOT}/api/user/payouts`, { headers: { 'Authorization': `Bearer ${token}` }, credentials: 'include' }),
        fetch(`${API_URL_ROOT}/api/user/orders/history`, { headers: { 'Authorization': `Bearer ${token}` }, credentials: 'include' })
      ]);

      const dataWallet = await resWallet.json();
      const dataPayouts = await resPayouts.json();
      const dataOrders = await resOrders.json();

      if (resWallet.ok && dataWallet.data) {
        setWallet(dataWallet.data);
      }
      if (resPayouts.ok && dataPayouts.data) {
        setPayouts(dataPayouts.data || []);
      }
      if (resOrders.ok && dataOrders.data) {
        setOrders(dataOrders.data.orders || []);
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

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    const cleanAmount = parseFloat(amountInput.replace(/[^\d]/g, ''));
    if (!cleanAmount || cleanAmount <= 0) {
      showToast('Vui lòng nhập số tiền rút hợp lệ!', 'warning');
      return;
    }

    if (cleanAmount > (wallet.balance || 0)) {
      showToast('Số tiền rút vượt quá số dư khả dụng hiện tại!', 'error');
      return;
    }

    if (!user?.accountNumber) {
      showToast('Vui lòng thiết lập thông tin ngân hàng nhận tiền trước!', 'warning');
      setView('account');
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
          bankName: user?.bankName || user?.bankCode || '',
          accountNumber: user?.accountNumber || '',
          accountName: user?.accountName || user?.fullName || ''
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
      <style dangerouslySetInnerHTML={{ __html: `
        .orders-container { width: 100%; max-width: 820px; }
        .order-card-item {
          background: var(--bg-card) !important;
          border: 1px solid var(--border-color) !important;
          border-radius: 16px !important;
          padding: 18px 20px !important;
          margin-bottom: 14px !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.04) !important;
          transition: all 0.2s ease !important;
        }
        .order-card-item:hover {
          border-color: rgba(234, 88, 12, 0.4) !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important;
        }
        .order-card-header {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          margin-bottom: 10px !important;
          font-size: 13px !important;
          color: var(--text-muted) !important;
          font-weight: 500 !important;
        }
        .order-id-badge {
          font-family: monospace !important;
          font-weight: 700 !important;
          color: #ea580c !important;
          font-size: 13px !important;
        }
        .order-card-title {
          font-size: 14.5px !important;
          font-weight: 650 !important;
          color: var(--text-bright) !important;
          margin-bottom: 12px !important;
          line-height: 1.5 !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          display: -webkit-box !important;
          -webkit-line-clamp: 2 !important;
          -webkit-box-orient: vertical !important;
        }
        .order-card-commission-row {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          border-top: 1px dashed var(--border-color) !important;
          padding-top: 12px !important;
        }
        .order-commission-label {
          font-size: 13px !important;
          color: var(--text-muted) !important;
          font-weight: 500 !important;
        }
        .order-commission-val {
          font-family: var(--font-heading) !important;
          font-size: 17px !important;
          font-weight: 800 !important;
          color: #047857 !important;
        }
        html[data-theme="dark"] .order-commission-val,
        body.dark .order-commission-val {
          color: #34d399 !important;
        }
        @media (max-width: 640px) {
          .order-card-item { padding: 14px 16px !important; border-radius: 14px !important; }
          .order-card-title { font-size: 13.5px !important; }
        }
      `}} />
      
      {/* 1. THỐNG KÊ VÍ TIỀN (CHUẨN 100% Y CHANG TRANG TRA CỨU ZALO, 1 ICON DUY NHẤT) */}
      <div className="stats-container" style={{ width: '100%', marginBottom: '22px' }}>
        <h3 className="stats-section-title" style={{ fontSize: '16.5px', fontWeight: '650', marginBottom: '14px', color: 'var(--text-bright)' }}>
          💰 Thống Kê Hoa Hồng của: <span style={{ color: '#ea580c' }}>{user?.fullName || user?.email}</span>
        </h3>

        <div className="stats-cards-grid">
          {/* Thẻ 0: Tổng tích lũy chiếm full hàng */}
          <div className="stat-card-item total" style={{ gridColumn: '1 / -1' }}>
            <span className="stat-card-label">🌟 TỔNG TÍCH LŨY (HOÀN THÀNH + CHỜ)</span>
            <span className="stat-card-sub">(Toàn bộ hoa hồng tích lũy)</span>
            <span className="stat-card-value primary">
              {formatMoney(wallet.totalEarned || (wallet.balance + wallet.received + wallet.pending))}
            </span>
          </div>

          {/* Thẻ 1: Đang xử lý */}
          <div className="stat-card-item pending">
            <span className="stat-card-label">⏳ ĐANG XỬ LÝ</span>
            <span className="stat-card-sub">(Đang vận chuyển hoặc chưa ấn nhận hàng)</span>
            <span className="stat-card-value">
              {formatMoney(wallet.pending)}
            </span>
          </div>

          {/* Thẻ 2: Đã hoàn thành */}
          <div className="stat-card-item completed">
            <span className="stat-card-label">📦 ĐÃ HOÀN THÀNH</span>
            <span className="stat-card-sub">(Hoàn thành • Chưa đủ 3 ngày để rút)</span>
            <span className="stat-card-value">
              {formatMoney(wallet.completed || 0)}
            </span>
          </div>

          {/* Thẻ 3: Số dư khả dụng */}
          <div className="stat-card-item withdrawable">
            <span className="stat-card-label">💵 RÚT TIỀN HOA HỒNG KHẢ DỤNG</span>
            <span className="stat-card-sub">(Sau 3 ngày • Đã trừ thuế & chia 8-2)</span>
            <span className="stat-card-value">
              {formatMoney(wallet.balance)}
            </span>
          </div>

          {/* Thẻ 4: Đã nhận */}
          <div className="stat-card-item received">
            <span className="stat-card-label">🏦 ĐÃ NHẬN (ĐÃ THANH TOÁN)</span>
            <span className="stat-card-sub">(Tổng tiền đã rút về tài khoản bank)</span>
            <span className="stat-card-value">
              {formatMoney(wallet.received)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. KHUNG RÚT TIỀN */}
      <div className="lookup-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
          <h3 className="stats-section-title" style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-money-bill-transfer" style={{ color: 'var(--text-muted)' }}></i>
            <span>Rút Tiền Hoa Hồng Khả Dụng</span>
          </h3>
          <span style={{
            fontSize: '13.5px',
            fontWeight: '700',
            color: '#059669',
            background: 'rgba(5, 150, 105, 0.1)',
            border: '1px solid rgba(5, 150, 105, 0.25)',
            padding: '4px 12px',
            borderRadius: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <i className="fa-solid fa-circle-check" style={{ fontSize: '11px' }}></i>
            <span>Khả dụng: {formatMoney(wallet.balance)}</span>
          </span>
        </div>

        <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '0 0 16px 0', lineHeight: '1.4' }}>
          Tiền hoa hồng của đơn Shopee &quot;Hoàn thành&quot; sau 3 ngày (đơn TikTok rút ngay khi hoàn thành) sẽ tự động chuyển xuống ví khả dụng để rút (đã trừ thuế và chia 8-2). Lệnh rút tiền sau khi gửi sẽ được duyệt thủ công bởi Trưởng nhóm Phạm Thắng.
        </p>

        {/* Thông tin tài khoản thụ hưởng nhận tiền (Thiết kế thẻ ngân hàng sang trọng, cực kỳ rõ ràng, dễ nhìn) */}
        {user?.accountNumber ? (
          <div style={{
            background: 'var(--bg-main, #0f172a)',
            border: '1.5px solid var(--border-color, rgba(255, 255, 255, 0.12))',
            borderRadius: '16px',
            padding: '16px 18px',
            marginBottom: '18px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
            position: 'relative'
          }}>
            {/* Header: Label + Ngân hàng & Nút Thay đổi */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(2, 132, 199, 0.15)',
                  color: '#0284c7',
                  border: '1px solid rgba(2, 132, 199, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  flexShrink: 0
                }}>
                  <i className="fa-solid fa-building-columns"></i>
                </div>
                <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                  <div style={{
                    fontSize: '10.5px',
                    fontWeight: '800',
                    color: 'var(--text-muted, #94a3b8)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    NGÂN HÀNG THỤ HƯỞNG
                  </div>
                  <div style={{
                    fontSize: '15px',
                    fontWeight: '800',
                    color: 'var(--text-bright, #ffffff)',
                    lineHeight: '1.2',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {user.bankName || user.bankCode || 'Ngân hàng thụ hưởng'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowEditBank(!showEditBank)}
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  background: showEditBank ? 'rgba(234, 88, 12, 0.15)' : 'var(--bg-card, rgba(255, 255, 255, 0.05))',
                  color: showEditBank ? '#ea580c' : 'var(--text-bright, #ffffff)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#ea580c'; e.currentTarget.style.borderColor = '#ea580c'; }}
                onMouseLeave={e => { e.currentTarget.style.color = showEditBank ? '#ea580c' : 'var(--text-bright, #ffffff)'; e.currentTarget.style.borderColor = 'var(--border-color, #cbd5e1)'; }}
              >
                <i className={showEditBank ? "fa-solid fa-chevron-up" : "fa-regular fa-pen-to-square"} style={{ fontSize: '11.5px', color: '#ea580c' }}></i>
                <span>{showEditBank ? 'Thu gọn' : 'Thay đổi'}</span>
              </button>
            </div>

            {/* Dòng Số Tài Khoản: Nổi bật, to rõ, cực kỳ dễ đọc */}
            <div style={{
              background: 'var(--bg-secondary, rgba(0, 0, 0, 0.2))',
              border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
              borderRadius: '12px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', display: 'block', marginBottom: '2px' }}>
                  Số tài khoản:
                </span>
                <span style={{
                  fontSize: '17px',
                  fontWeight: '800',
                  color: '#38bdf8',
                  letterSpacing: '1.2px',
                  fontFamily: 'monospace'
                }}>
                  {user.accountNumber}
                </span>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                <CopyButton
                  text={user.accountNumber}
                  title="Copy STK"
                  toastMessage={`Đã copy STK: ${user.accountNumber}`}
                />
              </div>
            </div>

            {/* Dòng Chủ Tài Khoản: Rõ ràng, viết hoa */}
            {(user.accountName || user.fullName) && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>
                  Chủ tài khoản:
                </span>
                <span style={{
                  fontSize: '13.5px',
                  fontWeight: '800',
                  color: 'var(--text-bright, #ffffff)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px'
                }}>
                  {user.accountName || user.fullName}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(234, 88, 12, 0.08)',
            border: '1px dashed rgba(234, 88, 12, 0.4)',
            borderRadius: '12px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <span style={{ fontSize: '12.5px', color: '#ea580c', fontWeight: '700' }}>
              ⚠️ Chưa thiết lập tài khoản ngân hàng nhận tiền
            </span>
            <button
              type="button"
              onClick={() => setShowEditBank(true)}
              className="lookup-admin-link"
              style={{ fontSize: '11.5px', padding: '5px 12px', color: '#ea580c', borderColor: '#ea580c' }}
            >
              Thiết lập ngay
            </button>
          </div>
        )}

        {/* Form Chỉnh sửa ngân hàng (Thu nhỏ / Mở rộng) */}
        {showEditBank && (
          <div style={{
            background: 'var(--bg-card, rgba(30, 41, 59, 0.5))',
            border: '1px solid rgba(234, 88, 12, 0.3)',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '18px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-pen-to-square" style={{ color: '#ea580c' }}></i>
                Cập nhật thông tin ngân hàng nhận tiền
              </span>
              <button
                type="button"
                onClick={() => setShowEditBank(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <i className="fa-solid fa-xmark"></i> Thu gọn
              </button>
            </div>

            <form onSubmit={handleSaveBank}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px' }}>
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
                    placeholder="Nhập số tài khoản ngân hàng..."
                    value={accountNumberInput}
                    onChange={e => setAccountNumberInput(e.target.value.replace(/\s+/g, ''))}
                    style={{ fontFamily: 'monospace', fontWeight: '700' }}
                  />
                </div>

                <div className="lookup-input-group" style={{ marginBottom: 0 }}>
                  <label className="lookup-label">Tên Chủ Tài Khoản (Không dấu)</label>
                  <input
                    type="text"
                    className="lookup-input"
                    placeholder="VD: PHAM VAN THANG"
                    value={accountNameInput}
                    onChange={e => setAccountNameInput(e.target.value.toUpperCase())}
                    style={{ fontWeight: '700' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  disabled={savingBank}
                  className="lookup-btn"
                  style={{ flex: 1, padding: '10px 16px', fontSize: '13px' }}
                >
                  <i className="fa-solid fa-floppy-disk"></i>
                  <span>{savingBank ? 'Đang lưu...' : 'Lưu Tài Khoản Ngân Hàng'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditBank(false)}
                  className="lookup-admin-link"
                  style={{ padding: '10px 16px', fontSize: '13px' }}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Input rút tiền & Submit y chang OrderLookupView */}
        {wallet.balance > 0 ? (
          <form onSubmit={handleRequestPayout} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="lookup-input-group" style={{ marginBottom: 0 }}>
              <label className="lookup-label">Số Tiền Muốn Rút (đ)</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  className="lookup-input"
                  placeholder={`Tối đa: ${formatMoney(wallet.balance)}`}
                  value={amountInput}
                  onChange={e => {
                    const val = e.target.value.replace(/[^\d]/g, '');
                    setAmountInput(val ? new Intl.NumberFormat('vi-VN').format(parseFloat(val)) : '');
                  }}
                  style={{ paddingRight: '80px' }}
                />
                <button
                  type="button"
                  className="lookup-admin-link"
                  style={{ position: 'absolute', right: '8px', fontSize: '11px', padding: '4px 8px', background: '#fff7ed', color: '#ea580c', borderColor: '#fed7aa', fontWeight: '800' }}
                  onClick={() => setAmountInput(new Intl.NumberFormat('vi-VN').format(wallet.balance))}
                >
                  Rút hết
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !amountInput}
              className="lookup-btn"
              style={{ marginTop: '4px' }}
            >
              {submitting ? (
                <>
                  <div className="lookup-spinner"></div>
                  <span>Đang gửi yêu cầu...</span>
                </>
              ) : (
                'Gửi yêu cầu rút tiền'
              )}
            </button>
          </form>
        ) : (
          <div style={{ padding: '16px 18px', background: 'rgba(234, 88, 12, 0.08)', border: '1px dashed rgba(234, 88, 12, 0.35)', borderRadius: '12px', textAlign: 'center', color: 'var(--text-bright)', fontSize: '13px', lineHeight: '1.5' }}>
            <div style={{ fontWeight: '750', color: '#ea580c', marginBottom: '4px' }}>
              🔒 Số dư khả dụng hiện tại: 0đ {wallet.pending > 0 ? `(Đang có ${formatMoney(wallet.pending)} hoa hồng chờ xử lý)` : ''}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Đơn hàng mua qua link tiếp thị sẽ nằm ở mục <b>ĐANG XỬ LÝ ⏳</b>. Sau khi đơn hoàn thành trên sàn Shopee / TikTok Shop và qua kỳ đối soát (Shopee sau 3 ngày, TikTok ngay khi hoàn thành), tiền sẽ tự động chuyển vào mục <b>RÚT TIỀN KHẢ DỤNG 💵</b> để sếp tạo lệnh rút!
            </div>
          </div>
        )}
      </div>
      {/* 2. LỊCH SỬ YÊU CẦU RÚT TIỀN */}
      <div className="orders-container" style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h3 className="stats-section-title" style={{ fontSize: '16px', fontWeight: '650', margin: 0, color: 'var(--text-bright)' }}>
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
          <div className="lookup-card" style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <i className="fa-solid fa-receipt" style={{ fontSize: '28px', color: 'var(--text-subtle)', marginBottom: '8px' }}></i>
            <div style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-bright)' }}>Chưa có yêu cầu rút tiền nào</div>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>Các lệnh rút tiền của bạn sẽ được hiển thị và cập nhật trạng thái tại đây.</p>
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
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '600',
                    background: isDone ? 'rgba(5, 150, 105, 0.12)' : (isReject ? 'rgba(220, 38, 38, 0.12)' : 'rgba(217, 119, 6, 0.12)'),
                    color: statusColor
                  }}>
                    {statusText}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Tài khoản nhận:</div>
                    <div style={{ fontSize: '13.5px', fontWeight: '650', color: 'var(--text-bright)', marginTop: '2px' }}>
                      {p.bankName} • <span style={{ fontFamily: 'monospace' }}>{p.accountNumber}</span>
                    </div>
                    {p.accountName && (
                      <div style={{ fontSize: '11.5px', color: 'var(--text-subtle)' }}>
                        Chủ TK: {p.accountName}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Số tiền rút:</div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-primary, #ea580c)', marginTop: '2px' }}>
                      {formatMoney(p.amount)}
                    </div>
                  </div>
                </div>

                {p.adminNote && (
                  <div style={{ marginTop: '10px', padding: '8px 12px', background: 'var(--bg-main)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-muted)', borderLeft: '3px solid var(--color-primary, #ea580c)' }}>
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
