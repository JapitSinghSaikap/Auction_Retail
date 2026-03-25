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
