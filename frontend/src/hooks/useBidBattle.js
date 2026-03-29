import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';

export default function useBidBattle(itemId) {
  const { socket } = useSocket();

  const [isBattleActive, setIsBattleActive] = useState(false);
  const [fighter1,       setFighter1]        = useState(null);
  const [fighter2,       setFighter2]        = useState(null);
  const [currentPrice,   setCurrentPrice]    = useState(null);
  const [commentary,     setCommentary]      = useState([]);
  const [reactions,      setReactions]       = useState({});
  const [winner,         setWinner]          = useState(null);

  useEffect(() => {
    if (!socket) return;

    const onBattleStart = ({ fighter1: f1, fighter2: f2, currentPrice: cp }) => {
      setIsBattleActive(true);
      setFighter1(f1);
      setFighter2(f2);
      setCurrentPrice(cp);
      setWinner(null);
    };

    const onBattleEnd = ({ winner: w, finalPrice }) => {
      setIsBattleActive(false);
      setWinner(w);
      setCurrentPrice(finalPrice);
      // Clear after 5 seconds
      setTimeout(() => {
        setWinner(null);
        setFighter1(null);
        setFighter2(null);
      }, 5000);
    };

    const onCommentary = ({ text, type }) => {
      setCommentary((prev) => [{ text, type, id: Date.now() }, ...prev].slice(0, 6));
    };

    const onBidUpdated = ({ newPrice }) => {
      setCurrentPrice(newPrice);
    };

    const onReaction = ({ emoji }) => {
      setReactions((prev) => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }));
    };

    socket.on('bidBattleStarted', onBattleStart);
    socket.on('bidBattleEnded',   onBattleEnd);
    socket.on('commentary',       onCommentary);
    socket.on('bidUpdated',       onBidUpdated);
    socket.on('newReaction',      onReaction);

    return () => {
      socket.off('bidBattleStarted', onBattleStart);
      socket.off('bidBattleEnded',   onBattleEnd);
      socket.off('commentary',       onCommentary);
      socket.off('bidUpdated',       onBidUpdated);
      socket.off('newReaction',      onReaction);
    };
  }, [socket]);

  const sendReaction = useCallback((emoji) => {
    if (socket && itemId) {
      socket.emit('sendReaction', { itemId, emoji });
    }
  }, [socket, itemId]);

  return {
    isBattleActive,
    fighter1,
    fighter2,
    currentPrice,
    commentary,
    reactions,
    winner,
    sendReaction,
  };
}
