import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { I18nextProvider } from 'react-i18next';
import App from './App';
import './index.css';
import i18n from './i18n'; // Import i18n instance
import ErrorBoundary from './components/common/ErrorBoundary';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // default: true
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1, // retry failed queries once
    },
  },
});

// Wait for i18n to be ready before rendering
const renderApp = () => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ErrorBoundary>
        <I18nextProvider i18n={i18n}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <App />
            </BrowserRouter>
            {/* Add React Query Devtools - will only show in development */}
            <ReactQueryDevtools initialIsOpen={false} />
          </QueryClientProvider>
        </I18nextProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
};

// Check if i18n is ready, if not wait for it
if (i18n.isInitialized) {
  renderApp();
} else {
  i18n.on('initialized', () => {
    renderApp();
  });
}
