import { gql } from '@apollo/client';

export const GET_ITEMS = gql`
  query GetItems($status: String, $categoryId: ID) {
    getItems(status: $status, categoryId: $categoryId) {
      id
      title
      description
      image
      startingPrice
      currentPrice
      endTime
      status
      bidCount
      seller {
        id
        name
      }
      category {
        id
        name
      }
    }
  }
`;

export const GET_ITEM = gql`
  query GetItem($id: ID!) {
    getItem(id: $id) {
      id
      title
      description
      image
      startingPrice
      currentPrice
      endTime
      status
      bidCount
      seller {
        id
        name
        email
      }
      category {
        id
        name
      }
      winner {
        id
        name
      }
      bids {
        id
        amount
        createdAt
        user {
          id
          name
        }
      }
    }
  }
`;

export const GET_BIDS = gql`
  query GetBids($itemId: ID!) {
    getBids(itemId: $itemId) {
      id
      amount
      createdAt
      user {
        id
        name
      }
    }
  }
`;

export const GET_MY_ITEMS = gql`
  query GetMyItems($sellerId: ID!) {
    getMyItems(sellerId: $sellerId) {
      id
      title
      description
      image
      currentPrice
      startingPrice
      endTime
      status
      bidCount
      category {
        id
        name
      }
    }
  }
`;

export const GET_MY_BIDS = gql`
  query GetMyBids($userId: ID!) {
    getMyBids(userId: $userId) {
      id
      amount
      createdAt
      item {
        id
        title
        currentPrice
        status
        endTime
        image
        category {
          id
          name
        }
      }
    }
  }
`;

export const GET_CATEGORIES = gql`
  query GetCategories {
    getCategories {
      id
      name
    }
  }
`;

export const GET_CHAT_ROOM = gql`
  query GetChatRoom($itemId: ID!) {
    getChatRoom(itemId: $itemId) {
      chatRoomId
      item {
        id
        title
        image
        currentPrice
        status
      }
      buyer {
        id
        name
      }
      seller {
        id
        name
      }
      lastMessage {
        id
        message
        createdAt
        sender {
          id
          name
        }
      }
      unreadCount
    }
  }
`;

export const GET_MESSAGES = gql`
  query GetMessages($chatRoomId: String!) {
    getMessages(chatRoomId: $chatRoomId) {
      id
      chatRoomId
      message
      isRead
      createdAt
      sender {
        id
        name
      }
      receiver {
        id
        name
      }
    }
  }
`;

export const GET_NOTIFICATIONS = gql`
  query GetNotifications($userId: ID!) {
    getNotifications(userId: $userId) {
      id
      type
      title
      message
      itemId
      isRead
      createdAt
      item {
        id
        title
        image
      }
    }
  }
`;

export const GET_UNREAD_COUNT = gql`
  query GetUnreadCount($userId: ID!) {
    getUnreadCount(userId: $userId)
  }
`;

export const GET_MY_CHAT_ROOMS = gql`
  query GetMyChatRooms($userId: ID!) {
    getMyChatRooms(userId: $userId) {
      chatRoomId
      item {
        id
        title
        image
        currentPrice
        status
      }
      buyer {
        id
        name
      }
      seller {
        id
        name
      }
      lastMessage {
        id
        message
        createdAt
        sender {
          id
          name
        }
      }
      unreadCount
    }
  }
`;
