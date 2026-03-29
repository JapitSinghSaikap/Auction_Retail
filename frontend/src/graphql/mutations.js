import { gql } from '@apollo/client';

export const CREATE_ITEM = gql`
  mutation CreateItem(
    $title: String!
    $description: String
    $image: String
    $startingPrice: Float!
    $endTime: String!
    $categoryId: ID!
    $sellerId: ID!
  ) {
    createItem(
      title: $title
      description: $description
      image: $image
      startingPrice: $startingPrice
      endTime: $endTime
      categoryId: $categoryId
      sellerId: $sellerId
    ) {
      id
      title
      currentPrice
      startingPrice
      endTime
      status
      category {
        id
        name
      }
    }
  }
`;

export const PLACE_BID = gql`
  mutation PlaceBid($itemId: ID!, $userId: ID!, $amount: Float!) {
    placeBid(itemId: $itemId, userId: $userId, amount: $amount) {
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

export const CLOSE_EXPIRED_AUCTIONS = gql`
  mutation CloseExpiredAuctions {
    closeExpiredAuctions
  }
`;

export const SEND_MESSAGE = gql`
  mutation SendMessage(
    $chatRoomId: String!
    $senderId: ID!
    $receiverId: ID!
    $message: String!
  ) {
    sendMessage(
      chatRoomId: $chatRoomId
      senderId: $senderId
      receiverId: $receiverId
      message: $message
    ) {
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

export const MARK_READ = gql`
  mutation MarkMessagesRead($chatRoomId: String!, $userId: ID!) {
    markMessagesRead(chatRoomId: $chatRoomId, userId: $userId)
  }
`;

export const MARK_NOTIFICATION_READ = gql`
  mutation MarkNotificationRead($id: ID!) {
    markNotificationRead(id: $id)
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ = gql`
  mutation MarkAllNotificationsRead($userId: ID!) {
    markAllNotificationsRead(userId: $userId)
  }
`;
