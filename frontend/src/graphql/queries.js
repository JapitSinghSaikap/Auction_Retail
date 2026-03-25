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
