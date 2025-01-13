import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../Components/axiosInstance';

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        // Request to invalidate refresh token
        await axiosInstance.post('/users/logout', {}, { withCredentials: true });

        // Clear access token and user data from local storage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');

        // Redirect to login page
        navigate('/login');
      } catch (error) {
        console.error('Logout failed:', error.response?.data || error.message);

        // Fallback - Clear tokens and navigate to login even if logout fails
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        navigate('/login');
      }
    };

    handleLogout();
  }, [navigate]);

  return (
    <div className="h-screen flex justify-center items-center">
      <h1 className="text-2xl">Logging you out...</h1>
    </div>
  );
};

export default Logout;
