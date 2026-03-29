const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    role: String!
  }

  type Category {
    id: ID!
    name: String!
  }

  type Item {
    id: ID!
    title: String!
    description: String
    image: String
    startingPrice: Float!
    currentPrice: Float!
    endTime: String!
    status: String!
    seller: User
    category: Category
    bids: [Bid]
    winner: User
    bidCount: Int
  }

  type Bid {
    id: ID!
    amount: Float!
    user: User
    item: Item
    createdAt: String!
  }

  type Message {
    id: ID!
    chatRoomId: String!
    message: String!
    isRead: Boolean!
    createdAt: String!
    sender: User
    receiver: User
  }

  type ChatRoom {
    chatRoomId: String!
    item: Item
    buyer: User
    seller: User
    lastMessage: Message
    unreadCount: Int
  }

  type Notification {
    id: ID!
    type: String!
    title: String!
    message: String!
    itemId: ID
    isRead: Boolean!
    createdAt: String!
    item: Item
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    getItems(status: String, categoryId: ID): [Item]
    getItem(id: ID!): Item
    getBids(itemId: ID!): [Bid]
    getMyItems(sellerId: ID!): [Item]
    getMyBids(userId: ID!): [Bid]
    getCategories: [Category]
    getChatRoom(itemId: ID!): ChatRoom
    getMessages(chatRoomId: String!): [Message]
    getMyChatRooms(userId: ID!): [ChatRoom]
    getNotifications(userId: ID!): [Notification]
    getUnreadCount(userId: ID!): Int
  }

  type Mutation {
    createItem(
      title: String!
      description: String
      image: String
      startingPrice: Float!
      endTime: String!
      categoryId: ID!
      sellerId: ID!
    ): Item

    placeBid(
      itemId: ID!
      userId: ID!
      amount: Float!
    ): Bid

    closeExpiredAuctions: Boolean

    sendMessage(
      chatRoomId: String!
      senderId: ID!
      receiverId: ID!
      message: String!
    ): Message

    markMessagesRead(
      chatRoomId: String!
      userId: ID!
    ): Boolean

    markNotificationRead(id: ID!): Boolean
    markAllNotificationsRead(userId: ID!): Boolean
  }
`;

module.exports = typeDefs;
