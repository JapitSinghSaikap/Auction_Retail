import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function useAuctionIQ(itemId) {
  const { socket } = useSocket();
  const { user, token } = useAuth();

  const [analysis,      setAnalysis]      = useState(null);
  const [isLoading,     setIsLoading]     = useState(false);
  const [snipeActive,   setSnipeActive]   = useState(false);
  const [snipeInfo,     setSnipeInfo]     = useState(null);
  const intervalRef     = useRef(null);

  const fetchAnalysis = useCallback(async () => {
    if (!itemId) return;
    setIsLoading(true);
    try {
      const params = user?.id ? `?userId=${user.id}` : '';
      const res    = await fetch(`${API_URL}/api/intelligence/${itemId}/analysis${params}`);
      if (res.ok) {
        const data = await res.json();
        setAnalysis(data);
      }
    } catch (err) {
      console.error('AuctionIQ fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [itemId, user?.id]);

  // Initial fetch + polling every 30s
  useEffect(() => {
    fetchAnalysis();
    intervalRef.current = setInterval(fetchAnalysis, 30000);
    return () => clearInterval(intervalRef.current);
  }, [fetchAnalysis]);

  // Refresh on new bid
  useEffect(() => {
    if (!socket) return;
    const onBidUpdated = () => fetchAnalysis();
    socket.on('bidUpdated', onBidUpdated);
    return () => socket.off('bidUpdated', onBidUpdated);
  }, [socket, fetchAnalysis]);

  // Socket snipe responses
  useEffect(() => {
    if (!socket) return;

    const onSnipeScheduled = (data) => {
      setSnipeActive(true);
      setSnipeInfo(data);
    };
    const onSnipeExecuted = (data) => {
      setSnipeActive(false);
      setSnipeInfo(null);
      // Trigger refetch
      fetchAnalysis();
    };
    const onSnipeFailed = (data) => {
      setSnipeActive(false);
      setSnipeInfo(null);
      console.warn('Snipe failed:', data.reason);
    };
    const onSnipeCancelled = () => {
      setSnipeActive(false);
      setSnipeInfo(null);
    };

    socket.on('snipeScheduled',  onSnipeScheduled);
    socket.on('snipeExecuted',   onSnipeExecuted);
    socket.on('snipeFailed',     onSnipeFailed);
    socket.on('snipeCancelled',  onSnipeCancelled);

    return () => {
      socket.off('snipeScheduled',  onSnipeScheduled);
      socket.off('snipeExecuted',   onSnipeExecuted);
      socket.off('snipeFailed',     onSnipeFailed);
      socket.off('snipeCancelled',  onSnipeCancelled);
    };
  }, [socket, fetchAnalysis]);

  const setAutoSnipe = useCallback((settings) => {
    if (!socket || !user?.id || !token) return;
    socket.emit('setAutoSnipe', {
      itemId,
      userId:       user.id,
      maxBudget:    settings.maxBudget,
      increment:    settings.increment,
      snipeSeconds: settings.snipeSeconds,
      token,
    });
  }, [socket, itemId, user?.id, token]);

  const cancelSnipe = useCallback(() => {
    if (!socket || !user?.id) return;
    socket.emit('cancelSnipe', { itemId, userId: user.id });
  }, [socket, itemId, user?.id]);

  return { analysis, isLoading, snipeActive, snipeInfo, setAutoSnipe, cancelSnipe, refresh: fetchAnalysis };
}
