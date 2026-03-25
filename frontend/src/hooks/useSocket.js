import { useEffect, useCallback } from 'react';
import { useSocketContext } from '../context/SocketContext';

export function useSocket() {
  const { socket } = useSocketContext();

  const joinAuction = useCallback(
    (itemId) => {
      if (socket) socket.emit('joinAuction', itemId);
    },
    [socket]
  );

  const leaveAuction = useCallback(
    (itemId) => {
      if (socket) socket.emit('leaveAuction', itemId);
    },
    [socket]
  );

  const onBidUpdated = useCallback(
    (callback) => {
      if (!socket) return () => {};
      socket.on('bidUpdated', callback);
      return () => socket.off('bidUpdated', callback);
    },
    [socket]
  );

  const onOutbidAlert = useCallback(
    (callback) => {
      if (!socket) return () => {};
      socket.on('outbidAlert', callback);
      return () => socket.off('outbidAlert', callback);
    },
    [socket]
  );

  const onBidError = useCallback(
    (callback) => {
      if (!socket) return () => {};
      socket.on('bidError', callback);
      return () => socket.off('bidError', callback);
    },
    [socket]
  );

  const onBidSuccess = useCallback(
    (callback) => {
      if (!socket) return () => {};
      socket.on('bidSuccess', callback);
      return () => socket.off('bidSuccess', callback);
    },
    [socket]
  );

  const emitBid = useCallback(
    (itemId, userId, amount, token) => {
      if (socket) {
        socket.emit('placeBid', { itemId, userId, amount, token });
      }
    },
    [socket]
  );

  return {
    socket,
    joinAuction,
    leaveAuction,
    onBidUpdated,
    onOutbidAlert,
    onBidError,
    onBidSuccess,
    emitBid,
  };
}

export default useSocket;
