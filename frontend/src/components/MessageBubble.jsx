import React from 'react';

function timeStr(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ message, isSent }) {
  return (
    <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`max-w-[68%] ${isSent ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`px-4 py-2.5 text-[13.5px] leading-relaxed
          ${isSent
            ? 'bg-accent text-white rounded-2xl rounded-br-sm'
            : 'bg-[rgba(26,24,37,0.07)] text-primary rounded-2xl rounded-bl-sm'
          }`}>
          {message.message}
        </div>
        <div className={`flex items-center gap-1 mt-1 ${isSent ? 'flex-row-reverse' : ''}`}>
          <span className="text-[10px] text-tertiary">{timeStr(message.createdAt)}</span>
          {isSent && (
            <span className="text-[10px] text-tertiary">
              {message.isRead ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
