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

  const fetchAnnouncement = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const res = await fetch(`${API_URL_ROOT}/api/admin/announcement`, {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include'
      });

      if (res.ok) {
        const resData = await res.json();
        if (resData && resData.data) {
          setFormData({
            active: resData.data.active !== undefined ? resData.data.active : true,
            title: resData.data.title || '',
            imageUrl: normalizeImgUrl(resData.data.imageUrl || ''),
            targetUrl: resData.data.targetUrl || '',
            content: resData.data.content || ''
          });
          setLoading(false);
          return;
        }
      }

      // Fallback localStorage
      const local = localStorage.getItem('site_announcement_config');
      if (local) {
        const parsed = JSON.parse(local);
        setFormData({
          active: parsed.active !== undefined ? parsed.active : true,
          title: parsed.title || '',
          imageUrl: parsed.imageUrl || '',
          targetUrl: parsed.targetUrl || '',
          content: parsed.content || ''
        });
      }
    } catch (err) {
      const local = localStorage.getItem('site_announcement_config');
      if (local) {
        try {
          const parsed = JSON.parse(local);
          setFormData({
            active: parsed.active !== undefined ? parsed.active : true,
            title: parsed.title || '',
            imageUrl: parsed.imageUrl || '',
            targetUrl: parsed.targetUrl || '',
            content: parsed.content || ''
          });
        } catch (e) {}
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncement();
  }, []);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      // 1. Lưu dự phòng localStorage để trang khách dùng ngay
      const toSave = {
        ...formData,
        id: Date.now(),
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('site_announcement_config', JSON.stringify(toSave));

      // 2. Gửi API backend
      const token = sessionStorage.getItem('adminToken') || '';
      const res = await fetch(`${API_URL_ROOT}/api/admin/announcement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Lỗi server');
      }

      showToast('Đã lưu cấu hình Popup Thông Báo thành công! 🎉', 'success');
    } catch (err) {
      showToast('Đã lưu cấu hình cục bộ (Offline/Local)! Khách vào web sẽ thấy thông báo này.', 'info');
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

      const resData = await res.json();
      if (res.ok && (resData.imageUrl || resData.url)) {
        const url = normalizeImgUrl(resData.imageUrl || resData.url);
        setFormData(prev => ({ ...prev, imageUrl: url }));
        showToast('Upload ảnh banner thành công!', 'success');
      } else {
        // Fallback đọc dạng Base64
        const reader = new FileReader();
        reader.onload = () => {
          setFormData(prev => ({ ...prev, imageUrl: reader.result }));
          showToast('Đã chèn ảnh banner thành công!', 'success');
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      // Fallback đọc dạng Base64
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result }));
        showToast('Đã chèn ảnh banner trực tiếp!', 'success');
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Header Tab */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '900', color: 'var(--text-bright)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-bullhorn" style={{ color: '#ea580c' }}></i>
            <span>Cấu Hình Thông Báo / Banner Popup Website</span>
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
            Tự động hiển thị Popup nổi bật khi khách hàng truy cập website (tương tự Mai Lan)
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="lookup-admin-link"
            style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '700', borderRadius: '12px' }}
          >
            <i className="fa-solid fa-eye"></i>
            <span>Xem trước Popup</span>
          </button>
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
          {/* Card 1: Bật / Tắt trạng thái */}
          <div className="lookup-card" style={{ marginBottom: '20px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-bright)' }}>
                  Trạng Thái Hiển Thị Popup
                </h4>
                <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  {formData.active
                    ? '🟢 Đang BẬT — Popup sẽ tự động bật lên khi người dùng vào website'
                    : '⚪ Đang TẮT — Website sẽ không hiển thị popup'}
                </p>
              </div>

              <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', gap: '10px' }}>
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={e => setFormData({ ...formData, active: e.target.checked })}
                  style={{ width: '22px', height: '22px', accentColor: '#ea580c', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', fontWeight: '800', color: formData.active ? '#ea580c' : 'var(--text-muted)' }}>
                  {formData.active ? 'BẬT HIỂN THỊ' : 'TẮT POPUP'}
                </span>
              </label>
            </div>
          </div>

          {/* Card 2: Nội dung thông báo */}
          <div className="lookup-card" style={{ marginBottom: '20px', padding: '22px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '15.5px', fontWeight: '800', color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-pen-nib" style={{ color: '#ea580c' }}></i>
              <span>Nội Dung Thông Báo</span>
            </h4>

            {/* Tiêu đề */}
            <div className="lookup-input-group" style={{ marginBottom: '16px' }}>
              <label className="lookup-label">Tiêu Đề Popup</label>
              <input
                type="text"
                className="lookup-input"
                placeholder="Ví dụ: 🎉 THÔNG BÁO QUAN TRỌNG: SĂN SALE HOÀN TIỀN CỰC KHỦNG!"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            {/* Banner Image URL & Upload */}
            <div className="lookup-input-group" style={{ marginBottom: '16px' }}>
              <label className="lookup-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Hình Ảnh Banner (Không bắt buộc)</span>
                {uploading && <span style={{ color: '#ea580c', fontSize: '12px' }}>Đang upload ảnh...</span>}
              </label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  className="lookup-input"
                  style={{ flex: 1, minWidth: '220px', margin: 0 }}
                  placeholder="Dán link ảnh https://... hoặc bấm nút Tải ảnh lên"
                  value={formData.imageUrl}
                  onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                />
                <label className="lookup-admin-link" style={{ padding: '10px 16px', fontSize: '12.5px', cursor: 'pointer', whiteSpace: 'nowrap', margin: 0 }}>
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

              {(localPreview || formData.imageUrl) && (
                <div style={{ marginTop: '10px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', maxWidth: '340px', position: 'relative', background: 'var(--bg-secondary, rgba(0,0,0,0.04))' }}>
                  <img
                    src={localPreview || resolveBannerUrl(formData.imageUrl)}
                    alt="Preview banner"
                    onError={(e) => {
                      console.warn('Banner load error:', e.target.src);
                    }}
                    style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', display: 'block' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setLocalPreview('');
                      setFormData(prev => ({ ...prev, imageUrl: '' }));
                    }}
                    style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.65)', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Xóa ảnh"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Target URL */}
            <div className="lookup-input-group" style={{ marginBottom: '16px' }}>
              <label className="lookup-label">Liên Kết Khi Bấm Vào Banner (Target URL)</label>
              <input
                type="text"
                className="lookup-input"
                placeholder="Ví dụ: https://zalo.me/g/... hoặc /?view=convert"
                value={formData.targetUrl}
                onChange={e => setFormData({ ...formData, targetUrl: e.target.value })}
              />
            </div>

            {/* Content Textarea */}
            <div className="lookup-input-group" style={{ marginBottom: '8px' }}>
              <label className="lookup-label">Chi Tiết Nội Dung Thông Báo (Hỗ trợ Markdown)</label>
              <textarea
                className="lookup-input"
                rows={6}
                style={{ width: '100%', minHeight: '140px', lineHeight: '1.6', fontSize: '13.5px', borderRadius: '14px', padding: '14px' }}
                placeholder={`Nhập nội dung thông báo cho người dùng...\n- Xuống dòng để tạo đoạn mới\n- In đậm: **chữ in đậm**\n- Link: [Nhấn vào đây để xem](https://example.com)`}
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
                💡 Mẹo: Sử dụng <code>**in đậm**</code> để làm nổi bật văn bản, hoặc <code>[Tên link](https://...)</code> để tạo link điều hướng.
              </span>
            </div>
          </div>

          {/* Nút hành động cuối trang */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="lookup-admin-link"
              style={{ padding: '12px 20px', fontSize: '13.5px', fontWeight: '700', borderRadius: '12px' }}
            >
              <i className="fa-solid fa-expand"></i>
              <span>Xem Thử Popup Thực Tế</span>
            </button>
            <button
              type="submit"
              disabled={saving}
              className="lookup-btn"
              style={{ padding: '12px 28px', fontSize: '14px', width: 'auto', borderRadius: '12px' }}
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
            ...formData,
            imageUrl: localPreview || formData.imageUrl,
            id: 'preview',
            updatedAt: 'now'
          }}
          onClose={() => setPreviewOpen(false)}
        />
      )}

    </div>
  );
}
