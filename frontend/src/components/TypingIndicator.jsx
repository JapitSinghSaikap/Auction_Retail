import React from 'react';

export default function TypingIndicator({ userName }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex items-center gap-1 bg-[rgba(26,24,37,0.07)] px-3 py-2 rounded-2xl rounded-bl-sm">
        <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      {userName && (
        <span className="text-[11px] text-secondary">{userName} is typing…</span>
      )}
    </div>
  );
}
