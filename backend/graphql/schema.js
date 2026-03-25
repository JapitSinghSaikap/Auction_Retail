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
  }
`;

module.exports = typeDefs;
