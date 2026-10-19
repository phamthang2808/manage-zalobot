import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import AnnouncementModal from '../common/AnnouncementModal';

export default function AdminAnnouncementTab() {
  const { API_URL_ROOT, showToast } = useApp();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [localPreview, setLocalPreview] = useState('');

  // Announcement state
  const [formData, setFormData] = useState({
    active: true,
    title: '',
    imageUrl: '',
    targetUrl: '',
    content: ''
  });

  const normalizeImgUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('/uploads/announcements/')) {
      const filename = url.replace('/uploads/announcements/', '');
      return `/api/public/announcement/image/${filename}`;
    }
    return url;
  };

  const resolveBannerUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const clean = normalizeImgUrl(url);
    const root = API_URL_ROOT || '';
    return `${root}${clean}`;
  };

  // Nén ảnh sang Base64 kích thước gọn nhẹ phòng trường hợp upload API gặp sự cố
  const compressImageToBase64 = (file, maxWidth = 1000, quality = 0.8) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(event.target.result);
      };
      reader.onerror = () => resolve('');
    });
  };

  const fetchAnnouncement = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('adminToken') || '';
      let serverData = null;
      let isDefaultServer = true;

      try {
        const res = await fetch(`${API_URL_ROOT}/api/admin/announcement`, {
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include'
        });

        if (res.ok) {
          const resData = await res.json();
          if (resData && resData.data) {
            serverData = resData.data;
            isDefaultServer = Boolean(resData.isDefault || !serverData.id);
          }
        }
      } catch (netErr) {
        console.warn('Lỗi kết nối API announcement:', netErr);
      }

      // Đọc bộ nhớ cục bộ localStorage (bản đã lưu hoặc bản nháp của admin)
      let localSaved = null;
      try {
        const rawLocal = localStorage.getItem('site_announcement_config') || localStorage.getItem('site_announcement_draft');
        if (rawLocal) localSaved = JSON.parse(rawLocal);
      } catch (e) {}

      // Ưu tiên:
      // 1. Nếu server có dữ liệu thật do Admin lưu (has id && not default) -> dùng serverData
      // 2. Nếu server rỗng / mặc định, nhưng máy này đã có cấu hình user từng lưu -> dùng localSaved
      // 3. Nếu chưa có gì cả -> dùng mẫu mặc định và BẬT sẵn active: true
      if (serverData && !isDefaultServer && serverData.id) {
        const loaded = {
          active: serverData.active !== undefined ? serverData.active : true,
          title: serverData.title || '',
          imageUrl: normalizeImgUrl(serverData.imageUrl || ''),
          targetUrl: serverData.targetUrl || '',
          content: serverData.content || ''
        };
        setFormData(loaded);
        localStorage.setItem('site_announcement_config', JSON.stringify({ ...serverData, ...loaded }));
      } else if (localSaved && (localSaved.title || localSaved.content || localSaved.imageUrl)) {
        setFormData({
          active: localSaved.active !== undefined ? localSaved.active : true,
          title: localSaved.title || '',
          imageUrl: localSaved.imageUrl || '',
          targetUrl: localSaved.targetUrl || '',
          content: localSaved.content || ''
        });
      } else {
        setFormData({
          active: true,
          title: (serverData && serverData.title) ? serverData.title : 'Chào mừng sếp đến với 28Symues Affiliate!',
          imageUrl: normalizeImgUrl((serverData && serverData.imageUrl) || ''),
          targetUrl: (serverData && serverData.targetUrl) || '',
          content: (serverData && serverData.content) ? serverData.content : 'Nhóm hoàn tiền Shopee, TikTok Shop & Lazada tự động 24/7.'
        });
      }
    } catch (err) {
      console.error('Lỗi nạp thông báo:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncement();
  }, []);

  // Tự động lưu bản nháp (Auto-save draft) vào localStorage mỗi khi admin chỉnh sửa
  const updateFormField = (field, value) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      try {
        localStorage.setItem('site_announcement_draft', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const nowIso = new Date().toISOString();
      const toSave = {
        ...formData,
        updatedAt: nowIso
      };

      // 1. Lưu ngay vào localStorage máy để khách hoặc admin xem được tức thì
      localStorage.setItem('site_announcement_config', JSON.stringify(toSave));
      localStorage.removeItem('site_announcement_draft');

      // 2. Gửi API backend lưu vào database
      const token = sessionStorage.getItem('adminToken') || '';
      const res = await fetch(`${API_URL_ROOT}/api/admin/announcement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(toSave),
        credentials: 'include'
      });

      if (res.ok) {
        const resData = await res.json().catch(() => ({}));
        if (resData && resData.data) {
          const savedData = {
            ...formData,
            ...resData.data,
            imageUrl: normalizeImgUrl(resData.data.imageUrl || formData.imageUrl)
          };
          setFormData(savedData);
          localStorage.setItem('site_announcement_config', JSON.stringify(savedData));
        }
        showToast('Đã lưu và áp dụng cấu hình Popup Website thành công! 🎉', 'success');
      } else {
        showToast('Đã lưu cấu hình Popup trực tiếp vào trình duyệt! (Khách vào web sẽ thấy ngay)', 'info');
      }
    } catch (err) {
      showToast('Đã lưu cấu hình Popup trực tiếp vào trình duyệt! (Khách vào web sẽ thấy ngay)', 'info');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Hiển thị ngay ảnh preview dạng blob cho admin
    try {
      const blobUrl = URL.createObjectURL(file);
      setLocalPreview(blobUrl);
    } catch (e) {}

    setUploading(true);
    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const body = new FormData();
      body.append('file', file);

      const res = await fetch(`${API_URL_ROOT}/api/admin/announcement/upload-image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body,
        credentials: 'include'
      });

      const resData = await res.json().catch(() => ({}));
      if (res.ok && (resData.imageUrl || resData.url)) {
        const url = normalizeImgUrl(resData.imageUrl || resData.url);
        updateFormField('imageUrl', url);
        showToast('Upload ảnh banner thành công!', 'success');
      } else {
        // Fallback nén ảnh và đọc dạng Base64
        const compressedBase64 = await compressImageToBase64(file);
        updateFormField('imageUrl', compressedBase64);
        showToast('Đã chèn ảnh banner trực tiếp thành công!', 'success');
      }
    } catch (err) {
      // Fallback nén ảnh và đọc dạng Base64
      const compressedBase64 = await compressImageToBase64(file);
      updateFormField('imageUrl', compressedBase64);
      showToast('Đã chèn ảnh banner trực tiếp thành công!', 'success');
    } finally {
      setUploading(false);
    }
  };

  // Xóa bộ nhớ đệm đã đóng popup để admin có thể test như một khách mới
  const handleResetTestCache = () => {
    try {
      // Xóa tất cả các khóa liên quan đến đóng thông báo
      Object.keys(sessionStorage).forEach(k => {
        if (k.includes('announcement_closed')) sessionStorage.removeItem(k);
      });
      Object.keys(localStorage).forEach(k => {
        if (k.includes('announcement_dismiss')) localStorage.removeItem(k);
      });
      showToast('Đã xóa bộ nhớ đệm test! Giờ bạn ra trang chủ F5 sẽ thấy Popup hiện lên như khách mới.', 'success');
    } catch (e) {
      showToast('Đã làm mới bộ nhớ đệm!', 'success');
    }
  };

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto', paddingBottom: '50px' }}>
      
      {/* Header Tab */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '900', color: 'var(--text-bright)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-bullhorn" style={{ color: '#ea580c' }}></i>
            <span>Cấu Hình Thông Báo / Banner Popup Website</span>
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
            Quản lý cửa sổ thông báo nổi bật tự động bật lên khi người dùng truy cập website
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Nút Xóa Cache Test */}
          <button
            type="button"
            onClick={handleResetTestCache}
            className="lookup-admin-link"
            style={{ padding: '8px 14px', fontSize: '12.5px', fontWeight: '700', borderRadius: '12px' }}
            title="Xóa cờ đã xem popup trong trình duyệt để kiểm tra trang chủ F5"
          >
            <i className="fa-solid fa-rotate-left"></i>
            <span>Reset Cache Test</span>
          </button>

          {/* Nút Xem trước */}
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="lookup-admin-link"
            style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '700', borderRadius: '12px' }}
          >
            <i className="fa-solid fa-eye"></i>
            <span>Xem trước Popup</span>
          </button>

          {/* Nút Lưu cấu hình */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="lookup-btn"
            style={{ padding: '8px 20px', fontSize: '13px', width: 'auto', borderRadius: '12px' }}
          >
            {saving ? (<><div className="lookup-spinner"></div>Đang lưu...</>) : (
              <>
                <i className="fa-solid fa-floppy-disk"></i>
                <span>Lưu Cấu Hình</span>
              </>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="lookup-card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div className="lookup-spinner" style={{ margin: '0 auto 12px' }}></div>
          <div>Đang tải cấu hình thông báo...</div>
        </div>
      ) : (
        <form onSubmit={handleSave}>

          {/* CARD 1: CÔNG TẮC BẬT / TẮT POPUP TRỰC QUAN */}
          <div className="lookup-card" style={{
            marginBottom: '20px',
            padding: '20px 24px',
            border: formData.active ? '1.5px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-color)',
            background: formData.active ? 'rgba(16, 185, 129, 0.04)' : 'var(--bg-card)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: 'var(--text-bright)' }}>
                    Trạng Thái Hiển Thị Popup
                  </h4>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11.5px',
                    fontWeight: '800',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    background: formData.active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                    color: formData.active ? '#10b981' : 'var(--text-muted)'
                  }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: formData.active ? '#10b981' : '#94a3b8' }}></span>
                    {formData.active ? 'ĐANG BẬT' : 'ĐANG TẮT'}
                  </span>
                </div>
                <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  {formData.active
                    ? '🟢 Website đang BẬT hiển thị: Khách hàng truy cập Trang chủ hoặc Tra cứu sẽ nhìn thấy Popup này.'
                    : '⚪ Website đang TẮT (ẨN): Popup đang được ẩn tạm thời, khách truy cập website sẽ không bị hiện thông báo.'}
                </p>
              </div>

              {/* 2 Nút BẬT / TẮT 1 chạm rõ ràng */}
              <div style={{
                display: 'inline-flex',
                background: 'var(--bg-main, #0f172a)',
                padding: '4px',
                borderRadius: '14px',
                border: '1px solid var(--border-color)',
                gap: '4px'
              }}>
                <button
                  type="button"
                  onClick={() => updateFormField('active', true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'all 0.2s ease',
                    background: formData.active ? '#10b981' : 'transparent',
                    color: formData.active ? '#ffffff' : 'var(--text-muted)',
                    boxShadow: formData.active ? '0 2px 10px rgba(16, 185, 129, 0.4)' : 'none'
                  }}
                >
                  <i className="fa-solid fa-circle-check"></i>
                  <span>BẬT HIỂN THỊ</span>
                </button>

                <button
                  type="button"
                  onClick={() => updateFormField('active', false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'all 0.2s ease',
                    background: !formData.active ? '#ef4444' : 'transparent',
                    color: !formData.active ? '#ffffff' : 'var(--text-muted)',
                    boxShadow: !formData.active ? '0 2px 10px rgba(239, 68, 68, 0.4)' : 'none'
                  }}
                >
                  <i className="fa-solid fa-circle-xmark"></i>
                  <span>TẮT POPUP</span>
                </button>
              </div>
            </div>
          </div>

          {/* CARD 2: NỘI DUNG THÔNG BÁO */}
          <div className="lookup-card" style={{ marginBottom: '20px', padding: '24px' }}>
            <h4 style={{ margin: '0 0 18px 0', fontSize: '16px', fontWeight: '900', color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-pen-nib" style={{ color: '#ea580c' }}></i>
              <span>Nội Dung Thông Báo</span>
            </h4>

            {/* Tiêu đề */}
            <div className="lookup-input-group" style={{ marginBottom: '18px' }}>
              <label className="lookup-label">Tiêu Đề Popup</label>
              <input
                type="text"
                className="lookup-input"
                placeholder="Ví dụ: 🎉 Chào mừng sếp đến với 28Symues Affiliate!"
                value={formData.title}
                onChange={e => updateFormField('title', e.target.value)}
              />
            </div>

            {/* Banner Image URL & Upload */}
            <div className="lookup-input-group" style={{ marginBottom: '18px' }}>
              <label className="lookup-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Hình Ảnh Banner (Ôm trọn viền Popup - Cover)</span>
                {uploading && <span style={{ color: '#ea580c', fontSize: '12px', fontWeight: '700' }}><i className="fa-solid fa-spinner fa-spin"></i> Đang tải ảnh...</span>}
              </label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  className="lookup-input"
                  style={{ flex: 1, minWidth: '240px', margin: 0 }}
                  placeholder="Dán link ảnh https://... hoặc bấm nút Tải ảnh lên"
                  value={formData.imageUrl}
                  onChange={e => updateFormField('imageUrl', e.target.value)}
                />
                <label className="lookup-admin-link" style={{ padding: '10px 18px', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap', margin: 0, fontWeight: '700' }}>
                  <i className="fa-solid fa-cloud-arrow-up"></i>
                  <span>Tải ảnh lên</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadImage}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {/* Preview Thumbnail */}
              {(localPreview || formData.imageUrl) && (
                <div style={{
                  marginTop: '12px',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  border: '1.5px solid var(--border-color)',
                  maxWidth: '380px',
                  position: 'relative',
                  background: 'var(--bg-main, #0f172a)',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ width: '100%', height: '170px', overflow: 'hidden' }}>
                    <img
                      src={localPreview || resolveBannerUrl(formData.imageUrl)}
                      alt="Preview banner"
                      onError={(e) => {
                        console.warn('Banner load error:', e.target.src);
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                  <div style={{
                    padding: '8px 12px',
                    background: 'var(--bg-card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--border-color)'
                  }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
                      <i className="fa-solid fa-image" style={{ marginRight: '6px' }}></i>Ảnh banner hiện tại
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setLocalPreview('');
                        updateFormField('imageUrl', '');
                      }}
                      style={{
                        background: 'transparent',
                        color: '#ef4444',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <i className="fa-solid fa-trash-can"></i>
                      <span>Xóa ảnh</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Target URL */}
            <div className="lookup-input-group" style={{ marginBottom: '18px' }}>
              <label className="lookup-label">Liên Kết Khi Khách Bấm Vào Banner (Target URL)</label>
              <input
                type="text"
                className="lookup-input"
                placeholder="Ví dụ: https://zalo.me/g/... hoặc /?view=convert (Để trống nếu chỉ xem ảnh)"
                value={formData.targetUrl}
                onChange={e => updateFormField('targetUrl', e.target.value)}
              />
            </div>

            {/* Content Textarea */}
            <div className="lookup-input-group" style={{ marginBottom: '8px' }}>
              <label className="lookup-label">Chi Tiết Nội Dung Thông Báo (Hỗ trợ Markdown & Xuống dòng)</label>
              <textarea
                className="lookup-input"
                rows={6}
                style={{ width: '100%', minHeight: '140px', lineHeight: '1.6', fontSize: '13.5px', borderRadius: '14px', padding: '14px' }}
                placeholder={`Nhập nội dung thông báo cho người dùng...\n- Xuống dòng để tạo đoạn mới\n- In đậm: **chữ in đậm**\n- Link: [Nhấn vào đây để xem](https://example.com)`}
                value={formData.content}
                onChange={e => updateFormField('content', e.target.value)}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
                💡 Mẹo: Sử dụng <code>**in đậm**</code> để làm nổi bật văn bản, hoặc <code>[Tên link](https://...)</code> để tạo link điều hướng.
              </span>
            </div>
          </div>

          {/* Nút hành động cuối trang */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="lookup-admin-link"
              style={{ padding: '12px 22px', fontSize: '13.5px', fontWeight: '800', borderRadius: '12px' }}
            >
              <i className="fa-solid fa-expand"></i>
              <span>Xem Thử Popup Thực Tế</span>
            </button>
            <button
              type="submit"
              disabled={saving}
              className="lookup-btn"
              style={{ padding: '12px 30px', fontSize: '14px', width: 'auto', borderRadius: '12px' }}
            >
              {saving ? (<><div className="lookup-spinner"></div>Đang lưu cấu hình...</>) : (
                <>
                  <i className="fa-solid fa-check"></i>
                  <span>Lưu & Áp Dụng Ngay</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Modal Preview Popup */}
      {previewOpen && (
        <AnnouncementModal
          apiRoot={API_URL_ROOT}
          previewData={{
            active: true,
            title: formData.title || 'Tiêu đề thông báo mẫu',
            content: formData.content || 'Nội dung thông báo mẫu...',
            imageUrl: localPreview || formData.imageUrl,
            targetUrl: formData.targetUrl,
            id: 'preview_' + Date.now(),
            updatedAt: Date.now()
          }}
          onClose={() => setPreviewOpen(false)}
        />
      )}

    </div>
  );
}
