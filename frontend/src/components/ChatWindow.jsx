import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useChat from '../hooks/useChat';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function DateSeparator({ dateStr }) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return (
    <div className="flex items-center gap-3 my-3">
      <div className="flex-1 h-px bg-[rgba(26,24,37,0.07)]" />
      <span className="text-[10.5px] text-tertiary font-medium">{label}</span>
      <div className="flex-1 h-px bg-[rgba(26,24,37,0.07)]" />
    </div>
  );
}

export default function ChatWindow({ chatRoomId, item, buyer, seller }) {
  const { user }  = useAuth();
  const { messages, isTyping, typingUser, sendMessage, handleTyping } = useChat(chatRoomId);

  const [text,   setText]   = useState('');
  const bottomRef            = useRef(null);

  // Determine receiver
  const receiverId = String(user?.id) === String(seller?.id) ? buyer?.id : seller?.id;

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage(text.trim(), receiverId);
    setText('');
  };

  const imgSrc = item?.image
    ? (item.image.startsWith('http') ? item.image : `${API_URL}${item.image}`)
    : null;

  // Group messages by date for separators
  let lastDate = '';

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[rgba(26,24,37,0.08)] bg-white shrink-0">
        {imgSrc && (
          <div className="w-10 h-10 rounded-[8px] overflow-hidden shrink-0">
            <img src={imgSrc} alt="" className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display='none'; }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-bold text-primary truncate">{item?.title || 'Auction Chat'}</p>
          <p className="text-[11px] text-secondary">
            with {String(user?.id) === String(seller?.id) ? buyer?.name : seller?.name}
          </p>
        </div>
        {item?.id && (
          <Link to={`/auction/${item.id}`}
            className="text-[12px] font-semibold text-accent hover:text-accent-dark transition-colors shrink-0">
            View Auction →
          </Link>
        )}
      </div>

      {/* Winner context banner */}
      {item?.currentPrice && (
        <div className="bg-[rgba(0,113,227,0.05)] border-b border-[rgba(0,113,227,0.1)]
                        px-5 py-2.5 flex items-center gap-2 shrink-0">
          <span className="text-sm">🏆</span>
          <p className="text-[12px] text-accent font-medium">
            Won for {formatCurrency(item.currentPrice)} — coordinate delivery details below
          </p>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5">
        {messages.length === 0 && !isTyping && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-3xl mb-2">👋</div>
            <p className="text-[13px] font-medium text-primary mb-1">Start the conversation</p>
            <p className="text-[12px] text-secondary">Coordinate delivery and payment details.</p>
          </div>
        )}

        {messages.map((msg) => {
          const msgDate = new Date(msg.createdAt).toDateString();
          const showSep = msgDate !== lastDate;
          if (showSep) lastDate = msgDate;
          return (
            <React.Fragment key={msg.id}>
              {showSep && <DateSeparator dateStr={msg.createdAt} />}
              <MessageBubble
                message={msg}
                isSent={String(msg.sender?.id) === String(user?.id)}
              />
            </React.Fragment>
          );
        })}

        {isTyping && <TypingIndicator userName={typingUser} />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={submit}
        className="px-4 py-3 border-t border-[rgba(26,24,37,0.08)] bg-white flex items-center gap-3 shrink-0">
        <input
          value={text}
          onChange={(e) => { setText(e.target.value); handleTyping(); }}
          placeholder="Type a message…"
          className="flex-1 px-4 py-2.5 bg-[rgba(26,24,37,0.04)] rounded-full text-[13.5px]
                     font-medium text-primary placeholder-tertiary
                     border border-[rgba(26,24,37,0.08)] focus:outline-none
                     focus:border-accent/30 focus:ring-2 focus:ring-accent/10"
        />
        <button type="submit" disabled={!text.trim()}
          className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center
                     hover:bg-accent-dark transition-all active:scale-[0.93]
                     disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
          </svg>
        </button>
      </form>
    </div>
  );
}
