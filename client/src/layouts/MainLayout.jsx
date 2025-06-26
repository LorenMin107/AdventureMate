import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import PageTransition from '../components/PageTransition';
import Footer from '../components/Footer';
import './MainLayout.css';

/**
 * Main layout component that wraps the application content
 * Includes the header, page transitions, and a footer
 */
const MainLayout = () => {
  return (
    <div className="main-layout">
      <Header />

      <main className="main-content">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>

      <Footer />
    </div>
  );
};

export default MainLayout;
