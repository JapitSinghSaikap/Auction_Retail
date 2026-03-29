import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useAuth } from '../context/AuthContext';
import { GET_MY_CHAT_ROOMS } from '../graphql/queries';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';

export default function ChatPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [search, setSearch] = useState('');

  const { data, loading, refetch } = useQuery(GET_MY_CHAT_ROOMS, {
    variables: { userId: user?.id },
    skip: !user?.id,
    pollInterval: 15000,
  });

  const chatRooms = data?.getMyChatRooms || [];

  // Auto-open room from URL query param ?room=auction_5
  useEffect(() => {
    const roomParam = searchParams.get('room');
    if (roomParam && chatRooms.length > 0) {
      const found = chatRooms.find((r) => r.chatRoomId === roomParam);
      if (found) setSelectedRoom(found);
    }
  }, [searchParams, chatRooms]);

  // Filter rooms by search
  const filteredRooms = chatRooms.filter((r) =>
    !search || r.item?.title?.toLowerCase().includes(search.toLowerCase())
  );

  const totalUnread = chatRooms.reduce((s, r) => s + (r.unreadCount || 0), 0);

  return (
    <div className="flex h-screen bg-base overflow-hidden">

      {/* ── Left panel ─────────────────────────────── */}
      <aside className="w-[320px] shrink-0 flex flex-col bg-white
                        border-r border-[rgba(26,24,37,0.08)]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[rgba(26,24,37,0.07)]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Link to="/" className="text-[13px] font-semibold text-accent hover:text-accent-dark transition-colors">
                ← Home
              </Link>
              <span className="text-tertiary">/</span>
              <h1 className="text-[14.5px] font-bold text-primary">Messages</h1>
              {totalUnread > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-accent text-white">
                  {totalUnread}
                </span>
              )}
            </div>
            <button onClick={() => refetch()}
              className="text-[11px] font-medium text-secondary hover:text-primary transition-colors">
              Refresh
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-tertiary"
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="w-full pl-9 pr-4 py-2 bg-[rgba(26,24,37,0.04)] border border-[rgba(26,24,37,0.07)]
                         rounded-[8px] text-[12.5px] font-medium text-primary placeholder-tertiary
                         focus:outline-none focus:border-accent/30"
            />
          </div>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"/>
            </div>
          ) : (
            <ChatList
              chatRooms={filteredRooms}
              onSelect={setSelectedRoom}
              selectedRoomId={selectedRoom?.chatRoomId}
              userId={user?.id}
            />
          )}
        </div>
      </aside>

      {/* ── Right panel ────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedRoom ? (
          <ChatWindow
            chatRoomId={selectedRoom.chatRoomId}
            item={selectedRoom.item}
            buyer={selectedRoom.buyer}
            seller={selectedRoom.seller}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-[20px] bg-[rgba(0,113,227,0.07)] flex items-center justify-center mb-5">
              <svg className="w-9 h-9 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </div>
            <h2 className="text-[18px] font-bold text-primary mb-2">Select a conversation</h2>
            <p className="text-[13.5px] text-secondary max-w-xs leading-relaxed">
              Choose a chat from the left to continue the conversation with your buyer or seller.
            </p>
            {chatRooms.length === 0 && !loading && (
              <div className="mt-6 bg-[rgba(0,113,227,0.05)] rounded-[12px] px-5 py-4 max-w-xs">
                <p className="text-[12.5px] text-secondary leading-relaxed">
                  💡 Chats open automatically after an auction you participated in ends.
                  Win or sell an item to start messaging.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
