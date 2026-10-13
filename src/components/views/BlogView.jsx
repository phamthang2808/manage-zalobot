import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';

const DEFAULT_CATEGORIES = [
  { id: 'GUIDE', label: 'Hướng dẫn sử dụng' },
  { id: 'TIPS', label: 'Mẹo kiếm tiền Affiliate' },
  { id: 'SALE', label: 'Săn sale & Mã giảm giá' },
  { id: 'SYSTEM', label: 'Cập nhật hệ thống' },
];

const DEFAULT_POSTS = [
  {
    id: 'post_1',
    title: 'Hướng dẫn tự động chuyển đổi link Shopee & TikTok Shop nhận hoa hồng hoàn tiền đến 80%',
    slug: 'huong-dan-chuyen-doi-link-shopee-tiktok',
    category: 'GUIDE',
    date: '12/10/2026',
    readTime: '3 phút đọc',
    author: 'Phạm Thắng',
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80',
    summary: 'Khám phá bí quyết tạo thu nhập thụ động mỗi ngày khi mua sắm online trên Shopee, TikTok Shop, Lazada và ShopeeFood với hệ thống Zalo Bot 28Symues.',
    content: `Chào các sếp! Mua sắm online hiện đã trở thành thói quen mỗi ngày, nhưng hầu hết mọi người đều bỏ lỡ một khoản hoàn tiền hoa hồng cực kỳ lớn từ 5% đến hơn 30% giá trị đơn hàng.

1. Nguyên lý hoạt động:
Mỗi khi sếp cần mua bất kỳ món hàng nào trên Shopee, TikTok Shop, Lazada hay ShopeeFood, chỉ cần copy link sản phẩm và dán vào công cụ chuyển đổi link của 28Symues. Hệ thống bot sẽ tự động gắn mã tiếp thị affiliate độc quyền của sếp vào liên kết.

2. Các bước thực hiện:
• Bước 1: Vào ứng dụng Shopee / TikTok Shop, bấm nút Chia sẻ (Share) -> Sao chép liên kết.
• Bước 2: Dán link vào ô chuyển đổi link trên Web Portal hoặc gửi trực tiếp vào nhóm Zalo.
• Bước 3: Nhấp vào link tiếp thị vừa được tạo ra để đặt hàng như bình thường.
• Bước 4: Sau khi đặt hàng thành công 5-10 phút, hệ thống sẽ tự động ghi nhận đơn vào mục "Đơn hàng đã đặt" và tích lũy tiền hoa hồng vào Ví của sếp!

3. Lưu ý quan trọng:
Để không bị mất hoa hồng, sếp hãy bấm vào link tiếp thị rồi ấn Mua ngay hoặc thêm vào giỏ hàng và thanh toán trong cùng phiên duyệt web, tránh click vào link tiếp thị của người khác đè cookie!`
  },
  {
    id: 'post_2',
    title: 'Top 5 sai lầm khiến bạn bị mất hoa hồng Shopee và cách phòng tránh triệt để',
    slug: 'sai-lam-mat-hoa-hong-shopee',
    category: 'TIPS',
    date: '10/10/2026',
    readTime: '5 phút đọc',
    author: 'Admin 28Symues',
    image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&auto=format&fit=crop&q=80',
    summary: 'Tại sao đơn hàng hoàn thành nhưng không nhận được hoa hồng? Tìm hiểu về cache live stream, video ưu tiên và cách mua hàng giữ nguyên cookie chuyển đổi link.',
    content: `Rất nhiều bạn thắc mắc tại sao mình đã chuyển đổi link và mua hàng nhưng lại không thấy đơn hiển thị hoa hồng hoặc bị ghi nhận 0đ. Dưới đây là 5 nguyên nhân phổ biến nhất:

1. Bị đè cookie bởi Live Stream hoặc Shopee Video:
Shopee có cơ chế ưu tiên hoa hồng cho người phát Live hoặc Video ngắn. Nếu bạn bấm link tiếp thị xong lại bấm vào xem Live của Shop rồi mới mua, hoa hồng sẽ bị chuyển cho người live.

2. Mua hàng từ giỏ hàng đã có sẵn từ lâu:
Nếu bạn thêm hàng vào giỏ từ nhiều ngày trước rồi mới bấm link tiếp thị, cookie có thể không kích hoạt đúng. Hãy xóa sản phẩm khỏi giỏ, bấm link tiếp thị mới rồi thêm lại vào giỏ và thanh toán ngay.

3. Áp dụng một số mã giảm giá đặc biệt của sàn:
Một số voucher sàn của Shopee hoặc TikTok Shop có điều khoản loại trừ hoa hồng tiếp thị (Commission excluded).

4. Trình duyệt chặn Cookie / Chế độ ẩn danh:
Khi bấm link chuyển đổi, hãy để trình duyệt tự động mở ứng dụng Shopee / TikTok Shop chính thức, không nên mua qua tab ẩn danh trình duyệt.

5. Đơn hàng bị hủy hoặc hoàn trả hàng:
Hoa hồng chỉ được chi trả thực tế khi đơn hàng được giao thành công và người mua không yêu cầu trả hàng hoàn tiền.`
  },
  {
    id: 'post_3',
    title: 'Cơ chế trả hoa hồng và quy trình rút tiền về tài khoản ngân hàng siêu tốc trong ngày',
    slug: 'quy-trinh-rut-tien-hoa-hong',
    category: 'SYSTEM',
    date: '08/10/2026',
    readTime: '4 phút đọc',
    author: 'Kế toán 28Symues',
    image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80',
    summary: 'Chính sách giải ngân hoa hồng minh bạch: điều kiện số dư tối thiểu 50.000đ, thời gian duyệt lệnh và hỗ trợ chuyển khoản 24/7 tới hơn 50 ngân hàng tại Việt Nam.',
    content: `28Symues cam kết cơ chế đối soát hoa hồng minh bạch và thanh toán nhanh chóng nhất thị trường cho toàn thể cộng đồng thành viên:

1. Cơ chế phân loại hoa hồng:
• ⏳ Đang xử lý: Đơn hàng mới đặt hoặc đang trên đường vận chuyển.
• 📦 Đã hoàn thành: Đơn hàng đã giao thành công và hoàn tất trên sàn thương mại điện tử.
• 💵 Rút tiền khả dụng: Tiền hoa hồng đã qua thời gian chờ đối soát sàn (Shopee sau 3 ngày, TikTok Shop ngay khi đơn chốt) và sẵn sàng để tạo lệnh rút.
• 🏦 Đã nhận: Tổng số tiền hoa hồng đã được kế toán duyệt và chuyển khoản thành công vào tài khoản ngân hàng của bạn.

2. Điều kiện & Hạn mức rút tiền:
• Số dư khả dụng tối thiểu để tạo lệnh rút: 50.000đ.
• Không giới hạn số lần rút trong tuần.
• Miễn phí 100% phí chuyển khoản ngân hàng tới tất cả các ngân hàng tại Việt Nam.

3. Thời gian giải ngân:
Lệnh rút tiền gửi trước 17:00 hàng ngày sẽ được phê duyệt và giải ngân trong vòng 2-4 tiếng cùng ngày!`
  },
  {
    id: 'post_4',
    title: 'Chiến lược xây dựng nhóm chat Zalo săn sale thu hút hàng nghìn thành viên',
    slug: 'chien-luoc-xay-dung-nhom-zalo-san-sale',
    category: 'TIPS',
    date: '05/10/2026',
    readTime: '6 phút đọc',
    author: 'Phạm Thắng',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop&q=80',
    summary: 'Chia sẻ kinh nghiệm thực chiến từ việc kéo mem, giữ tương tác, cấu hình bot trả lời tự động cho đến tối ưu doanh thu affiliate hàng tháng.',
    content: `Xây dựng một cộng đồng săn sale chất lượng trên Zalo là cách nhanh nhất và bền vững nhất để tạo nguồn thu nhập affiliate ổn định.

1. Tối ưu trải nghiệm thành viên với Zalo Bot tự động:
Thành viên trong nhóm chỉ cần gửi link sản phẩm, Bot Zalo sẽ tự động trả lời kèm link hoàn tiền và thông báo hoa hồng tức thì. Điều này giúp nhóm luôn sôi động 24/7 mà bạn không cần trực chat thủ công.

2. Lịch trình đăng bài deal hot mỗi ngày:
• Khung giờ 0h: Khởi động săn mã giảm giá toàn sàn và freeship 0đ.
• Khung giờ 9h - 12h: Tổng hợp deal hàng tiêu dùng, mỹ phẩm, thời trang.
• Khung giờ 19h - 21h: Deal công nghệ, gia dụng, đồ chơi và quà tặng.

3. Tri ân và tạo sự gắn kết:
Tổ chức minigame tặng mã quà tặng hoặc hoàn tiền thêm cho top thành viên có nhiều đơn hàng trong tháng. Sự minh bạch về doanh thu và đối soát qua Web Portal giúp thành viên luôn an tâm mua sắm lâu dài!`
  }
];

const SUGGESTED_IMAGES = [
  { label: 'Thương mại', url: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=800&auto=format&fit=crop&q=80' },
  { label: 'Công nghệ', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80' },
  { label: 'Tài chính', url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop&q=80' },
  { label: 'Marketing', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop&q=80' },
];

export default function BlogView() {
  const { setView, user, isAdmin, showToast, API_URL_ROOT } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const categoryContainerRef = useRef(null);
  const coverFileInputRef = useRef(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Danh mục động (LocalStorage)
  const [categories, setCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('web_blog_categories');
      return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
    } catch (e) {
      return DEFAULT_CATEGORIES;
    }
  });

  // Bài viết động (LocalStorage)
  const [posts, setPosts] = useState(() => {
    try {
      const saved = localStorage.getItem('web_blog_posts');
      return saved ? JSON.parse(saved) : DEFAULT_POSTS;
    } catch (e) {
      return DEFAULT_POSTS;
    }
  });

  // Modals state
  const [readingPost, setReadingPost] = useState(null);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isCreateCatOpen, setIsCreateCatOpen] = useState(false);

  // Form state tạo bài viết
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('GUIDE');
  const [newImage, setNewImage] = useState(SUGGESTED_IMAGES[0].url);
  const [newSummary, setNewSummary] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newAuthor, setNewAuthor] = useState(user?.fullName || 'Phạm Thắng');
  const [newReadTime, setNewReadTime] = useState('3 phút đọc');

  // Form state tạo danh mục
  const [newCatName, setNewCatName] = useState('');

  // Xử lý upload ảnh bìa từ file thiết bị
  const handleCoverFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn file hình ảnh (PNG, JPG, WEBP)!', 'warning');
      return;
    }
    setUploadingCover(true);
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
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          setNewImage(reader.result);
          showToast('Đã chèn ảnh bìa thành công!', 'success');
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      const reader = new FileReader();
      reader.onload = () => {
        setNewImage(reader.result);
        showToast('Đã chèn ảnh bìa thành công!', 'success');
      };
      reader.readAsDataURL(file);
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

  // Xử lý tạo bài viết mới
  const handleCreatePost = (e) => {
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

    const createdPost = {
      id: 'post_' + Date.now(),
      title: newTitle.trim(),
      slug: newTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: newCategory,
      date: new Date().toLocaleDateString('vi-VN'),
      readTime: newReadTime || '3 phút đọc',
      author: newAuthor.trim() || user?.fullName || 'Phạm Thắng',
      image: newImage.trim() || SUGGESTED_IMAGES[0].url,
      summary: newSummary.trim(),
      content: newContent.trim()
    };

    const updated = [createdPost, ...posts];
    savePosts(updated);
    setIsCreatePostOpen(false);
    setNewTitle('');
    setNewSummary('');
    setNewContent('');
    showToast('Đăng bài viết mới thành công! 🎉', 'success');
  };

  // Xử lý xóa bài viết
  const handleDeletePost = (e, postId) => {
    e.stopPropagation();
    if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này không?')) {
      const updated = posts.filter(p => p.id !== postId);
      savePosts(updated);
      if (readingPost?.id === postId) setReadingPost(null);
      showToast('Đã xóa bài viết!', 'info');
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
              onClick={() => setIsCreatePostOpen(true)}
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
                boxShadow: selectedCategory === cat.id ? '0 4px 12px rgba(249, 115, 22, 0.3)' : 'none'
              }}
            >
              {cat.label}
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
          <i className="fa-regular fa-folder-open" style={{ fontSize: '32px', marginBottom: '10px', color: 'var(--text-subtle)' }}></i>
          <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-bright)' }}>Chưa tìm thấy bài viết phù hợp</div>
          <p style={{ margin: '6px 0 0 0', fontSize: '13px' }}>
            {isAdmin ? 'Hãy thử tìm kiếm với từ khóa khác hoặc bấm nút "+ Viết Bài Mới" để chia sẻ bài viết đầu tiên.' : 'Hãy thử tìm kiếm với từ khóa khác hoặc chọn danh mục khác để xem bài viết.'}
          </p>
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
                        <span>{post.date}</span>
                        <span>•</span>
                        <span>{post.author}</span>
                      </div>
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
                <span>{readingPost.date}</span>
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
            <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-main)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Chia sẻ cẩm nang này tới bạn bè cùng nhóm Zalo
              </span>
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
                  <i className="fa-solid fa-pen-nib"></i>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: 'var(--text-bright)' }}>Soạn Thảo Bài Viết Mới</h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tạo bài viết hướng dẫn, mẹo kiếm tiền hoặc chia sẻ deal hot</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatePostOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleCreatePost} style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                  onClick={() => setIsCreatePostOpen(false)}
                  className="lookup-admin-link"
                  style={{ padding: '10px 18px', fontSize: '13px' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="lookup-btn"
                  style={{ width: 'auto', padding: '10px 24px', fontSize: '13.5px' }}
                >
                  <i className="fa-solid fa-paper-plane"></i>
                  <span>Đăng Bài Viết Ngay</span>
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
