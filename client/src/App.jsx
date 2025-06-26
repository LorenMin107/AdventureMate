import { Routes, Route, useRoutes } from 'react-router-dom';
import FlashMessage from './components/FlashMessage';
import { AuthProvider } from './context/AuthContext';
import { UserProvider } from './context/UserContext';
import { FlashMessageProvider } from './context/FlashMessageContext';
import { ThemeProvider } from './context/ThemeContext';
import routes from './routes';
import './App.css';

function App() {
  // Use the routes configuration with useRoutes hook
  const routeElement = useRoutes(routes);

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
