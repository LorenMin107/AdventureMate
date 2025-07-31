import { Routes, Route, useRoutes } from 'react-router-dom';
import { useEffect } from 'react';
import FlashMessage from './components/FlashMessage';
import { AuthProvider } from './context/AuthContext';
import { UserProvider } from './context/UserContext';
import { FlashMessageProvider } from './context/FlashMessageContext';
import { ThemeProvider } from './context/ThemeContext';
import routes from './routes';
import pwa from './utils/pwa';
import { forceRestoreTheme, checkThemeConsistency } from './utils/themeDebug';
import './App.css';

function App() {
  // Use the routes configuration with useRoutes hook
  const routeElement = useRoutes(routes);

  // Initialize PWA
  useEffect(() => {
    pwa.init();
  }, []);

  // Global theme restoration to handle OAuth redirects and other edge cases
  useEffect(() => {
    const restoreTheme = () => {
      try {
        // Check theme consistency
        const isConsistent = checkThemeConsistency();

        if (!isConsistent) {
          console.log('Theme inconsistency detected in App component, restoring...');
          forceRestoreTheme();
        }
      } catch (error) {
        console.warn('Error in global theme restoration:', error);
      }
    };

    // Restore theme after a delay to ensure everything is loaded
    const timeoutId = setTimeout(restoreTheme, 200);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <UserProvider>
          <FlashMessageProvider>
            <div className="App">
              <FlashMessage />
              {/* Render the routes */}
              {routeElement}
            </div>
          </FlashMessageProvider>
        </UserProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
