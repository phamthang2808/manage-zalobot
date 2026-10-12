import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney } from '../../utils/formatters';

export default function ConvertView() {
  const { API_URL_ROOT, user, showToast } = useApp();
  const [inputText, setInputText] = useState('');
  const [activePlatform, setActivePlatform] = useState('ALL');
  const [converting, setConverting] = useState(false);
  const [results, setResults] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Helper tạo tên không dấu hiển thị
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

  const handleConvert = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) {
      showToast('Vui lòng dán ít nhất một liên kết sản phẩm!', 'warning');
      return;
    }

    const lines = inputText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length === 0) return;

    setConverting(true);
    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const res = await fetch(`${API_URL_ROOT}/api/user/convert-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ links: lines }),
        credentials: 'include'
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || 'Lỗi chuyển đổi liên kết');
      }

      setResults(resData.data || []);
      showToast(`Chuyển đổi thành công ${resData.data?.length || 0} liên kết! 🎉`, 'success');
    } catch (err) {
      showToast(err.message || 'Lỗi server khi chuyển đổi link', 'error');
    } finally {
      setConverting(false);
    }
  };

  const handleCopy = (link, idx) => {
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedIndex(idx);
      showToast('Đã sao chép link tiếp thị vào bộ nhớ tạm! 🎉', 'success');
      setTimeout(() => setCopiedIndex(null), 2500);
    }).catch(() => {
      showToast('Không thể sao chép liên kết!', 'error');
    });
  };

  const handleCopyAll = () => {
    if (results.length === 0) return;
    const allLinks = results.map(r => r.affiliateUrl || r.shortUrl || r.url).join('\n');
    navigator.clipboard.writeText(allLinks).then(() => {
      showToast(`Đã sao chép toàn bộ ${results.length} liên kết tiếp thị! 🎉`, 'success');
    }).catch(() => {
      showToast('Không thể sao chép!', 'error');
    });
  };

  return (
    <div className="convert-view-wrapper" style={{ width: '100%', maxWidth: '820px', margin: '0 auto' }}>
      
      {/* 1. THẺ CHUYỂN ĐỔI LINK CHÍNH */}
      <div className="lookup-card" style={{ padding: '24px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)',
              flexShrink: 0
            }}>
              <i className="fa-solid fa-bolt"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '900', margin: 0, color: 'var(--text-bright)' }}>
                Tạo Link Tiếp Thị & Hoàn Tiền Tự Động
              </h2>
              <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '3px' }}>
                Hỗ trợ đồng thời <b>Shopee</b>, <b>TikTok Shop</b>, <b>Lazada</b> và <b>ShopeeFood</b>
              </div>
            </div>
          </div>

          {/* SubID Badge */}
          <div
            onClick={handleCopySubId}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(249,115,22,0.12), rgba(234,88,12,0.06))',
              border: '1px solid rgba(249,115,22,0.3)',
              color: 'var(--color-primary, #ea580c)',
              fontSize: '12px',
              fontFamily: 'monospace',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Bấm để sao chép SubID"
          >
            <span>SubID: {displaySubId}</span>
            <i className="fa-solid fa-copy" style={{ fontSize: '11px' }}></i>
          </div>
        </div>

        {/* Platform Selector Tabs */}
        <div className="lookup-tabs" style={{ marginBottom: '16px' }}>
          <button className={`lookup-tab ${activePlatform === 'ALL' ? 'active' : ''}`} onClick={() => setActivePlatform('ALL')}>
            ⚡ Tất cả sàn
          </button>
          <button className={`lookup-tab ${activePlatform === 'shopee' ? 'active' : ''}`} onClick={() => setActivePlatform('shopee')}>
            Shopee
          </button>
          <button className={`lookup-tab ${activePlatform === 'tiktok' ? 'active' : ''}`} onClick={() => setActivePlatform('tiktok')}>
            TikTok Shop
          </button>
          <button className={`lookup-tab ${activePlatform === 'lazada' ? 'active' : ''}`} onClick={() => setActivePlatform('lazada')}>
            Lazada
          </button>
          <button className={`lookup-tab ${activePlatform === 'shopeefood' ? 'active' : ''}`} onClick={() => setActivePlatform('shopeefood')}>
            🍔 ShopeeFood
          </button>
        </div>

        {/* Input Textarea Form */}
        <form onSubmit={handleConvert}>
          <div className="lookup-input-group" style={{ marginBottom: '14px' }}>
            <label className="lookup-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Dán link sản phẩm (hỗ trợ nhiều link, mỗi dòng 1 link):</span>
              <span style={{ fontSize: '11.5px', textTransform: 'none', color: 'var(--text-muted)', fontWeight: '600' }}>
                Đã nhập: <b>{inputText.split('\n').filter(l => l.trim()).length}</b> link
              </span>
            </label>
            <textarea
              className="lookup-input"
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Ví dụ:\nhttps://shopee.vn/product/123/456...\nhttps://vt.tiktok.com/ZSxxx...\nhttps://s.lazada.vn/s.xxx...\nhttps://shopeefood.vn/ha-noi/...`}
              style={{
                width: '100%',
                resize: 'vertical',
                minHeight: '120px',
                lineHeight: '1.6',
                fontFamily: 'monospace',
                fontSize: '13px',
                padding: '14px',
                borderRadius: '14px'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            {inputText && (
              <button
                type="button"
                onClick={() => setInputText('')}
                className="lookup-admin-link"
                style={{ fontSize: '12.5px', padding: '10px 16px' }}
              >
                <i className="fa-solid fa-trash-can"></i>
                <span>Xóa nội dung</span>
              </button>
            )}
            <button
              type="submit"
              disabled={converting || !inputText.trim()}
              className="lookup-btn"
              style={{ flex: 1, padding: '13px' }}
            >
              {converting ? (
                <>
                  <div className="lookup-spinner"></div>
                  <span>Đang chuyển đổi link...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                  <span>Chuyển Đổi Link Ngay</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 2. KẾT QUẢ CHUYỂN ĐỔI LINK */}
      {results.length > 0 && (
        <div className="orders-container" style={{ width: '100%', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 className="stats-section-title" style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: 'var(--text-bright)' }}>
              🎉 Kết Quả Chuyển Đổi ({results.length} link)
            </h3>
            {results.length > 1 && (
              <button
                type="button"
                onClick={handleCopyAll}
                className="lookup-admin-link"
                style={{ fontSize: '12px', padding: '6px 12px', background: 'rgba(249, 115, 22, 0.12)', color: 'var(--color-primary, #ea580c)', borderColor: 'rgba(249, 115, 22, 0.3)' }}
              >
                <i className="fa-solid fa-copy"></i>
                <span>Copy tất cả link</span>
              </button>
            )}
          </div>

          {results.map((r, idx) => {
            const finalLink = r.affiliateUrl || r.shortUrl || r.url || '';
            const isCopied = copiedIndex === idx;

            return (
              <div key={idx} className="order-card-item" style={{ padding: '16px 18px' }}>
                <div className="order-card-header" style={{ marginBottom: '10px' }}>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: '800',
                    background: 'rgba(234, 88, 12, 0.12)',
                    color: 'var(--color-primary, #ea580c)'
                  }}>
                    Link #{idx + 1} • {r.platform || 'AFFILIATE'}
                  </span>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    Gắn SubID: <b style={{ fontFamily: 'monospace' }}>{r.subId || displaySubId}</b>
                  </span>
                </div>

                {/* Box hiển thị link */}
                <div style={{
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  marginBottom: '12px',
                  wordBreak: 'break-all',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  color: 'var(--text-bright)'
                }}>
                  {finalLink}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                  <a
                    href={finalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="lookup-admin-link"
                    style={{ fontSize: '12px', padding: '6px 14px', textDecoration: 'none' }}
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square"></i>
                    <span>Mở link mua sắm</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopy(finalLink, idx)}
                    className="lookup-btn"
                    style={{
                      width: 'auto',
                      padding: '7px 18px',
                      fontSize: '12.5px',
                      borderRadius: '10px',
                      background: isCopied ? '#059669' : undefined
                    }}
                  >
                    <i className={isCopied ? 'fa-solid fa-circle-check' : 'fa-solid fa-copy'}></i>
                    <span>{isCopied ? 'Đã sao chép!' : 'Sao chép link'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. CARD HƯỚNG DẪN HOÀN TIỀN & HOA HỒNG */}
      <div className="lookup-card" style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, var(--bg-card) 100%)',
        border: '1.5px solid rgba(59, 130, 246, 0.25)',
        padding: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#2563eb', fontWeight: '800', fontSize: '14px' }}>
          <i className="fa-solid fa-shield-halved"></i>
          <span>Cơ Chế Ghi Nhận Hoa Hồng & Hoàn Tiền Minh Bạch</span>
        </div>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.7' }}>
          <li>Hệ thống tự động gắn mã <b>SubID</b> của bạn vào từng link sản phẩm để sàn ghi nhận hoa hồng chuẩn xác 100%.</li>
          <li>Hoa hồng chia sẻ lại cho thành viên lên tới <b>80%</b> giá trị hoa hồng nhận được từ Shopee, TikTok Shop, Lazada.</li>
          <li>Sau khi đơn hàng giao thành công, hoa hồng sẽ tự động cập nhật vào mục <b>Đơn hàng</b> và tích lũy vào <b>Ví tiền</b> của bạn.</li>
        </ul>
      </div>

    </div>
  );
}
