import { Link } from 'react-router-dom';
import useCounter from '../hooks/useCounter';
import './HomePage.css';

const HomePage = () => {
  const { count, increment, decrement, reset } = useCounter(0);

  return (
    <div className="home-page">
      <section className="hero">
        <h1>Welcome to MyanCamp</h1>
        <p className="lead">Discover, book, and review campgrounds in Myanmar</p>
        <div className="cta-buttons">
          <Link to="/campgrounds" className="btn btn-primary">View Campgrounds</Link>
          <button 
            onClick={increment}
            className="btn btn-secondary"
          >
            Clicked {count} times
          </button>
        </div>
        <div className="counter-controls">
          <button onClick={decrement} className="btn btn-small">-</button>
          <button onClick={reset} className="btn btn-small">Reset</button>
        </div>
      </section>

      <section className="features">
        <h2>Why Choose MyanCamp?</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <h3>Discover Nature</h3>
            <p>Find the best campgrounds in Myanmar's beautiful landscapes.</p>
          </div>
          <div className="feature-card">
            <h3>Easy Booking</h3>
            <p>Book your stay with a simple, secure reservation system.</p>
          </div>
          <div className="feature-card">
            <h3>Community Reviews</h3>
            <p>Read and share experiences with fellow campers.</p>
          </div>
        </div>
      </section>

      <p className="read-the-docs">
        This is a React application for MyanCamp
      </p>
    </div>
  );
};

export default HomePage;
