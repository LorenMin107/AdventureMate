import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CampgroundForm from '../components/CampgroundForm';
import './CampgroundNewPage.css'; // Reuse the same CSS

/**
 * CampgroundEditPage component for editing existing campgrounds
 * Only accessible to admin users or the campground author
 */
const CampgroundEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();

  const [campground, setCampground] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    const fetchCampground = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/campgrounds/${id}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch campground: ${response.status}`);
        }

        const data = await response.json();
        setCampground(data.campground);

        // Check if user is authorized to edit this campground
        const isAdmin = currentUser?.isAdmin;
        const isAuthor = currentUser?._id === data.campground.author?._id;

        if (!isAdmin && !isAuthor) {
          setUnauthorized(true);
        }
      } catch (err) {
        console.error('Error fetching campground:', err);
        setError('Failed to load campground. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && id) {
      fetchCampground();
    } else if (!isAuthenticated) {
      navigate('/login');
    }
  }, [id, currentUser, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="campground-new-page">
        <div className="loading-container">
          Loading campground data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="campground-new-page">
        <div className="unauthorized-container">
          <p>{error}</p>
          <Link to="/campgrounds" className="btn btn-primary">
            Back to Campgrounds
          </Link>
        </div>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="campground-new-page">
        <div className="unauthorized-container">
          <p>You are not authorized to edit this campground.</p>
          <Link to={`/campgrounds/${id}`} className="btn btn-primary">
            View Campground
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="campground-new-page">
      <div className="page-header">
        <h1>Edit Campground</h1>
        <p>Update the information for {campground?.title}</p>
      </div>

      {campground && (
        <CampgroundForm 
          isEditing={true} 
          campground={campground}
        />
      )}
    </div>
  );
};

export default CampgroundEditPage;
