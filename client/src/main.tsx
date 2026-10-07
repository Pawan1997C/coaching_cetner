import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import Toaster from './components/Toaster';
import { AuthProvider } from './context/AuthContext';
import { SiteProvider } from './context/SiteContext';
import { ThemeProvider } from './context/ThemeContext';
import { applyTheme, readCachedTheme } from './lib/theme';
import './index.css';

applyTheme(readCachedTheme()); // paint with the last-known theme straight away, before data arrives

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SiteProvider>
          <ThemeProvider>
            <App />
            <Toaster />
          </ThemeProvider>
        </SiteProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
