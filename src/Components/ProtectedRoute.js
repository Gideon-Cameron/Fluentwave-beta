import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axiosInstance from '../Components/axiosInstance';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAccessToken = async () => {
      try {
        // Request to verify the access token
        const response = await axiosInstance.get('/users/profile');
        
        if (response.status === 200) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Authentication error:', error.response?.data || error.message);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    verifyAccessToken();
  }, []);

  // Show loading screen during token verification
  if (loading) {
    return <div className="h-screen flex justify-center items-center">Loading...</div>;
  }

  // Redirect to login if not authenticated
  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
