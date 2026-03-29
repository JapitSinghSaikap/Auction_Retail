# AuctionLive — Real-Time Auction Platform

A full-stack real-time auction platform built with Node.js, React, GraphQL, Socket.io, and MySQL.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express.js |
| Database | MySQL + Sequelize ORM |
| Real-Time | Socket.io |
| API | GraphQL (apollo-server-express) |
| Auth | JWT + bcryptjs |
| Frontend | React.js (Vite) + Apollo Client |
| Styling | Tailwind CSS |
| State | React Context API |

## Features

- User registration & login (Buyer / Seller roles)
- Create and manage auction listings (Sellers)
- Real-time bidding with live price updates via Socket.io
- Countdown timers on every auction
- Outbid notifications via socket events + toast alerts
- Live bid feed with slide-in animations
- Buyer dashboard showing bid status (Winning / Outbid)
- Seller dashboard showing all listings with bid counts
- Category filtering and title search on home page
- Automatic auction closure when end time passes
- Winner determination by highest bid
- Dark-themed responsive UI (mobile-first)

## Setup Instructions

### Prerequisites
- Node.js >= 18
- MySQL running locally

### 1. Clone & Install

```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Create MySQL Database

```sql
CREATE DATABASE auction_db;
```

### 3. Configure Environment Variables

**Backend** — edit `backend/.env` (or the root `.env`):
```
DB_HOST=localhost
DB_USER=root
DB_PASS=yourpassword
DB_NAME=auction_db
JWT_SECRET=auction_secret_key_2026
PORT=5000
```

**Frontend** — edit `frontend/.env`:
```
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_GRAPHQL_URL=http://localhost:5000/graphql
```

### 4. Start the Backend

```bash
cd backend && node server.js
```

The server will:
- Connect to MySQL and sync Sequelize models
- Seed 5 default categories if none exist
- Expose GraphQL at `http://localhost:5000/graphql`
- Expose REST auth at `http://localhost:5000/api/auth`
- Run Socket.io on the same port

### 5. Start the Frontend

```bash
cd frontend && npm run dev
```

App runs at `http://localhost:5173`.

---

## GraphQL API

### Queries

| Query | Args | Description |
|-------|------|-------------|
| `getItems` | `status`, `categoryId` | List auction items |
| `getItem` | `id` | Single item with bids |
| `getBids` | `itemId` | Bids for an item |
| `getMyItems` | `sellerId` | Seller's listings |
| `getMyBids` | `userId` | Buyer's bids |
| `getCategories` | — | All categories |

### Mutations

| Mutation | Description |
|----------|-------------|
| `createItem(...)` | Create auction listing |
| `placeBid(itemId, userId, amount)` | Place a bid |
| `closeExpiredAuctions` | Close ended auctions |

---

## Socket Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `joinAuction` | `itemId` | Join auction room |
| `placeBid` | `{ itemId, userId, amount, token }` | Place real-time bid |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `bidUpdated` | `{ newPrice, bidderName, bidderId, itemId, bidCount, timestamp }` | Broadcast new bid |
| `outbidAlert` | `{ itemTitle, newAmount }` | Notify outbid user |

---


