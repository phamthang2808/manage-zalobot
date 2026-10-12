import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney, formatDateTime } from '../../utils/formatters';

export default function WithdrawView() {
  const { API_URL_ROOT, user, showToast, setView } = useApp();
  const [wallet, setWallet] = useState({ balance: 0, totalEarned: 0, received: 0, pending: 0 });
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form rút tiền state
  const [amountInput, setAmountInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Bank Info State
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
      setBankName(user.bankName || '');
      setAccountNumber(user.accountNumber || '');
      setAccountName(user.accountName || user.fullName || '');
    }
  }, [user]);

  const handleSaveBank = async (e) => {
    e.preventDefault();
    if (!bankName.trim() || !accountNumber.trim() || !accountName.trim()) {
      showToast('Vui lòng điền đầy đủ Tên ngân hàng, Số tài khoản và Tên chủ tài khoản!', 'warning');
      return;
    }

    setSavingBank(true);
    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const res = await fetch(`${API_URL_ROOT}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          accountName: accountName.trim().toUpperCase()
        }),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
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

    if (!accountNumber || !bankName) {
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
          bankName: bankName,
          accountNumber: accountNumber,
          accountName: accountName
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
    <div className="withdraw-view-wrapper" style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
      {/* 4 Thẻ Thống Kê Ví Tiền Chuẩn Bê Từ OrderLookupView */}
      <div className="stats-container" style={{ width: '100%', marginBottom: '22px' }}>
        <h3 className="stats-section-title" style={{ fontSize: '17px', fontWeight: '800', marginBottom: '14px', color: 'var(--text-bright)' }}>
          💳 Ví Tiền Hoa Hồng & Rút Tiền: <span style={{ color: 'var(--color-primary, #ea580c)' }}>{user?.fullName || user?.email}</span>
        </h3>

        <div className="stats-cards-grid">
          {/* Thẻ 1: Số dư khả dụng (Toàn bộ hàng ngang) */}
          <div className="stat-card-item withdrawable" style={{ gridColumn: '1 / -1' }}>
            <span className="stat-card-label">💵 SỐ DƯ KHẢ DỤNG (CÓ THỂ RÚT NGAY)</span>
            <span className="stat-card-sub">(Hoa hồng từ các đơn Shopee, TikTok Shop, Lazada đã hoàn thành)</span>
            <span className="stat-card-value">
              {formatMoney(wallet.balance)}
            </span>
          </div>

          {/* Thẻ 2: Tổng hoa hồng đã kiếm */}
          <div className="stat-card-item total">
            <span className="stat-card-label">🌟 TỔNG HOA HỒNG ĐÃ KIẾM</span>
            <span className="stat-card-sub">(Toàn bộ hoa hồng tích lũy)</span>
            <span className="stat-card-value primary">
              {formatMoney(wallet.totalEarned)}
            </span>
          </div>

          {/* Thẻ 3: Đã thanh toán thành công */}
          <div className="stat-card-item received">
            <span className="stat-card-label">🏦 ĐÃ RÚT VỀ TÀI KHOẢN BANK</span>
            <span className="stat-card-sub">(Tiền đã được chuyển khoản)</span>
            <span className="stat-card-value">
              {formatMoney(wallet.received)}
            </span>
          </div>

          {/* Thẻ 4: Đang chờ admin duyệt */}
          <div className="stat-card-item pending" style={{ gridColumn: '1 / -1' }}>
            <span className="stat-card-label">⏳ ĐANG CHỜ ADMIN CHUYỂN KHOẢN</span>
            <span className="stat-card-sub">(Lệnh rút đang trong hàng đợi xử lý)</span>
            <span className="stat-card-value">
              {formatMoney(wallet.pending)}
            </span>
          </div>
        </div>
      </div>

      {/* Thẻ 1: Tạo Lệnh Rút Tiền Chuẩn Giao Diện OrderLookupView */}
      <div className="lookup-card" style={{ marginBottom: '24px' }}>
        <h3 className="stats-section-title" style={{ margin: 0, marginBottom: '10px' }}>
          💸 Tạo Lệnh Rút Tiền Về Ngân Hàng
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px 0', lineHeight: '1.5' }}>
          Số dư khả dụng tối thiểu để rút là <b>50,000đ</b>. Tiền hoa hồng sẽ được admin duyệt và chuyển khoản trực tiếp vào số tài khoản ngân hàng thụ hưởng của bạn.
        </p>

        {/* Thông tin tài khoản ngân hàng */}
        <div style={{
          background: 'var(--bg-main)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '14px 16px',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isEditingBank ? '12px' : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(249, 115, 22, 0.12)', color: 'var(--color-primary, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                <i className="fa-solid fa-credit-card"></i>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Tài Khoản Thụ Hưởng Nhận Tiền
                </div>
                {accountNumber ? (
                  <div style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--text-bright)', marginTop: '2px' }}>
                    {bankName} • <span style={{ fontFamily: 'monospace' }}>{accountNumber}</span> • {accountName}
                  </div>
                ) : (
                  <div style={{ fontSize: '13px', color: '#dc2626', fontWeight: '700', marginTop: '2px' }}>
                    ⚠️ Chưa thiết lập số tài khoản ngân hàng
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsEditingBank(!isEditingBank)}
              className="lookup-admin-link"
              style={{ fontSize: '11.5px', padding: '5px 12px' }}
            >
              {isEditingBank ? 'Đóng' : (accountNumber ? 'Thay đổi' : 'Cập nhật ngay')}
            </button>
          </div>

          {/* Form chỉnh sửa ngân hàng */}
          {isEditingBank && (
            <form onSubmit={handleSaveBank} style={{ marginTop: '12px', borderTop: '1px dashed var(--border-color)', paddingTop: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label className="lookup-label">Ngân Hàng (VD: MBBank, VCB...)</label>
                  <input
                    type="text"
                    className="lookup-input"
                    placeholder="VD: MBBank, Techcombank..."
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="lookup-label">Số Tài Khoản</label>
                  <input
                    type="text"
                    className="lookup-input"
                    placeholder="Nhập số tài khoản..."
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value)}
                  />
                </div>
                <div>
                  <label className="lookup-label">Tên Chủ Tài Khoản (Không dấu)</label>
                  <input
                    type="text"
                    className="lookup-input"
                    placeholder="VD: NGUYEN VAN A"
                    value={accountName}
                    onChange={e => setAccountName(e.target.value.toUpperCase())}
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
                  style={{ width: 'auto', padding: '8px 18px', fontSize: '13px' }}
                >
                  {savingBank ? 'Đang lưu...' : 'Lưu Ngân Hàng'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Input nhập số tiền rút */}
        {wallet.balance >= 50000 ? (
          <form onSubmit={handleRequestPayout}>
            <div className="lookup-input-group">
              <label className="lookup-label">Số Tiền Muốn Rút (đ)</label>
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
                />
                <button
                  type="button"
                  className="lookup-admin-link"
                  style={{
                    position: 'absolute',
                    right: '8px',
                    fontSize: '11px',
                    padding: '5px 10px',
                    background: 'rgba(249, 115, 22, 0.12)',
                    color: 'var(--color-primary, #ea580c)',
                    borderColor: 'rgba(249, 115, 22, 0.3)'
                  }}
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
              style={{ marginTop: '8px' }}
            >
              {submitting ? (
                <>
                  <div className="lookup-spinner"></div>
                  <span>Đang xử lý yêu cầu...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-paper-plane"></i>
                  <span>Gửi Yêu Cầu Rút Tiền</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <div style={{
            padding: '16px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px dashed rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            textAlign: 'center',
            color: '#dc2626',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            🔒 Số dư khả dụng hiện tại là <b>{formatMoney(wallet.balance)}</b> (Cần tối thiểu 50,000đ để tạo lệnh rút tiền). Hãy tiếp tục tạo link mua sắm để tích lũy hoa hồng nhé!
          </div>
        )}
      </div>

      {/* Thẻ 2: Lịch Sử Yêu Cầu Rút Tiền Chuẩn Giao Diện */}
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
              gap: '5px'
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
                    fontWeight: '800',
                    background: isDone ? 'rgba(5, 150, 105, 0.12)' : (isReject ? 'rgba(220, 38, 38, 0.12)' : 'rgba(217, 119, 6, 0.12)'),
                    color: statusColor
                  }}>
                    {statusText}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tài khoản nhận:</div>
                    <div style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--text-bright)', marginTop: '2px' }}>
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
                    <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--color-primary, #ea580c)', marginTop: '2px' }}>
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
