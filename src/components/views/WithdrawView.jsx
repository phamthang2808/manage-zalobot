import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney, formatDateTime } from '../../utils/formatters';

export default function WithdrawView() {
  const { API_URL_ROOT, user, showToast, setView } = useApp();
  const [wallet, setWallet] = useState({ balance: 0, totalEarned: 0, received: 0, pending: 0, completed: 0 });
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form rút tiền state
  const [amountInput, setAmountInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      
      {/* 1. THỐNG KÊ VÍ TIỀN (CHUẨN 100% Y CHANG TRANG TRA CỨU ZALO, 1 ICON DUY NHẤT) */}
      <div className="stats-container" style={{ width: '100%', marginBottom: '22px' }}>
        <h3 className="stats-section-title" style={{ fontSize: '16.5px', fontWeight: '800', marginBottom: '14px', color: 'var(--text-bright)' }}>
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
            <span className="stat-card-label">💵 SỐ DƯ KHẢ DỤNG</span>
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

      {/* 2. KHUNG RÚT TIỀN (CHUẨN 100% Y CHANG TRANG TRA CỨU ZALO) */}
      <div className="lookup-card" style={{ marginBottom: '24px' }}>
        <h3 className="stats-section-title" style={{ margin: 0, marginBottom: '12px' }}>
          💸 Rút Tiền Hoa Hồng Khả Dụng
        </h3>
        <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '0 0 16px 0', lineHeight: '1.4' }}>
          Tiền hoa hồng của đơn Shopee &quot;Hoàn thành&quot; sau 3 ngày (đơn TikTok rút ngay khi hoàn thành) sẽ tự động chuyển xuống ví khả dụng để rút (đã trừ thuế và chia 8-2). Lệnh rút tiền sau khi gửi sẽ được duyệt thủ công bởi Trưởng nhóm Phạm Thắng.
        </p>

        {/* Thông tin tài khoản thụ hưởng nhận tiền */}
        {user?.accountNumber ? (
          <div style={{
            background: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div>
              <div style={{ fontSize: '10.5px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                NGÂN HÀNG THỤ HƯỞNG
              </div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-bright)', marginTop: '2px' }}>
                {user.bankName || user.bankCode} • <span style={{ fontFamily: 'monospace', color: '#0284c7' }}>{user.accountNumber}</span> • {user.accountName || user.fullName}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setView('account')}
              className="lookup-admin-link"
              style={{ fontSize: '11.5px', padding: '5px 12px' }}
            >
              <i className="fa-solid fa-pen-to-square"></i>
              <span>Thay đổi</span>
            </button>
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
              onClick={() => setView('account')}
              className="lookup-admin-link"
              style={{ fontSize: '11.5px', padding: '5px 12px', color: '#ea580c', borderColor: '#ea580c' }}
            >
              Thiết lập ngay
            </button>
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
          <div style={{ padding: '16px', background: '#fef2f2', border: '1px dashed #fca5a5', borderRadius: '8px', textAlign: 'center', color: '#b91c1c', fontSize: '13px', fontWeight: '600' }}>
            🔒 Số dư khả dụng của sếp hiện đang là 0đ. Chưa thể rút tiền lúc này.
          </div>
        )}
      </div>

      {/* 3. LỊCH SỬ YÊU CẦU RÚT TIỀN */}
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

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Tài khoản nhận:</div>
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
