import React, { useState } from 'react';

export default function CopyButton({
  text,
  title = 'Copy',
  label = '',
  toastMessage,
  style = {},
  iconOnly = false
}) {
  const [copied, setCopied] = useState(false);

  if (!text) return null;

  const handleCopy = (e) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(String(text));
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = String(text);
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 1600);

      const msg = toastMessage || `Đã copy: ${text}`;
      if (window.showToast) {
        window.showToast(msg, 'success');
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <button
      type="button"
      className="btn-copy-inline"
      onClick={handleCopy}
      title={copied ? 'Đã copy thành công!' : title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        padding: '3px 6px',
        fontSize: '11px',
        lineHeight: 1,
        border: 'none',
        outline: 'none',
        boxShadow: 'none',
        background: 'transparent',
        color: copied ? '#059669' : 'var(--text-muted, #64748b)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        verticalAlign: 'middle',
        marginLeft: '5px',
        flexShrink: 0,
        ...style
      }}
    >
      {copied ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
      {copied ? (
        <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#059669' }}>Đã copy</span>
      ) : (
        label ? <span style={{ fontSize: '10.5px' }}>{label}</span> : null
      )}
    </button>
  );
}
