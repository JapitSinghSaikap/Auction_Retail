import { useState, useEffect, useCallback } from 'react';
import { useSocketContext } from '../context/SocketContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const MAX_ITEMS = 20;

export default function useActivityFeed() {
  const { socket }        = useSocketContext();
  const [activities, setActivities] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  // Load recent history on mount
  const loadRecent = useCallback(async () => {
    try {
      const res  = await fetch(`${API_URL}/api/activity/recent`);
      const data = await res.json();
      if (data.activities) setActivities(data.activities.slice(0, MAX_ITEMS));
    } catch (_) {}
  }, []);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  // Socket subscription
  useEffect(() => {
    if (!socket) return;

    setIsConnected(socket.connected);

    const onConnect    = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    const onActivity   = (event) => {
      setActivities((prev) => [event, ...prev].slice(0, MAX_ITEMS));
    };

    socket.emit('joinGlobalFeed');
    socket.on('connect',        onConnect);
    socket.on('disconnect',     onDisconnect);
    socket.on('globalActivity', onActivity);

    return () => {
      socket.emit('leaveGlobalFeed');
      socket.off('connect',        onConnect);
      socket.off('disconnect',     onDisconnect);
      socket.off('globalActivity', onActivity);
    };
  }, [socket]);

  return { activities, isConnected };
}
