import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney } from '../../utils/formatters';
import CopyButton from '../common/CopyButton';

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

  return (
    <div className="convert-view-wrapper" style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
      {/* Thẻ Giới Thiệu Chuyển Đổi Nhanh Chuẩn Giao Diện */}
      <div className="lookup-card" style={{ padding: '24px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)'
            }}>
              <i className="fa-solid fa-bolt"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--text-bright)' }}>
                Tạo Link Tiếp Thị & Hoàn Tiền Tự Động
              </h2>
              <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Hỗ trợ đồng thời <b>Shopee</b>, <b>TikTok Shop</b>, <b>Lazada</b> và <b>ShopeeFood</b>
              </div>
            </div>
          </div>

          <div style={{
            padding: '5px 12px',
            borderRadius: '20px',
            background: 'rgba(249, 115, 22, 0.12)',
            color: 'var(--color-primary, #ea580c)',
            fontSize: '12px',
            fontFamily: 'monospace',
            fontWeight: '800'
          }}>
            SubID: {displaySubId}
          </div>
        </div>

        {/* Platform Selector Tabs */}
        <div className="lookup-tabs" style={{ marginBottom: '18px' }}>
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
              <span style={{ fontSize: '11px', textTransform: 'none', color: 'var(--text-subtle)' }}>
                {inputText.split('\n').filter(l => l.trim()).length} link
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
                minHeight: '110px',
                lineHeight: '1.5',
                fontFamily: 'monospace',
                fontSize: '13px'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            {inputText && (
              <button
                type="button"
                onClick={() => setInputText('')}
                className="lookup-admin-link"
                style={{ fontSize: '12px' }}
              >
                Xóa nội dung
              </button>
            )}
            <button
              type="submit"
              disabled={converting || !inputText.trim()}
              className="lookup-btn"
              style={{ flex: 1, padding: '12px' }}
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

      {/* Kết Quả Chuyển Đổi */}
      {results.length > 0 && (
        <div className="orders-container" style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 className="stats-section-title" style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: 'var(--text-bright)' }}>
              🎉 Kết Quả Chuyển Đổi ({results.length} link)
            </h3>
            <button
              type="button"
              onClick={() => {
                const allLinks = results.filter(r => r.affiliateLink).map(r => r.affiliateLink).join('\n');
                navigator.clipboard.writeText(allLinks);
                showToast('Đã sao chép toàn bộ link tiếp thị! 🎉', 'success');
              }}
              className="lookup-admin-link"
              style={{ fontSize: '12px' }}
            >
              <i className="fa-solid fa-copy" style={{ color: 'var(--color-primary, #ea580c)' }}></i>
              <span>Sao chép tất cả</span>
            </button>
          </div>

          {results.map((res, idx) => (
            <div key={idx} className="order-card-item">
              <div className="order-card-header">
                <span style={{
                  display: 'inline-block',
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: res.platform === 'SHOPEE_FOOD' ? 'rgba(220, 38, 38, 0.12)' : (res.platform === 'TIKTOK' ? 'rgba(0, 0, 0, 0.08)' : (res.platform === 'LAZADA' ? 'rgba(37, 99, 235, 0.12)' : 'rgba(234, 88, 12, 0.12)')),
                  color: res.platform === 'SHOPEE_FOOD' ? '#dc2626' : (res.platform === 'TIKTOK' ? 'var(--text-bright)' : (res.platform === 'LAZADA' ? '#2563eb' : '#ea580c'))
                }}>
                  {res.platform === 'SHOPEE_FOOD' ? 'ShopeeFood' : (res.platform || 'Sản phẩm')}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-subtle)', fontFamily: 'monospace' }}>
                  SubID: {res.subId || displaySubId}
                </span>
              </div>

              <div className="order-card-title" style={{ marginTop: '8px' }}>
                {res.productName || res.originalUrl}
              </div>

              {res.success ? (
                <div style={{
                  background: 'var(--bg-main)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  marginTop: '10px'
                }}>
                  <div style={{
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    color: 'var(--color-primary, #ea580c)',
                    fontWeight: '700',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1
                  }}>
                    {res.affiliateLink}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(res.affiliateLink, idx)}
                    className="lookup-admin-link"
                    style={{
                      fontSize: '12px',
                      padding: '6px 14px',
                      background: copiedIndex === idx ? 'rgba(5, 150, 105, 0.15)' : 'var(--bg-card)',
                      color: copiedIndex === idx ? '#059669' : 'var(--text-bright)',
                      borderColor: copiedIndex === idx ? '#059669' : 'var(--border-color)',
                      flexShrink: 0
                    }}
                  >
                    <i className={copiedIndex === idx ? "fa-solid fa-check" : "fa-solid fa-copy"}></i>
                    <span>{copiedIndex === idx ? 'Đã chép' : 'Sao chép'}</span>
                  </button>
                </div>
              ) : (
                <div style={{ color: '#dc2626', fontSize: '12.5px', marginTop: '6px', fontWeight: '600' }}>
                  ⚠️ {res.error || 'Không thể tạo link cho sản phẩm này'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
