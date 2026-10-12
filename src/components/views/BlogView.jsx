import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function BlogView() {
  const { setView } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'ALL', label: 'Tất cả bài viết' },
    { id: 'GUIDE', label: 'Hướng dẫn sử dụng' },
    { id: 'TIPS', label: 'Mẹo kiếm tiền Affiliate' },
    { id: 'SALE', label: 'Săn sale & Mã giảm giá' },
    { id: 'SYSTEM', label: 'Cập nhật hệ thống' },
  ];

  const blogPosts = [
    {
      id: 1,
      title: 'Hướng dẫn tự động chuyển đổi link Shopee & TikTok Shop nhận hoa hồng hoàn tiền đến 80%',
      slug: 'huong-dan-chuyen-doi-link-shopee-tiktok',
      category: 'GUIDE',
      date: '12/10/2026',
      readTime: '3 phút đọc',
      author: 'Phạm Thắng',
      image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80',
      summary: 'Khám phá bí quyết tạo thu nhập thụ động mỗi ngày khi mua sắm online trên Shopee, TikTok Shop, Lazada và ShopeeFood với hệ thống Zalo Bot 28Symues.'
    },
    {
      id: 2,
      title: 'Top 5 sai lầm khiến bạn bị mất hoa hồng Shopee và cách phòng tránh triệt để',
      slug: 'sai-lam-mat-hoa-hong-shopee',
      category: 'TIPS',
      date: '10/10/2026',
      readTime: '5 phút đọc',
      author: 'Admin 28Symues',
      image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&auto=format&fit=crop&q=80',
      summary: 'Tại sao đơn hàng hoàn thành nhưng không nhận được hoa hồng? Tìm hiểu về cache live stream, video ưu tiên và cách mua hàng giữ nguyên cookie chuyển đổi link.'
    },
    {
      id: 3,
      title: 'Cơ chế trả hoa hồng và quy trình rút tiền về tài khoản ngân hàng siêu tốc trong ngày',
      slug: 'quy-trinh-rut-tien-hoa-hong',
      category: 'SYSTEM',
      date: '08/10/2026',
      readTime: '4 phút đọc',
      author: 'Kế toán 28Symues',
      image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80',
      summary: 'Chính sách giải ngân hoa hồng minh bạch: điều kiện số dư tối thiểu 50.000đ, thời gian duyệt lệnh và hỗ trợ chuyển khoản 24/7 tới hơn 50 ngân hàng tại Việt Nam.'
    },
    {
      id: 4,
      title: 'Chiến lược xây dựng nhóm chat Zalo săn sale thu hút hàng nghìn thành viên',
      slug: 'chien-luoc-xay-dung-nhom-zalo-san-sale',
      category: 'TIPS',
      date: '05/10/2026',
      readTime: '6 phút đọc',
      author: 'Phạm Thắng',
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop&q=80',
      summary: 'Chia sẻ kinh nghiệm thực chiến từ việc kéo mem, giữ tương tác, cấu hình bot trả lời tự động cho đến tối ưu doanh thu affiliate hàng tháng.'
    }
  ];

  const filteredPosts = blogPosts.filter(p => {
    if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.summary.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="blog-view-wrapper" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* 1. HERO BANNER BLOG */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(234, 88, 12, 0.04) 100%)',
        border: '1.5px solid rgba(249, 115, 22, 0.25)',
        borderRadius: '24px',
        padding: '36px 28px',
        textAlign: 'center',
        marginBottom: '28px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: '20px',
          background: 'rgba(249, 115, 22, 0.15)',
          color: 'var(--color-primary, #ea580c)',
          fontSize: '12px',
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
          marginBottom: '12px'
        }}>
          <i className="fa-regular fa-newspaper"></i> 28Symues Blog &amp; Tin Tức
        </span>

        <h1 style={{ fontSize: '28px', fontWeight: '900', color: 'var(--text-bright)', margin: '0 0 10px 0', lineHeight: '1.3' }}>
          Cẩm Nang Mua Sắm &amp; Kiếm Tiền Affiliate Tự Động
        </h1>

        <p style={{ fontSize: '14.5px', color: 'var(--text-muted)', maxWidth: '640px', margin: '0 auto 20px', lineHeight: '1.6' }}>
          Tổng hợp kiến thức thực chiến, hướng dẫn cài đặt bot Zalo, mẹo săn mã giảm giá và chia sẻ kinh nghiệm gia tăng hoa hồng mua sắm mỗi ngày.
        </p>

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

      {/* 2. CATEGORY TABS */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '10px',
        marginBottom: '24px',
        scrollbarWidth: 'none'
      }}>
        {categories.map(cat => (
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
              transition: 'all 0.2s ease',
              boxShadow: selectedCategory === cat.id ? '0 4px 12px rgba(249, 115, 22, 0.3)' : 'none'
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 3. POSTS GRID */}
      {filteredPosts.length === 0 ? (
        <div className="lookup-card" style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <i className="fa-regular fa-folder-open" style={{ fontSize: '32px', marginBottom: '10px', color: 'var(--text-subtle)' }}></i>
          <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-bright)' }}>Chưa tìm thấy bài viết phù hợp</div>
          <p style={{ margin: '6px 0 0 0', fontSize: '13px' }}>Hãy thử tìm kiếm với từ khóa khác hoặc chuyển sang danh mục bài viết khác.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '22px'
        }}>
          {filteredPosts.map(post => (
            <article
              key={post.id}
              className="lookup-card"
              style={{
                padding: '0',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                margin: 0,
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.08)';
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
              </div>

              {/* Body */}
              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    <span>{post.date}</span>
                    <span>•</span>
                    <span>{post.author}</span>
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
          ))}
        </div>
      )}

    </div>
  );
}
