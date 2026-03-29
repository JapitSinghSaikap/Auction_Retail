import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useSocket } from './useSocket';
import { useAuth } from '../context/AuthContext';
import { GET_MESSAGES } from '../graphql/queries';
import { SEND_MESSAGE, MARK_READ } from '../graphql/mutations';

export default function useChat(chatRoomId) {
  const { socket } = useSocket();
  const { user, token } = useAuth();

  const [messages,     setMessages]     = useState([]);
  const [isTyping,     setIsTyping]     = useState(false);
  const [typingUser,   setTypingUser]   = useState('');
  const typingTimeout  = useRef(null);

  const { data } = useQuery(GET_MESSAGES, {
    variables: { chatRoomId },
    skip: !chatRoomId,
    fetchPolicy: 'network-only',
  });

  const [sendMessageMutation] = useMutation(SEND_MESSAGE);
  const [markReadMutation]    = useMutation(MARK_READ);

  // Load initial messages
  useEffect(() => {
    if (data?.getMessages) setMessages(data.getMessages);
  }, [data]);

  // Join room + mark read on mount
  useEffect(() => {
    if (!socket || !chatRoomId || !user?.id) return;

    socket.emit('joinChatRoom', { chatRoomId, userId: user.id });
    markReadMutation({ variables: { chatRoomId, userId: user.id } }).catch(() => {});

    const onNewMessage = (msg) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // Mark as read if it's for me
      if (String(msg.sender?.id) !== String(user.id)) {
        markReadMutation({ variables: { chatRoomId, userId: user.id } }).catch(() => {});
      }
    };

    const onUserTyping = ({ userName, chatRoomId: room }) => {
      if (room !== chatRoomId) return;
      setIsTyping(true);
      setTypingUser(userName);
    };

    const onUserStopTyping = ({ chatRoomId: room }) => {
      if (room !== chatRoomId) return;
      setIsTyping(false);
      setTypingUser('');
    };

    socket.on('newChatMessage', onNewMessage);
    socket.on('userTyping',     onUserTyping);
    socket.on('userStopTyping', onUserStopTyping);

    return () => {
      socket.off('newChatMessage', onNewMessage);
      socket.off('userTyping',     onUserTyping);
      socket.off('userStopTyping', onUserStopTyping);
    };
  }, [socket, chatRoomId, user?.id]);

  const sendMessage = useCallback(async (text, receiverId) => {
    if (!text.trim() || !chatRoomId || !user?.id) return;
    try {
      // Optimistic update via socket
      if (socket) {
        socket.emit('sendChatMessage', {
          chatRoomId,
          senderId:   user.id,
          receiverId,
          message:    text.trim(),
          token,
        });
      } else {
        // Fallback to GraphQL
        await sendMessageMutation({
          variables: { chatRoomId, senderId: user.id, receiverId, message: text.trim() },
        });
      }
    } catch (err) {
      console.error('sendMessage error:', err);
    }
  }, [socket, chatRoomId, user?.id, token]);

  const handleTyping = useCallback(() => {
    if (!socket || !chatRoomId || !user?.name) return;
    socket.emit('chatTyping', { chatRoomId, userName: user.name });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('chatStopTyping', { chatRoomId });
    }, 2000);
  }, [socket, chatRoomId, user?.name]);

  return { messages, isTyping, typingUser, sendMessage, handleTyping };
}
