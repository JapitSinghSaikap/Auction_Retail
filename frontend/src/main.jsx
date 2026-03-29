import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  createHttpLink,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import './index.css';

const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:5000/graphql',
});

// Attach JWT token to every GraphQL request
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
      <ApolloProvider client={client}>
        <BrowserRouter>
          <AuthProvider>
            <SocketProvider>
              <App />
            </SocketProvider>
          </AuthProvider>
        </BrowserRouter>
      </ApolloProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
