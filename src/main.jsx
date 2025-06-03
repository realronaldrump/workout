import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
// You can create a src/index.css for global styles if preferred over CDN/inline in index.html
// import './index.css'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
