import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useSocketContext } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { GET_NOTIFICATIONS, GET_UNREAD_COUNT } from '../graphql/queries';
import { MARK_NOTIFICATION_READ, MARK_ALL_NOTIFICATIONS_READ } from '../graphql/mutations';

export default function useNotifications() {
  const { socket }            = useSocketContext();
  const { user, isLoggedIn }  = useAuth();

  const [notifications,  setNotifications]  = useState([]);
  const [unreadCount,    setUnreadCount]     = useState(0);
  const [isOpen,         setIsOpen]          = useState(false);
  const [newToast,       setNewToast]        = useState(null); // for auto-popup toast

  const { data: nData, refetch: refetchNotifs } = useQuery(GET_NOTIFICATIONS, {
    variables: { userId: user?.id },
    skip: !isLoggedIn || !user?.id,
    fetchPolicy: 'network-only',
  });

  const { data: ucData, refetch: refetchCount } = useQuery(GET_UNREAD_COUNT, {
    variables: { userId: user?.id },
    skip: !isLoggedIn || !user?.id,
  });

  const [markReadMutation]    = useMutation(MARK_NOTIFICATION_READ);
  const [markAllReadMutation] = useMutation(MARK_ALL_NOTIFICATIONS_READ);

  useEffect(() => {
    if (nData?.getNotifications)  setNotifications(nData.getNotifications);
  }, [nData]);

  useEffect(() => {
    if (ucData?.getUnreadCount !== undefined) setUnreadCount(ucData.getUnreadCount);
  }, [ucData]);

  // Socket: join notification room + listen
  useEffect(() => {
    if (!socket || !user?.id) return;

    socket.emit('joinNotifications', { userId: user.id });

    const onNew = (notif) => {
      setNotifications((prev) => [notif, ...prev].slice(0, 50));
      setUnreadCount((c) => c + 1);
      setNewToast(notif);
      // Auto-dismiss toast after 5s
      setTimeout(() => setNewToast(null), 5000);
    };

    socket.on('newNotification', onNew);
    return () => socket.off('newNotification', onNew);
  }, [socket, user?.id]);

  const markRead = useCallback(async (id) => {
    try {
      await markReadMutation({ variables: { id } });
      setNotifications((prev) =>
        prev.map((n) => String(n.id) === String(id) ? { ...n, isRead: true } : n)
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (_) {}
  }, [markReadMutation]);

  const markAllRead = useCallback(async () => {
    if (!user?.id) return;
    try {
      await markAllReadMutation({ variables: { userId: user.id } });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (_) {}
  }, [markAllReadMutation, user?.id]);

  return {
    notifications,
    unreadCount,
    isOpen, setIsOpen,
    markRead,
    markAllRead,
    newToast,
    dismissToast: () => setNewToast(null),
  };
}
