/**
 * Web entry point — моки для React Native модулей
 */

// Моки для React Native API, которые недоступны в web
import './web-mocks';

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
