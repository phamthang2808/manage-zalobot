import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';

const DEFAULT_CATEGORIES = [];
const DEFAULT_POSTS = [];

const SUGGESTED_IMAGES = [
  { label: 'Thương mại', url: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=800&auto=format&fit=crop&q=80' },
  { label: 'Công nghệ', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80' },
  { label: 'Tài chính', url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop&q=80' },
  { label: 'Marketing', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop&q=80' },
];

// Helper nén ảnh tự động qua Canvas (giảm từ 3-5MB xuống còn ~40-60KB, chống lỗi dung lượng)
const compressImage = (file, maxWidth = 800, quality = 0.75) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
};

// Helper nén trực tiếp chuỗi data URL nếu chuỗi quá dài
const compressDataUrl = (dataUrl, maxWidth = 800, quality = 0.75) => {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:image')) {
      return resolve(dataUrl);
    }
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

// Helper định dạng ngày hiển thị bài viết an toàn, chống Invalid Date triệt để
export const formatBlogDate = (post) => {
  if (!post) return new Date().toLocaleDateString('vi-VN');

  // 1. Kiểm tra publishedDate hoặc date
  const candidate = post.publishedDate || post.date;
  if (candidate && typeof candidate === 'string' && candidate !== 'Invalid Date' && candidate.trim() !== '') {
    const trimmed = candidate.trim();
    // Đã đúng định dạng dd/MM/yyyy hoặc d/M/yyyy
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
      return trimmed;
    }
    // Nếu là ISO chuỗi yyyy-MM-dd...
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('vi-VN');
    }
  }

  // 2. Kiểm tra createdAt từ server
  const rawCreated = post.createdAt;
  if (rawCreated) {
    if (Array.isArray(rawCreated) && rawCreated.length >= 3) {
      const y = rawCreated[0];
      const m = String(rawCreated[1]).padStart(2, '0');
      const d = String(rawCreated[2]).padStart(2, '0');
      return `${d}/${m}/${y}`;
    }
    if (typeof rawCreated === 'string' && rawCreated !== 'Invalid Date') {
      const parsed = new Date(rawCreated);
      if (!isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString('vi-VN');
      }
    }
  }

  // 3. Mặc định là ngày hôm nay
  return new Date().toLocaleDateString('vi-VN');
};

export default function BlogView() {
  const { setView, user, isAdmin, showToast, API_URL_ROOT } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const categoryContainerRef = useRef(null);
  const coverFileInputRef = useRef(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Danh mục động (Bỏ sạch các danh mục cứng cũ)
  const [categories, setCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('web_blog_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.filter(c => !['GUIDE', 'TIPS', 'SALE', 'SYSTEM'].includes(c.id));
      }
      return [];
    } catch (e) {
      return [];
    }
  });

  // Bài viết động (Bỏ sạch 4 bài viết mẫu gán cứng cũ và tự động sửa các bài bị Invalid Date)
  const [posts, setPosts] = useState(() => {
    try {
      const saved = localStorage.getItem('web_blog_posts');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed
          .filter(p => !['post_1', 'post_2', 'post_3', 'post_4'].includes(p.id))
          .map(p => {
            const formatted = formatBlogDate(p);
            return {
              ...p,
              date: formatted,
              publishedDate: formatted
            };
          });
      }
      return [];
    } catch (e) {
      return [];
    }
  });

  // Modals state
  const [readingPost, setReadingPost] = useState(null);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isCreateCatOpen, setIsCreateCatOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null); // Bài viết đang sửa

  // Form state tạo / sửa bài viết
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newImage, setNewImage] = useState(SUGGESTED_IMAGES[0]?.url || '');
  const [newSummary, setNewSummary] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newAuthor, setNewAuthor] = useState(user?.fullName || 'Admin');
  const [newReadTime, setNewReadTime] = useState('3 phút đọc');

  // Form state tạo danh mục
  const [newCatName, setNewCatName] = useState('');

  // Xử lý upload ảnh bìa từ file thiết bị (Có tự động nén ảnh)
  const handleCoverFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn file hình ảnh (PNG, JPG, WEBP)!', 'warning');
      return;
    }
    setUploadingCover(true);
    try {
      // 1. Tự động nén ảnh qua Canvas để dung lượng nhẹ và an toàn
      const compressedData = await compressImage(file, 800, 0.75);

      // 2. Thử upload lên server nếu backend có sẵn endpoint
      try {
        const token = sessionStorage.getItem('adminToken') || '';
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${API_URL_ROOT}/api/admin/announcement/upload-image`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
          credentials: 'include'
        });
        const data = await res.json();
        if (res.ok && (data.imageUrl || data.url)) {
          const fullUrl = (data.imageUrl || data.url).startsWith('http')
            ? (data.imageUrl || data.url)
            : `${API_URL_ROOT}${data.imageUrl || data.url}`;
          setNewImage(fullUrl);
          showToast('Tải lên ảnh bìa bài viết thành công! 🎉', 'success');
          return;
        }
      } catch (uploadErr) {}

      // 3. Fallback dùng ảnh nén tối ưu
      setNewImage(compressedData);
      showToast('Đã tải và tối ưu ảnh bìa thành công!', 'success');
    } catch (err) {
      showToast('Lỗi xử lý ảnh: ' + err.message, 'error');
    } finally {
      setUploadingCover(false);
      if (coverFileInputRef.current) coverFileInputRef.current.value = '';
    }
  };

  // Cuộn danh mục sang trái / phải
  const scrollCategories = (direction) => {
    if (categoryContainerRef.current) {
      categoryContainerRef.current.scrollBy({ left: direction * 220, behavior: 'smooth' });
    }
  };

  // Lưu danh mục vào localStorage
  const saveCategories = (newCats) => {
    setCategories(newCats);
    try {
      localStorage.setItem('web_blog_categories', JSON.stringify(newCats));
    } catch (e) {}
  };

  // Lưu bài viết vào localStorage
  const savePosts = (newPostsList) => {
    setPosts(newPostsList);
    try {
      localStorage.setItem('web_blog_posts', JSON.stringify(newPostsList));
    } catch (e) {}
  };

  // Tải bài viết từ Backend (Database)
  const fetchPostsFromBackend = async () => {
    try {
      const res = await fetch(`${API_URL_ROOT}/api/public/posts`);
      const json = await res.json();
      if (res.ok && Array.isArray(json.data)) {
        // Lọc bỏ bài gán cứng cũ và chuẩn hóa ngày đăng
        const cleanList = json.data
          .filter(p => !['post_1', 'post_2', 'post_3', 'post_4'].includes(p.id))
          .map(p => {
            const formatted = formatBlogDate(p);
            return {
              ...p,
              date: formatted,
              publishedDate: formatted
            };
          });
        setPosts(cleanList);
        try {
          localStorage.setItem('web_blog_posts', JSON.stringify(cleanList));
        } catch (e) {}
      }
    } catch (err) {
      console.warn('[Blog] Không thể lấy bài viết từ server, dùng cache offline:', err);
    }
  };

  useEffect(() => {
    fetchPostsFromBackend();
  }, []);

  // Mở modal tạo bài viết mới
  const handleOpenCreate = () => {
    setEditingPost(null);
    setNewTitle('');
    setNewCategory(categories[0]?.id || 'Chung');
    setNewImage(SUGGESTED_IMAGES[0]?.url || '');
    setNewSummary('');
    setNewContent('');
    setNewAuthor(user?.fullName || 'Admin');
    setNewReadTime('3 phút đọc');
    setIsCreatePostOpen(true);
  };

  // Mở modal sửa bài viết
  const handleOpenEdit = (e, post) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setEditingPost(post);
    setNewTitle(post.title || '');
    setNewCategory(post.category || (categories[0]?.id || 'Chung'));
    setNewImage(post.image || '');
    setNewSummary(post.summary || '');
    setNewContent(post.content || '');
    setNewAuthor(post.author || user?.fullName || 'Admin');
    setNewReadTime(post.readTime || '3 phút đọc');
    setIsCreatePostOpen(true);
  };

  // Xử lý tạo danh mục mới
  const handleCreateCategory = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      showToast('Vui lòng nhập tên danh mục!', 'warning');
      return;
    }
    const slug = 'CAT_' + Date.now().toString(36).toUpperCase();
    const createdCat = { id: slug, label: newCatName.trim() };
    const updated = [...categories, createdCat];
    saveCategories(updated);
    setNewCategory(slug);
    setNewCatName('');
    setIsCreateCatOpen(false);
    showToast(`Đã tạo danh mục "${createdCat.label}" thành công! 🎉`, 'success');
  };

  // Xóa danh mục tùy chọn
  const handleDeleteCategory = (catId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa danh mục này không?')) {
      const updated = categories.filter(c => c.id !== catId);
      saveCategories(updated);
      if (selectedCategory === catId) setSelectedCategory('ALL');
      if (newCategory === catId) setNewCategory(updated[0]?.id || 'Chung');
      showToast('Đã xóa danh mục thành công!', 'info');
    }
  };

  const [savingPost, setSavingPost] = useState(false);

  // Xử lý Lưu bài viết (Tạo mới hoặc Sửa)
  const handleSavePost = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast('Vui lòng nhập tiêu đề bài viết!', 'warning');
      return;
    }
    if (!newSummary.trim()) {
      showToast('Vui lòng nhập đoạn tóm tắt bài viết!', 'warning');
      return;
    }
    if (!newContent.trim()) {
      showToast('Vui lòng nhập nội dung chi tiết bài viết!', 'warning');
      return;
    }

    setSavingPost(true);
    let postImage = newImage.trim() || SUGGESTED_IMAGES[0]?.url || '';
    if (postImage.startsWith('data:image') && postImage.length > 50000) {
      try {
        postImage = await compressDataUrl(postImage, 800, 0.75);
      } catch (compressErr) {
        console.warn('Lỗi nén ảnh data url:', compressErr);
      }
    }

    const todayFormatted = new Date().toLocaleDateString('vi-VN');
    const existingDate = editingPost ? formatBlogDate(editingPost) : todayFormatted;
    const finalDate = (existingDate && existingDate !== 'Invalid Date') ? existingDate : todayFormatted;

    const postPayload = {
      title: newTitle.trim(),
      slug: newTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: newCategory || (categories[0]?.id || 'Chung'),
      date: finalDate,
      publishedDate: finalDate,
      readTime: newReadTime || '3 phút đọc',
      author: newAuthor.trim() || user?.fullName || 'Admin',
      image: postImage,
      summary: newSummary.trim(),
      content: newContent.trim()
    };

    try {
      if (editingPost) {
        // SỬA BÀI VIẾT
        let updatedPost = null;
        try {
          const res = await fetch(`${API_URL_ROOT}/api/public/posts/${editingPost.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(postPayload)
          });
          const json = await res.json();
          if (res.ok && json.data) {
            updatedPost = { ...postPayload, ...json.data };
          }
        } catch (apiErr) {
          console.warn('Lỗi gọi API cập nhật bài viết:', apiErr);
        }

        if (!updatedPost) {
          updatedPost = { ...editingPost, ...postPayload };
        }
        updatedPost.date = formatBlogDate(updatedPost);
        updatedPost.publishedDate = updatedPost.date;

        const newPostsList = posts.map(p => (p.id === editingPost.id || String(p.id) === String(editingPost.id)) ? updatedPost : p);
        savePosts(newPostsList);

        if (readingPost && (readingPost.id === editingPost.id || String(readingPost.id) === String(editingPost.id))) {
          setReadingPost(updatedPost);
        }

        setIsCreatePostOpen(false);
        setEditingPost(null);
        showToast('Đã lưu bài viết thành công! 🎉', 'success');
      } else {
        // TẠO BÀI VIẾT MỚI (Ngày đăng là ngày đăng bài luôn)
        let createdPost = null;
        try {
          const res = await fetch(`${API_URL_ROOT}/api/public/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(postPayload)
          });
          const json = await res.json();
          if (res.ok && json.data) {
            createdPost = { ...postPayload, ...json.data };
          }
        } catch (apiErr) {
          console.warn('Lỗi gọi API lưu bài viết:', apiErr);
        }

        if (!createdPost) {
          createdPost = { ...postPayload, id: 'post_' + Date.now() };
        }
        createdPost.date = formatBlogDate(createdPost);
        createdPost.publishedDate = createdPost.date;

        const newPostsList = [createdPost, ...posts.filter(p => p.id !== createdPost.id && String(p.id) !== String(createdPost.id))];
        savePosts(newPostsList);

        // Đảm bảo hiển thị ngay bài viết mới tạo
        setSelectedCategory('ALL');
        setSearchQuery('');

        setIsCreatePostOpen(false);
        setEditingPost(null);
        setNewTitle('');
        setNewSummary('');
        setNewContent('');
        setNewImage('');
        showToast('Đã lưu bài viết thành công! 🎉', 'success');
      }
    } catch (err) {
      showToast('Lỗi khi lưu bài viết: ' + err.message, 'error');
    } finally {
      setSavingPost(false);
    }
  };

  // Xử lý xóa bài viết
  const handleDeletePost = async (e, postId) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này không?')) {
      try {
        await fetch(`${API_URL_ROOT}/api/public/posts/${postId}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.warn('Lỗi gọi API xóa bài viết:', err);
      }
      const updated = posts.filter(p => p.id !== postId && String(p.id) !== String(postId));
      savePosts(updated);
      if (readingPost && (readingPost.id === postId || String(readingPost.id) === String(postId))) {
        setReadingPost(null);
      }
      showToast('Đã xóa bài viết thành công!', 'info');
    }
  };

  // Lọc bài viết
  const filteredPosts = posts.filter(p => {
    if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.summary.toLowerCase().includes(q);
    }
    return true;
  });

  const allDisplayCategories = [{ id: 'ALL', label: 'Tất cả bài viết' }, ...categories];

  return (
    <div className="blog-view-wrapper" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* 1. HERO BANNER BLOG */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(234, 88, 12, 0.04) 100%)',
        border: '1.5px solid rgba(249, 115, 22, 0.25)',
        borderRadius: '24px',
        padding: '36px 28px',
        textAlign: 'center',
        marginBottom: '26px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 14px',
          borderRadius: '20px',
          background: 'rgba(249, 115, 22, 0.15)',
          color: 'var(--color-primary, #ea580c)',
          fontSize: '12px',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
          marginBottom: '12px'
        }}>
          <i className="fa-regular fa-newspaper"></i> 28Symues Blog &amp; Tin Tức
        </span>

        <h1 style={{ fontSize: '26px', fontWeight: '750', color: 'var(--text-bright)', margin: '0 0 10px 0', lineHeight: '1.3' }}>
          Cẩm Nang Mua Sắm &amp; Kiếm Tiền Affiliate Tự Động
        </h1>

        <p style={{ fontSize: '14.5px', color: 'var(--text-muted)', maxWidth: '640px', margin: '0 auto 20px', lineHeight: '1.6' }}>
          Tổng hợp kiến thức thực chiến, hướng dẫn cài đặt bot Zalo, mẹo săn mã giảm giá và chia sẻ kinh nghiệm gia tăng hoa hồng mua sắm mỗi ngày.
        </p>

        {/* Nút Hành Động Thêm Bài Viết & Tạo Danh Mục (CHỈ DÀNH CHO ADMIN) */}
        {isAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '22px' }}>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="lookup-btn"
              style={{ width: 'auto', padding: '10px 22px', fontSize: '13.5px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(249, 115, 22, 0.35)' }}
            >
              <i className="fa-solid fa-pen-to-square"></i>
              <span>+ Viết Bài Mới</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCreateCatOpen(true)}
              className="lookup-admin-link"
              style={{ fontSize: '13px', padding: '10px 18px', borderRadius: '12px' }}
            >
              <i className="fa-solid fa-folder-plus"></i>
              <span>+ Thêm Danh Mục</span>
            </button>
          </div>
        )}

        {/* Search Box */}
        <div style={{ maxWidth: '480px', margin: '0 auto', position: 'relative' }}>
          <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
          <input
            type="text"
            className="lookup-input"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm bài viết, mẹo kiếm tiền, hướng dẫn..."
            style={{ paddingLeft: '44px', borderRadius: '24px', background: 'var(--bg-card)' }}
          />
        </div>
      </div>

      {/* 2. CATEGORY TABS VỚI NÚT LƯỚT QUA TRỰC QUAN */}
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '24px',
        width: '100%'
      }}>
        {/* Nút lướt sang trái */}
        <button
          type="button"
          onClick={() => scrollCategories(-1)}
          title="Lướt sang trái"
          aria-label="Lướt sang trái"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'var(--bg-card, rgba(30, 41, 59, 0.9))',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))',
            color: 'var(--text-bright, #ffffff)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.25)',
            flexShrink: 0,
            fontSize: '12px',
            transition: 'all 0.2s ease',
            zIndex: 2
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ea580c'; e.currentTarget.style.borderColor = '#ea580c'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-bright, #ffffff)'; e.currentTarget.style.borderColor = 'var(--border-color, rgba(255, 255, 255, 0.15))'; }}
        >
          <i className="fa-solid fa-chevron-left"></i>
        </button>

        {/* Thanh chứa danh mục cuộn ngang */}
        <div
          ref={categoryContainerRef}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            padding: '4px 2px',
            scrollbarWidth: 'none',
            flex: 1,
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {allDisplayCategories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '8px 18px',
                borderRadius: '20px',
                border: 'none',
                fontSize: '13px',
                fontWeight: selectedCategory === cat.id ? '800' : '600',
                background: selectedCategory === cat.id ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' : 'var(--bg-card)',
                color: selectedCategory === cat.id ? '#ffffff' : 'var(--text-muted)',
                border: selectedCategory === cat.id ? 'none' : '1px solid var(--border-color)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.2s ease',
                boxShadow: selectedCategory === cat.id ? '0 4px 12px rgba(249, 115, 22, 0.3)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{cat.label}</span>
              {isAdmin && cat.id !== 'ALL' && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCategory(cat.id);
                  }}
                  title="Xóa danh mục này"
                  style={{
                    fontSize: '11px',
                    opacity: 0.7,
                    padding: '0 4px',
                    borderRadius: '50%',
                    marginLeft: '2px',
                    lineHeight: '1',
                    color: selectedCategory === cat.id ? '#ffffff' : '#ef4444'
                  }}
                >
                  ✕
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Nút lướt sang phải */}
        <button
          type="button"
          onClick={() => scrollCategories(1)}
          title="Lướt sang phải"
          aria-label="Lướt sang phải"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'var(--bg-card, rgba(30, 41, 59, 0.9))',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))',
            color: 'var(--text-bright, #ffffff)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.25)',
            flexShrink: 0,
            fontSize: '12px',
            transition: 'all 0.2s ease',
            zIndex: 2
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ea580c'; e.currentTarget.style.borderColor = '#ea580c'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-bright, #ffffff)'; e.currentTarget.style.borderColor = 'var(--border-color, rgba(255, 255, 255, 0.15))'; }}
        >
          <i className="fa-solid fa-chevron-right"></i>
        </button>
      </div>

      {/* 3. POSTS GRID */}
      {filteredPosts.length === 0 ? (
        <div className="lookup-card" style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <i className="fa-regular fa-folder-open" style={{ fontSize: '36px', marginBottom: '12px', color: '#ea580c' }}></i>
          <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-bright)' }}>Chưa có bài viết nào</div>
          <p style={{ margin: '8px 0 16px 0', fontSize: '13px', maxWidth: '460px', marginLeft: 'auto', marginRight: 'auto' }}>
            {isAdmin ? 'Hiện tại danh sách bài viết đang trống. Hãy bấm nút "Viết Bài Mới" để chia sẻ bài viết đầu tiên.' : 'Hiện tại chưa có bài viết nào trong danh mục này.'}
          </p>
          {isAdmin && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="lookup-btn"
              style={{ width: 'auto', margin: '0 auto', padding: '10px 22px', fontSize: '13.5px' }}
            >
              <i className="fa-solid fa-plus"></i>
              <span>+ Viết Bài Mới Ngay</span>
            </button>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '22px'
        }}>
          {filteredPosts.map(post => {
            const catObj = categories.find(c => c.id === post.category);
            const catLabel = catObj?.label || post.category;

            return (
              <article
                key={post.id}
                onClick={() => setReadingPost(post)}
                className="lookup-card"
                style={{
                  padding: '0',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  margin: 0,
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.12)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.03)';
                }}
              >
                {/* Thumbnail */}
                <div style={{ height: '180px', width: '100%', position: 'relative', overflow: 'hidden' }}>
                  <img
                    src={post.image}
                    alt={post.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <span style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    background: 'rgba(0, 0, 0, 0.65)',
                    backdropFilter: 'blur(4px)',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: '800'
                  }}>
                    {post.readTime}
                  </span>

                  <span style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    background: 'rgba(234, 88, 12, 0.85)',
                    backdropFilter: 'blur(4px)',
                    color: '#ffffff',
                    fontSize: '10.5px',
                    fontWeight: '700'
                  }}>
                    {catLabel}
                  </span>
                </div>

                {/* Body */}
                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{formatBlogDate(post)}</span>
                        <span>•</span>
                        <span>{post.author}</span>
                      </div>
                      {isAdmin && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={(e) => handleOpenEdit(e, post)}
                            title="Sửa bài viết"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-subtle)',
                              cursor: 'pointer',
                              padding: '2px 4px',
                              fontSize: '12px'
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = '#ea580c'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-subtle)'}
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeletePost(e, post.id)}
                            title="Xóa bài viết"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-subtle)',
                              cursor: 'pointer',
                              padding: '2px 4px',
                              fontSize: '12px'
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-subtle)'}
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      )}
                    </div>

                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '800',
                      color: 'var(--text-bright)',
                      margin: '0 0 10px 0',
                      lineHeight: '1.45',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {post.title}
                    </h3>

                    <p style={{
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                      margin: '0 0 16px 0',
                      lineHeight: '1.55',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {post.summary}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--color-primary, #ea580c)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span>Đọc chi tiết</span>
                      <i className="fa-solid fa-arrow-right" style={{ fontSize: '11px' }}></i>
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
                      28Symues Official
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ===================== MODAL ĐỌC CHI TIẾT BÀI VIẾT ===================== */}
      {readingPost && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '16px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '760px',
            maxHeight: '90vh',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header Image */}
            <div style={{ position: 'relative', height: '260px', width: '100%', overflow: 'hidden', flexShrink: 0 }}>
              <img
                src={readingPost.image}
                alt={readingPost.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <button
                type="button"
                onClick={() => setReadingPost(null)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(0, 0, 0, 0.65)',
                  backdropFilter: 'blur(6px)',
                  color: '#ffffff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>

              <div style={{
                position: 'absolute',
                bottom: '16px',
                left: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  background: 'rgba(234, 88, 12, 0.9)',
                  color: '#ffffff',
                  fontSize: '11.5px',
                  fontWeight: '800'
                }}>
                  {categories.find(c => c.id === readingPost.category)?.label || readingPost.category}
                </span>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  background: 'rgba(0, 0, 0, 0.65)',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: '700'
                }}>
                  {readingPost.readTime}
                </span>
              </div>
            </div>

            {/* Scrollable Content */}
            <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                <i className="fa-regular fa-calendar"></i>
                <span>{formatBlogDate(readingPost)}</span>
                <span>•</span>
                <i className="fa-regular fa-user"></i>
                <span>Tác giả: <b>{readingPost.author}</b></span>
              </div>

              <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-bright)', margin: '0 0 16px 0', lineHeight: '1.4' }}>
                {readingPost.title}
              </h2>

              <div style={{
                padding: '14px 18px',
                borderRadius: '14px',
                background: 'rgba(249, 115, 22, 0.08)',
                borderLeft: '4px solid #ea580c',
                fontSize: '14px',
                color: 'var(--text-bright)',
                lineHeight: '1.6',
                marginBottom: '20px',
                fontStyle: 'italic'
              }}>
                {readingPost.summary}
              </div>

              <div style={{ fontSize: '14.5px', color: 'var(--text-bright)', lineHeight: '1.8', whiteSpace: 'pre-line' }}>
                {readingPost.content || readingPost.summary}
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', background: 'var(--bg-main)' }}>
              {isAdmin && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      const p = readingPost;
                      setReadingPost(null);
                      handleOpenEdit(e, p);
                    }}
                    style={{
                      background: 'rgba(234, 88, 12, 0.1)',
                      border: '1px solid rgba(234, 88, 12, 0.3)',
                      color: '#ea580c',
                      borderRadius: '10px',
                      padding: '8px 16px',
                      fontSize: '12.5px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <i className="fa-solid fa-pen-to-square"></i>
                    <span>Sửa bài viết</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeletePost(e, readingPost.id)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#ef4444',
                      borderRadius: '10px',
                      padding: '8px 16px',
                      fontSize: '12.5px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <i className="fa-solid fa-trash-can"></i>
                    <span>Xóa bài này</span>
                  </button>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
                <button
                  type="button"
                  onClick={() => setReadingPost(null)}
                  className="lookup-btn"
                  style={{ width: 'auto', padding: '8px 20px', fontSize: '13px' }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL VIẾT BÀI MỚI ===================== */}
      {isCreatePostOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '16px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '680px',
            maxHeight: '92vh',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header Modal */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-main)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(249, 115, 22, 0.15)', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                  <i className={`fa-solid ${editingPost ? 'fa-pen-to-square' : 'fa-pen-nib'}`}></i>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: 'var(--text-bright)' }}>
                    {editingPost ? 'Chỉnh Sửa Bài Viết' : 'Soạn Thảo Bài Viết Mới'}
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {editingPost ? 'Cập nhật nội dung bài viết và lưu thay đổi' : 'Tạo bài viết hướng dẫn, mẹo kiếm tiền hoặc chia sẻ deal hot'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setIsCreatePostOpen(false); setEditingPost(null); }}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSavePost} style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Tiêu đề */}
              <div className="lookup-input-group" style={{ margin: 0 }}>
                <label className="lookup-label">Tiêu đề bài viết (*)</label>
                <input
                  type="text"
                  className="lookup-input"
                  placeholder="VD: Bí quyết tối ưu doanh thu affiliate Shopee & TikTok..."
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  required
                />
              </div>

              {/* Danh mục & Tác giả */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div className="lookup-input-group" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label className="lookup-label" style={{ margin: 0 }}>Danh mục bài viết</label>
                    <button
                      type="button"
                      onClick={() => setIsCreateCatOpen(true)}
                      style={{ background: 'none', border: 'none', color: '#ea580c', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      + Tạo danh mục mới
                    </button>
                  </div>
                  <select
                    className="lookup-input"
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    style={{ cursor: 'pointer' }}
                  >
                    {categories.length === 0 && <option value="Chung">Mặc định (Chung)</option>}
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div className="lookup-input-group" style={{ margin: 0 }}>
                  <label className="lookup-label">Tác giả</label>
                  <input
                    type="text"
                    className="lookup-input"
                    placeholder="Tên tác giả"
                    value={newAuthor}
                    onChange={e => setNewAuthor(e.target.value)}
                  />
                </div>
              </div>

              {/* Ảnh bìa */}
              <div className="lookup-input-group" style={{ margin: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label className="lookup-label" style={{ margin: 0 }}>Ảnh bìa đại diện bài viết (*)</label>
                  <div>
                    <input
                      ref={coverFileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleCoverFileUpload}
                    />
                    <button
                      type="button"
                      disabled={uploadingCover}
                      onClick={() => coverFileInputRef.current?.click()}
                      style={{
                        padding: '4px 10px',
                        background: 'rgba(234, 88, 12, 0.1)',
                        border: '1px solid rgba(234, 88, 12, 0.4)',
                        color: '#ea580c',
                        borderRadius: '8px',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <i className={`fa-solid ${uploadingCover ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-up'}`}></i>
                      <span>{uploadingCover ? 'Đang tải lên...' : 'Tải ảnh từ máy'}</span>
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  className="lookup-input"
                  placeholder="Hoặc dán URL ảnh trực tiếp (https://...)"
                  value={newImage}
                  onChange={e => setNewImage(e.target.value)}
                  style={{ marginBottom: '8px' }}
                />

                {/* Preview ảnh bìa đã chọn */}
                {newImage && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 12px',
                    background: 'var(--bg-main)',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    marginBottom: '8px'
                  }}>
                    <img
                      src={newImage}
                      alt="Xem trước ảnh bìa"
                      style={{
                        width: '60px',
                        height: '42px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)'
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0, fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-bright)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Ảnh bìa hiện tại
                      </div>
                      <div style={{ fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {newImage.startsWith('data:') ? 'Ảnh tải lên từ thiết bị' : newImage}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewImage('')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#dc2626',
                        cursor: 'pointer',
                        padding: '4px 6px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                      title="Xóa ảnh này"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Mẫu ảnh gợi ý:</span>
                  {SUGGESTED_IMAGES.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setNewImage(img.url)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: newImage === img.url ? 'rgba(249, 115, 22, 0.2)' : 'var(--bg-main)',
                        border: '1px solid ' + (newImage === img.url ? '#ea580c' : 'var(--border-color)'),
                        color: newImage === img.url ? '#ea580c' : 'var(--text-bright)',
                        cursor: 'pointer'
                      }}
                    >
                      {img.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tóm tắt */}
              <div className="lookup-input-group" style={{ margin: 0 }}>
                <label className="lookup-label">Tóm tắt ngắn bài viết (*)</label>
                <textarea
                  className="lookup-input"
                  rows={2}
                  placeholder="Mô tả ngắn gọn 1-2 câu tóm tắt chủ đề chính của bài viết..."
                  value={newSummary}
                  onChange={e => setNewSummary(e.target.value)}
                  required
                />
              </div>

              {/* Nội dung chi tiết */}
              <div className="lookup-input-group" style={{ margin: 0 }}>
                <label className="lookup-label">Nội dung chi tiết bài viết (*)</label>
                <textarea
                  className="lookup-input"
                  rows={6}
                  placeholder="Nhập toàn bộ nội dung hướng dẫn, chia sẻ chi tiết..."
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  style={{ lineHeight: '1.6' }}
                  required
                />
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatePostOpen(false);
                    setEditingPost(null);
                  }}
                  className="lookup-admin-link"
                  style={{ padding: '10px 18px', fontSize: '13px' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingPost}
                  className="lookup-btn"
                  style={{ width: 'auto', padding: '10px 24px', fontSize: '13.5px' }}
                >
                  {savingPost ? (
                    <>
                      <div className="lookup-spinner"></div>
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-check"></i>
                      <span>Lưu</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL TẠO DANH MỤC MỚI ===================== */}
      {isCreateCatOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999,
          padding: '16px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '440px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(249, 115, 22, 0.15)', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                  <i className="fa-solid fa-folder-plus"></i>
                </div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: 'var(--text-bright)' }}>Thêm Danh Mục Mới</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateCatOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleCreateCategory} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="lookup-input-group" style={{ margin: 0 }}>
                <label className="lookup-label">Tên danh mục (*)</label>
                <input
                  type="text"
                  className="lookup-input"
                  placeholder="VD: Kiến thức SEO, Livestream Shopee..."
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateCatOpen(false)}
                  className="lookup-admin-link"
                  style={{ flex: 1, padding: '10px' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="lookup-btn"
                  style={{ flex: 1, padding: '10px' }}
                >
                  Tạo danh mục
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
