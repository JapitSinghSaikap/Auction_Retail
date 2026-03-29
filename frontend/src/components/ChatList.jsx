import React from 'react';
import { formatCurrency } from '../utils/formatters';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ChatList({ chatRooms = [], onSelect, selectedRoomId, userId }) {
  if (chatRooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <div className="text-4xl mb-3">💬</div>
        <p className="font-semibold text-primary mb-1">No conversations yet</p>
        <p className="text-[13px] text-secondary">
          Post-auction chats appear here once you win or sell an item.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full">
      {chatRooms.map((room) => {
        const isSelected = room.chatRoomId === selectedRoomId;
        const imgSrc     = room.item?.image
          ? (room.item.image.startsWith('http') ? room.item.image : `${API_URL}${room.item.image}`)
          : null;

        return (
          <button
            key={room.chatRoomId}
            onClick={() => onSelect(room)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all
              border-b border-[rgba(26,24,37,0.05)]
              ${isSelected
                ? 'bg-[rgba(0,113,227,0.06)]'
                : 'hover:bg-[rgba(26,24,37,0.03)]'
              }`}>
            {/* Thumbnail */}
            <div className="w-11 h-11 rounded-[9px] bg-[#1a1825] shrink-0 overflow-hidden">
              {imgSrc
                ? <img src={imgSrc} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display='none'; }} />
                : <div className="w-full h-full flex items-center justify-center text-white text-xs">🖼</div>
              }
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] font-semibold text-primary truncate">{room.item?.title || 'Auction'}</p>
                <span className="text-[10.5px] text-tertiary shrink-0">
                  {timeAgo(room.lastMessage?.createdAt)}
                </span>
              </div>
              <p className="text-[11.5px] text-secondary truncate mt-0.5">
                {room.lastMessage
                  ? (String(room.lastMessage.sender?.id) === String(userId) ? 'You: ' : '') + room.lastMessage.message
                  : 'Start the conversation…'
                }
              </p>
            </div>

            {/* Unread badge */}
            {room.unreadCount > 0 && (
              <span className="shrink-0 w-5 h-5 rounded-full bg-accent text-white
                               text-[10px] font-bold flex items-center justify-center">
                {room.unreadCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
