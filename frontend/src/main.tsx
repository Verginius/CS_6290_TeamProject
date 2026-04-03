import React from 'react';
import { createRoot } from 'react-dom/client';  // 修改这里
import App from './app/App';
import './styles/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);  // 修改这里

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);