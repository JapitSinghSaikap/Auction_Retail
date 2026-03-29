import React, { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../context/AuthContext';

const EMOJIS = ['🔥', '💰', '👑', '😱', '⚡', '🎯'];

function FloatingEmoji({ emoji, id, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <span
      className="absolute text-lg pointer-events-none select-none"
      style={{
        animation: 'floatUp 1.8s ease-out forwards',
        left: `${15 + Math.random() * 70}%`,
        bottom: '0',
      }}>
      {emoji}
    </span>
  );
}

export default function EmojiReactions({ itemId }) {
  const { socket }   = useSocket();
  const { user }     = useAuth();
  const [counts,     setCounts]   = useState({});
  const [floaters,   setFloaters] = useState([]);

  useEffect(() => {
    if (!socket) return;
    const onReaction = ({ emoji }) => {
      setCounts((prev) => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }));
      const id = Date.now() + Math.random();
      setFloaters((prev) => [...prev, { emoji, id }]);
    };
    socket.on('newReaction', onReaction);
    return () => socket.off('newReaction', onReaction);
  }, [socket]);

  const send = (emoji) => {
    if (!socket) return;
    socket.emit('sendReaction', { itemId, emoji, userId: user?.id });
  };

  const removeFloater = (id) => setFloaters((prev) => prev.filter((f) => f.id !== id));

  return (
    <div className="relative">
      {/* Floating emoji area — positioned above the buttons, no clipping */}
      <div className="absolute bottom-full left-0 right-0 h-16 pointer-events-none">
        {floaters.map(({ emoji, id }) => (
          <FloatingEmoji key={id} emoji={emoji} id={id} onDone={() => removeFloater(id)} />
        ))}
      </div>

      {/* Emoji buttons — minimal style */}
      <div className="flex items-center gap-1 flex-wrap">
        {EMOJIS.map((emoji) => (
          <button key={emoji}
            onClick={() => send(emoji)}
            className="inline-flex items-center gap-0.5 px-1.5 py-1 rounded-[6px]
                       bg-[rgba(26,24,37,0.04)] hover:bg-[rgba(26,24,37,0.09)]
                       text-[14px] transition-all active:scale-[0.90] select-none">
            {emoji}
            {counts[emoji] > 0 && (
              <span className="text-[9px] font-semibold text-tertiary ml-0.5">{counts[emoji]}</span>
            )}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes floatUp {
          0%   { opacity: 1; transform: translateY(0) scale(1); }
          70%  { opacity: 0.8; transform: translateY(-40px) scale(1.1); }
          100% { opacity: 0; transform: translateY(-60px) scale(0.7); }
        }
      `}</style>
    </div>
  );
}
