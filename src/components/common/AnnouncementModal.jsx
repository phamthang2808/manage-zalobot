import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function AnnouncementModal({ apiRoot, previewData = null, onClose = null }) {
  const [announcement, setAnnouncement] = useState(previewData);
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (previewData) {
      setAnnouncement(previewData);
      setIsOpen(true);
      return;
    }

    const fetchAnnouncement = async () => {
      try {
        const root = apiRoot || '';
        const res = await fetch(`${root}/api/public/announcement`);
        if (res.status === 204 || !res.ok) {
          // Fallback thử đọc từ localStorage nếu backend chưa có DB
          const localSaved = localStorage.getItem('site_announcement_config');
          if (localSaved) {
            try {
              const parsed = JSON.parse(localSaved);
              if (parsed && parsed.active && (parsed.title || parsed.content || parsed.imageUrl)) {
                handleCheckAndOpen(parsed);
              }
            } catch (e) {}
          }
          return;
        }

        const data = await res.json();
        if (!data || !data.active) return;
        if (!data.title && !data.imageUrl && !data.content) return;

        handleCheckAndOpen(data);
      } catch (err) {
        // Fallback localStorage
        const localSaved = localStorage.getItem('site_announcement_config');
        if (localSaved) {
          try {
            const parsed = JSON.parse(localSaved);
            if (parsed && parsed.active && (parsed.title || parsed.content || parsed.imageUrl)) {
              handleCheckAndOpen(parsed);
            }
          } catch (e) {}
        }
      }
    };

    const handleCheckAndOpen = (data) => {
      // Kiểm tra xem khách đã chọn "Không hiển thị lại" cho bản thông báo này chưa
      const dismissKey = `28symues_announcement_dismiss_${data.id || '0'}_${data.updatedAt || ''}`;
      if (localStorage.getItem(dismissKey) === 'true') {
        return;
      }

      // Kiểm tra session nếu vừa tắt trong phiên duyệt web hiện tại
      const sessionKey = `28symues_announcement_closed_session_${data.id || '0'}`;
      if (sessionStorage.getItem(sessionKey) === 'true') {
        return;
      }

      setAnnouncement(data);
      // Mở popup sau hiệu ứng nhẹ 400ms
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 400);
      return () => clearTimeout(timer);
    };

    fetchAnnouncement();
  }, [apiRoot, previewData]);

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) {
      onClose();
      return;
    }

    if (announcement) {
      if (dontShowAgain) {
        const dismissKey = `28symues_announcement_dismiss_${announcement.id || '0'}_${announcement.updatedAt || ''}`;
        localStorage.setItem(dismissKey, 'true');
      } else {
        const sessionKey = `28symues_announcement_closed_session_${announcement.id || '0'}`;
        sessionStorage.setItem(sessionKey, 'true');
      }
    }
  };

  if (!isOpen || !announcement) return null;

  // Render markdown cơ bản (bold, link, newline)
  const renderFormattedContent = (text) => {
    if (!text) return null;

    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return <div key={idx} style={{ height: '8px' }} />;
      }

      // Match [Tên link](url) và url thuần
      const linkRegex = /\[(.*?)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s]+)/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = linkRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }

        if (match[1] && match[2]) {
          parts.push(
            <a
              key={match.index}
              href={match[2]}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#ea580c', fontWeight: '700', textDecoration: 'underline' }}
            >
              {match[1]} <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '10px', marginLeft: '3px' }}></i>
            </a>
          );
        } else if (match[3]) {
          parts.push(
            <a
              key={match.index}
              href={match[3]}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#ea580c', fontWeight: '600', textDecoration: 'underline' }}
            >
              {match[3]}
            </a>
          );
        }
        lastIndex = linkRegex.lastIndex;
      }

      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }

      // Đổi **in đậm**
      const processedParts = parts.map((part, pIdx) => {
        if (typeof part !== 'string') return part;
        const boldRegex = /\*\*(.*?)\*\*/g;
        const subParts = [];
        let bLast = 0;
        let bMatch;
        while ((bMatch = boldRegex.exec(part)) !== null) {
          if (bMatch.index > bLast) {
            subParts.push(part.substring(bLast, bMatch.index));
          }
          subParts.push(
            <strong key={bMatch.index} style={{ fontWeight: '800', color: 'var(--text-bright)' }}>
              {bMatch[1]}
            </strong>
          );
          bLast = boldRegex.lastIndex;
        }
        if (bLast < part.length) {
          subParts.push(part.substring(bLast));
        }
        return <React.Fragment key={pIdx}>{subParts}</React.Fragment>;
      });

      return (
        <p key={idx} style={{ margin: '0 0 6px 0', fontSize: '13.5px', lineHeight: '1.6', color: 'var(--text-main)' }}>
          {processedParts}
        </p>
      );
    });
  };

  const getFullImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    let clean = url;
    if (clean.startsWith('/uploads/announcements/')) {
      const filename = clean.replace('/uploads/announcements/', '');
      clean = `/api/public/announcement/image/${filename}`;
    }
    const root = apiRoot || '';
    return `${root}${clean}`;
  };

  const bannerImg = getFullImageUrl(announcement.imageUrl);

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 9999999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      boxSizing: 'border-box',
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      animation: 'symFadeIn 0.25s ease-out'
    }}>
      {/* Click outside to close */}
      <div style={{ position: 'absolute', inset: 0 }} onClick={handleClose} />

      {/* Modal Card */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        width: '100%',
        maxWidth: 'clamp(460px, 50vw, 680px)',
        maxHeight: '92vh',
        background: 'var(--bg-card, #ffffff)',
        borderRadius: '24px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid var(--border-color)',
        animation: 'symScaleUp 0.25s ease-out'
      }}>
        {/* Floating Close Button (X) */}
        <button
          onClick={handleClose}
          type="button"
          aria-label="Đóng"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 20,
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid rgba(0,0,0,0.1)',
            color: '#334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            fontSize: '14px',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ea580c'; e.currentTarget.style.transform = 'scale(1.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#334155'; e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Banner Image - Ôm trọn viền (Cover) tràn viền hiện đại */}
        {bannerImg && (
          <div style={{
            width: '100%',
            position: 'relative',
            background: 'var(--bg-main, #0f172a)',
            overflow: 'hidden',
            borderBottom: '1px solid var(--border-color)',
            height: 'clamp(220px, 34vw, 320px)',
            display: 'block'
          }}>
            {announcement.targetUrl ? (
              <a
                href={announcement.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'block', width: '100%', height: '100%', cursor: 'pointer' }}
                title="Bấm để mở liên kết"
              >
                <img
                  src={bannerImg}
                  alt={announcement.title || 'Banner thông báo'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center 25%',
                    display: 'block',
                    transition: 'transform 0.3s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                  onError={e => { e.currentTarget.style.display = 'none'; }}
                />
              </a>
            ) : (
              <img
                src={bannerImg}
                alt={announcement.title || 'Banner thông báo'}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center 25%',
                  display: 'block',
                  cursor: 'pointer'
                }}
                title="Bấm để xem ảnh gốc"
                onClick={() => window.open(bannerImg, '_blank', 'noopener,noreferrer')}
                onError={e => { e.currentTarget.style.display = 'none'; }}
              />
            )}
          </div>
        )}

        {/* Content Body */}
        <div style={{ padding: '20px 22px', overflowY: 'auto', flex: 1 }}>
          {announcement.title && (
            <h2 style={{
              fontSize: '18px',
              fontWeight: '900',
              color: 'var(--text-bright)',
              lineHeight: '1.4',
              margin: '0 0 10px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="fa-solid fa-bullhorn" style={{ color: '#ea580c', fontSize: '17px', flexShrink: 0 }}></i>
              <span>{announcement.title}</span>
            </h2>
          )}

          {announcement.content && (
            <div style={{ marginTop: '8px' }}>
              {renderFormattedContent(announcement.content)}
            </div>
          )}
        </div>

        {/* Footer with Checkbox */}
        <div style={{
          padding: '12px 20px',
          background: 'var(--bg-main)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            fontWeight: '600',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            userSelect: 'none'
          }}>
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={e => setDontShowAgain(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#ea580c', cursor: 'pointer' }}
            />
            <span>Không hiển thị lại</span>
          </label>

          <button
            onClick={handleClose}
            type="button"
            className="lookup-admin-link"
            style={{
              padding: '6px 16px',
              fontSize: '12.5px',
              fontWeight: '700',
              borderRadius: '10px'
            }}
          >
            Đóng
          </button>
        </div>
      </div>

      <style>{`
        @keyframes symFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes symScaleUp {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>,
    document.body
  );
}
