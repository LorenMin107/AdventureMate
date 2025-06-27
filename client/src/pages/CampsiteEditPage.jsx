import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CampsiteForm from '../components/CampsiteForm';
import './CampsiteNewPage.css'; // Reuse the same CSS

/**
 * CampsiteEditPage component for editing existing campsites
 * Only accessible to campground owners
 */
const CampsiteEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, loading } = useAuth();
  
  const [campsite, setCampsite] = useState(null);
  const [campground, setCampground] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch campsite data
  useEffect(() => {
    const fetchCampsite = async () => {
      if (!id) return;
      
      try {
        const response = await fetch(`/api/v1/campsites/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch campsite');
        }
        
        const data = await response.json();
        
        // Check if the response is in the standardized format
        const campsiteData = data.status && data.data ? data.data.campsite : data.campsite;
        
        if (!campsiteData) {
          throw new Error('Campsite data not found in response');
        }
        
        setCampsite(campsiteData);
        
        // Fetch the parent campground to verify ownership
        if (campsiteData.campground) {
          const campgroundId = typeof campsiteData.campground === 'object' 
            ? campsiteData.campground._id 
            : campsiteData.campground;
            
          const campgroundResponse = await fetch(`/api/campgrounds/${campgroundId}`);
          
          if (!campgroundResponse.ok) {
            throw new Error('Failed to fetch parent campground');
          }
          
          const campgroundData = await campgroundResponse.json();
          
          // Check if the response is in the standardized format
          const campgroundInfo = campgroundData.status && campgroundData.data 
            ? campgroundData.data.campground 
            : campgroundData.campground;
            
          if (!campgroundInfo) {
            throw new Error('Campground data not found in response');
          }
          
          setCampground(campgroundInfo);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load campsite data. Please try again later.');
      } finally {
        setLoadingData(false);
      }
    };
    
    fetchCampsite();
  }, [id]);
  
  // Check if user is the owner of the campground
  const isOwner = currentUser && campground && (
    currentUser.isAdmin || 
    (campground.owner && currentUser._id === campground.owner._id) || 
    (campground.author && currentUser._id === campground.author._id)
  );
  
  // Redirect if not the owner
  useEffect(() => {
    if (!loading && !loadingData && !isOwner && campground) {
      navigate(`/campgrounds/${campground._id}`);
    }
  }, [currentUser, loading, loadingData, isOwner, navigate, campground]);
  
  if (loading || loadingData) {
    return <div className="loading-container">Loading...</div>;
  }
  
  if (error) {
    return <div className="error-container">{error}</div>;
  }
  
  if (!currentUser) {
    return <div className="unauthorized-container">Please log in to access this page.</div>;
  }
  
  if (!isOwner) {
    return <div className="unauthorized-container">You don't have permission to edit this campsite.</div>;
  }
  
  if (!campsite || !campground) {
    return <div className="error-container">Campsite or campground data not found.</div>;
  }
  
  return (
    <div className="campsite-new-page">
      <div className="page-header">
        <h1>Edit Campsite</h1>
        <p>Update the information for {campsite.name} in {campground.title}</p>
      </div>
      
      <CampsiteForm 
        campgroundId={campground._id}
        campsite={campsite}
        isEditing={true} 
      />
    </div>
  );
};

export default CampsiteEditPage;