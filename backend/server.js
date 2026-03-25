require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { ApolloServer } = require('apollo-server-express');

const typeDefs = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');
const authMiddleware = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const { sequelize, Category } = require('./models');
const initBidSocket = require('./sockets/bidSocket');

const PORT = process.env.PORT || 5000;

async function startServer() {
  const app = express();

  // CORS — allow Vite dev server
  app.use(
    cors({
      origin: ['http://localhost:5173', 'http://localhost:3000'],
      credentials: true,
    })
  );

  app.use(express.json());

  // Serve uploaded images as static files
  const path = require('path');
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // Auth middleware (attaches req.user from JWT)
  app.use(authMiddleware);

  // REST auth routes
  app.use('/api/auth', authRoutes);

  // Image upload route
  app.use('/api/upload', uploadRoutes);

  // Apollo GraphQL server
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => ({ user: req.user }),
    introspection: true,
    playground: true,
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({ app, path: '/graphql', cors: false });

  // HTTP + Socket.io
  const httpServer = http.createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Initialize socket event handlers
  initBidSocket(io);

  // Sync DB and seed categories
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    await sequelize.sync({ alter: true });
    console.log('Database synced.');

    // Seed categories if empty
    const count = await Category.count();
    if (count === 0) {
      await Category.bulkCreate([
        { name: 'Electronics' },
        { name: 'Fashion' },
        { name: 'Vehicles' },
        { name: 'Furniture' },
        { name: 'Other' },
      ]);
      console.log('Default categories seeded.');
    }
  } catch (err) {
    console.error('Database initialization failed:', err);
    process.exit(1);
  }

  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`GraphQL at http://localhost:${PORT}/graphql`);
  });
}

startServer();
