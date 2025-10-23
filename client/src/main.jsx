import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { ProductProvider } from './context/ProductContext.jsx';
import { SiteContentProvider } from './context/SiteContentContext.jsx';
import { SiteSettingsProvider } from './context/SiteSettingsContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <SiteSettingsProvider>
        <SiteContentProvider>
          <ProductProvider>
            <App />
          </ProductProvider>
        </SiteContentProvider>
      </SiteSettingsProvider>
    </BrowserRouter>
  </React.StrictMode>
);
