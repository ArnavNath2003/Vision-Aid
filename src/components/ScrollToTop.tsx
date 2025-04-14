import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop component that scrolls the window to the top when the route changes.
 * This component doesn't render anything visible - it just performs the scroll action.
 */
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top when the route changes
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // Use 'instant' instead of 'smooth' to avoid visual confusion
    });
  }, [pathname]); // Re-run this effect when the pathname changes

  return null; // This component doesn't render anything
};

export default ScrollToTop;
