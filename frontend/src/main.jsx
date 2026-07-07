import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { brandAssets } from './config/brandAssets';
import { AuthProvider } from './context/AuthContext';
import router from './routes/router';
import './index.css';

const favicon = document.getElementById('app-favicon');
if (favicon) {
  favicon.href = brandAssets.favicon;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
);
