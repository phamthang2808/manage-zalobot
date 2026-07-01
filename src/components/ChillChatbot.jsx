import React, { useState, useRef, useEffect, useMemo } from 'react';

// Tự động quét và nạp toàn bộ các file .md trong thư mục ../docs/
const mdFiles = import.meta.glob('../docs/*.md', { query: '?raw', import: 'default', eager: true });

export default function ChillChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' hoặc 'docs'
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedDocChunk, setSelectedDocChunk] = useState(null);
  const messagesEndRef = useRef(null);

  // Phân tích & tách toàn bộ các file .md trong thư mục thành các đoạn kiến thức (Chunks)
  const docChunks = useMemo(() => {
    const chunks = [];
    const icons = ['📘', '📙', '📗', '📕', '📒', '📓'];
    let fileIdx = 0;

    Object.entries(mdFiles).forEach(([filePath, content]) => {
      if (!content) return;
      // Lấy tên file gọn gàng từ đường dẫn (VD: README.md, huong_dan_su_dung.md)
      const fileName = filePath.split('/').pop() || filePath;
      const icon = icons[fileIdx % icons.length];
      fileIdx++;

      // Phân rã theo các tiêu đề Heading (# hoặc ## hoặc ###)
      const parts = content.split(/(?=^[#1-9].*)/m);
      parts.forEach((part, index) => {
        const trimmed = part.trim();
        if (!trimmed || trimmed.length < 20) return;
        
        const firstLineEnd = trimmed.indexOf('\n');
        let title = firstLineEnd !== -1 ? trimmed.substring(0, firstLineEnd).replace(/^[#0-9.\-*\s]+/, '').trim() : `${fileName} - Mục ${index + 1}`;
        if (!title) title = `${fileName} - Mục ${index + 1}`;
        
        const bodyContent = firstLineEnd !== -1 ? trimmed.substring(firstLineEnd).trim() : trimmed;

        chunks.push({
          id: `${fileName}_${index}`,
          source: fileName,
          icon,
          title,
          content: bodyContent.length > 600 ? bodyContent.substring(0, 600) + '...' : bodyContent,
          fullContent: trimmed
        });
      });
    });

    return chunks;
  }, []);

  // Thiết lập lời chào ban đầu sau khi tải xong tài liệu
  useEffect(() => {
    if (messages.length === 0) {
      const fileNames = Object.keys(mdFiles).map(p => p.split('/').pop()).join(', ');
      setMessages([
        {
          sender: 'bot',
          text: `🤖 **Xin chào Sếp! Em là AI Trợ Lý Trang Web 🌿**\n\nEm đã tự động quét và nạp thành công **${docChunks.length} mục kiến thức** từ toàn bộ các file \`.md\` trong thư mục tài liệu (\`src/docs/\`):\n📁 **Các file đang nạp**: ${fileNames}\n\n💡 *Sếp chỉ cần thả thêm bất kỳ file \`.md\` nào vào thư mục này, em sẽ tự động đọc hiểu và trả lời mọi thông tin cho sếp!*`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [docChunks.length, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping, activeTab]);

  // Thuật toán tìm kiếm thông minh từ khóa trong nội dung file README/PDF
  const searchInDocs = (queryText) => {
    const queryWords = queryText
      .toLowerCase()
      .replace(/[?!.,;:()]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 1);

    if (queryWords.length === 0) return null;

    let bestMatch = null;
    let maxScore = 0;

    docChunks.forEach((chunk) => {
      let score = 0;
      const lowerTitle = chunk.title.toLowerCase();
      const lowerContent = chunk.fullContent.toLowerCase();

      queryWords.forEach((word) => {
        // Khớp tiêu đề được điểm cao gấp 3
        if (lowerTitle.includes(word)) score += 35;
        // Khớp nội dung chi tiết
        const contentMatches = (lowerContent.match(new RegExp(word, 'g')) || []).length;
        score += Math.min(contentMatches * 6, 30);
      });

      // Tăng điểm cho các từ khóa đặc thù
      if (queryText.toLowerCase().includes('tra cứu') && lowerContent.includes('tra cứu')) score += 40;
      if (queryText.toLowerCase().includes('rút tiền') && lowerContent.includes('rút')) score += 40;
      if (queryText.toLowerCase().includes('excel') && lowerContent.includes('excel')) score += 40;
      if (queryText.toLowerCase().includes('shopee') && lowerContent.includes('shopee')) score += 30;
      if (queryText.toLowerCase().includes('port') && lowerContent.includes('port')) score += 40;

      if (score > maxScore) {
        maxScore = score;
        bestMatch = chunk;
      }
    });

    return maxScore >= 20 ? bestMatch : null;
  };

  const handleSend = (textToSend = null) => {
    const query = textToSend !== null ? textToSend : input;
    if (!query.trim()) return;

    const userMsg = {
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (textToSend === null) setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const lowerQ = query.toLowerCase();

      // Kiểm tra câu hỏi giao tiếp chill chill trước
      if (['chào', 'hello', 'hi', 'chill', 'bot ơi', 'ê bot'].some((k) => lowerQ === k || lowerQ.startsWith(k))) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: `🤖🌿 Dạ xin chào sếp! Em đang sẵn sàng đọc tài liệu README và PDF hướng dẫn để giải đáp cho sếp đây ạ. Sếp cần hỏi về mục nào thế?`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setIsTyping(false);
        return;
      }

      // Quét trong bộ nhớ tài liệu gốc
      const matchedChunk = searchInDocs(query);

      if (matchedChunk) {
        const botResponse = `📖 **Tìm thấy trong tài liệu [${matchedChunk.source}]:**\n📌 **${matchedChunk.title}**\n\n${matchedChunk.content}\n\n💡 *Bấm sang tab "📑 Đọc Tài Liệu" bên trên để xem trọn bộ nội dung file gốc nhé!*`;
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: botResponse,
            docRef: matchedChunk,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: `🤔 Dạ em đã quét qua toàn bộ ${docChunks.length} mục trong các file \`README.md\` và tài liệu hướng dẫn nhưng chưa thấy chính xác từ khóa này.\n\n💡 **Gợi ý từ tài liệu:** Sếp thử hỏi về: *Quy trình đối soát, Cách import Excel, Cấu trúc port 8080/5173, hoặc Quy định rút hoa hồng* xem sao nhé!`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }

      setIsTyping(false);
    }, 500);
  };

  const quickPrompts = [
    '📑 Quy trình đối soát đơn hàng thế nào?',
    '⚡ Port chạy Frontend và Backend?',
    '📊 Hướng dẫn Admin tải file Excel?',
    '💸 Cú pháp lệnh rút tiền trên Zalo?'
  ];

  return (
    <>
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 15px rgba(56, 189, 248, 0.5), 0 0 30px rgba(139, 92, 246, 0.3); }
          50% { box-shadow: 0 0 25px rgba(56, 189, 248, 0.8), 0 0 45px rgba(139, 92, 246, 0.6); transform: scale(1.04); }
        }
        @keyframes floatUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .chill-bot-btn {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0284c7, #8b5cf6, #ec4899);
          border: 2px solid rgba(255, 255, 255, 0.35);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          animation: pulseGlow 3s infinite ease-in-out;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .chill-bot-btn:hover {
          transform: scale(1.1) rotate(6deg);
        }
        .chill-bot-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #10b981;
          color: #fff;
          font-size: 10px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 10px;
          border: 2px solid #0f172a;
        }
        .chill-chat-window {
          position: fixed;
          bottom: 100px;
          right: 24px;
          z-index: 9999;
          width: 410px;
          max-width: calc(100vw - 32px);
          height: 560px;
          max-height: calc(100vh - 120px);
          background: rgba(15, 23, 42, 0.92);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 24px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7), 0 0 20px rgba(139, 92, 246, 0.25);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: floatUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .chill-chat-header {
          padding: 14px 18px;
          background: linear-gradient(135deg, rgba(14, 165, 233, 0.25), rgba(139, 92, 246, 0.25));
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .chill-header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .chill-nav-tabs {
          display: flex;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 10px;
          padding: 3px;
          gap: 4px;
        }
        .chill-tab-btn {
          flex: 1;
          background: transparent;
          border: none;
          color: #94a3b8;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 10px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .chill-tab-btn.active {
          background: rgba(255, 255, 255, 0.15);
          color: #fff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
        .chill-chat-body {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .chill-docs-body {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .chill-doc-card {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .chill-doc-card:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: #38bdf8;
          transform: translateY(-1px);
        }
        .chill-msg-bubble {
          max-width: 88%;
          padding: 12px 16px;
          border-radius: 16px;
          font-size: 13.5px;
          line-height: 1.55;
          position: relative;
          word-break: break-word;
        }
        .chill-msg-bot {
          align-self: flex-start;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.09);
          color: #f8fafc;
          border-bottom-left-radius: 4px;
        }
        .chill-msg-user {
          align-self: flex-end;
          background: linear-gradient(135deg, #0ea5e9, #8b5cf6);
          color: #ffffff;
          font-weight: 500;
          border-bottom-right-radius: 4px;
          box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
        }
        .chill-quick-prompts {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 4px;
        }
        .chill-prompt-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 6px 12px;
          font-size: 11px;
          color: #cbd5e1;
          cursor: pointer;
          transition: all 0.2s;
        }
        .chill-prompt-btn:hover {
          background: rgba(14, 165, 233, 0.25);
          border-color: #38bdf8;
          color: #fff;
        }
        .chill-chat-input-area {
          padding: 12px 16px;
          background: rgba(0, 0, 0, 0.25);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          gap: 8px;
        }
        .chill-chat-input {
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 10px 16px;
          color: #fff;
          font-size: 13px;
          outline: none;
        }
        .chill-chat-input:focus {
          border-color: #38bdf8;
        }
        .chill-send-btn {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0ea5e9, #8b5cf6);
          border: none;
          color: #fff;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
        }
        .chill-send-btn:hover {
          transform: scale(1.08);
        }
        .typing-dots {
          display: flex;
          gap: 4px;
          padding: 8px 12px;
        }
        .typing-dot {
          width: 6px;
          height: 6px;
          background: #94a3b8;
          border-radius: 50%;
          animation: bounceDot 1.4s infinite ease-in-out both;
        }
        .typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .typing-dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes bounceDot {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>

      {/* Floating Button */}
      <div className="chill-bot-btn" onClick={() => setIsOpen(!isOpen)} title="AI Trợ Lý Trang Web (Đọc README & PDF)">
        🤖
        <span className="chill-bot-badge">AI</span>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="chill-chat-window">
          {/* Header */}
          <div className="chill-chat-header">
            <div className="chill-header-top">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ fontSize: '24px' }}>🤖</div>
                <div>
                  <div style={{ color: '#fff', fontWeight: '700', fontSize: '15px' }}>AI Trợ Lý Trang Web 🌿</div>
                  <div style={{ color: '#38bdf8', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8', display: 'inline-block' }}></span>
                    Đọc trực tiếp README.md & Hướng dẫn PDF
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="chill-nav-tabs">
              <button
                className={`chill-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
                onClick={() => { setActiveTab('chat'); setSelectedDocChunk(null); }}
              >
                💬 Hỏi Đáp AI
              </button>
              <button
                className={`chill-tab-btn ${activeTab === 'docs' ? 'active' : ''}`}
                onClick={() => setActiveTab('docs')}
              >
                📑 Đọc Tài Liệu ({docChunks.length})
              </button>
            </div>
          </div>

          {/* TAB 1: CHAT AI */}
          {activeTab === 'chat' && (
            <>
              <div className="chill-chat-body">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`chill-msg-bubble ${msg.sender === 'bot' ? 'chill-msg-bot' : 'chill-msg-user'}`}>
                    <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '6px', textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                      {msg.time}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="chill-msg-bubble chill-msg-bot typing-dots">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                )}

                {messages.length === 1 && !isTyping && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>💡 Hỏi nhanh trong tài liệu:</div>
                    <div className="chill-quick-prompts">
                      {quickPrompts.map((prompt, idx) => (
                        <button key={idx} className="chill-prompt-btn" onClick={() => handleSend(prompt)}>
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <div className="chill-chat-input-area">
                <input
                  type="text"
                  className="chill-chat-input"
                  placeholder="Hỏi AI về README, thao tác, đối soát..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button className="chill-send-btn" onClick={() => handleSend()}>
                  🚀
                </button>
              </div>
            </>
          )}

          {/* TAB 2: ĐỌC TRỰC TIẾP TÀI LIỆU (README & PDF/MD) */}
          {activeTab === 'docs' && (
            <div className="chill-docs-body">
              {selectedDocChunk ? (
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <button
                    onClick={() => setSelectedDocChunk(null)}
                    style={{ background: 'rgba(56, 189, 248, 0.2)', border: 'none', color: '#38bdf8', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', marginBottom: '12px' }}
                  >
                    ⬅ Quay lại danh sách
                  </button>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>
                    {selectedDocChunk.icon} Nguồn: {selectedDocChunk.source}
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                    {selectedDocChunk.title}
                  </div>
                  <div style={{ fontSize: '13.5px', color: '#e2e8f0', lineHeight: '1.6', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                    {selectedDocChunk.fullContent}
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                    📚 Bấm vào mục bất kỳ để xem nguyên bản text từ file gốc:
                  </div>
                  {docChunks.map((chunk) => (
                    <div key={chunk.id} className="chill-doc-card" onClick={() => setSelectedDocChunk(chunk)}>
                      <div style={{ fontSize: '11px', color: '#38bdf8', marginBottom: '3px' }}>
                        {chunk.icon} {chunk.source}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff', marginBottom: '6px' }}>
                        {chunk.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.4' }}>
                        {chunk.content}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
