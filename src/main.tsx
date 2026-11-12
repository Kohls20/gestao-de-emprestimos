import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LedgerProvider } from './context/LedgerContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LedgerProvider>
      <App />
    </LedgerProvider>
  </React.StrictMode>,
);
