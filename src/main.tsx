import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LedgerProvider } from './context/LedgerContext';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <LedgerProvider>
        <App />
      </LedgerProvider>
    </AuthProvider>
  </React.StrictMode>,
);
