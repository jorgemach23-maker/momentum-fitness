import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const useBackButtonHandler = (activeTab, setActiveTab, activeView, handleBackToMain) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handlePopState = (event) => {
      event.preventDefault();

      if (activeView === 'routine' || activeView === 'feedback') {
        handleBackToMain();
      } else if (activeTab === 'profile' || activeTab === 'history') {
        setActiveTab('training');
        navigate('/'); // Navigate to the main training tab
      } else {
        // If on the main screen, allow native back behavior to exit the app
        window.history.back();
      }
    };

    window.addEventListener('popstate', handlePopState);

    // By pushing a state, we ensure the popstate event is triggered on back.
    // We do this only once when the component mounts.
    window.history.pushState({ page: location.pathname }, '');

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  // We pass handleBackToMain and other dependencies.
  }, [activeTab, activeView, setActiveTab, handleBackToMain, navigate, location.pathname]);
};
