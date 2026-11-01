import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const legalPaths = new Set(['/terms', '/privacy-policy']);

export const RouteScrollManager = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (legalPaths.has(location.pathname)) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      if (location.hash) {
        navigate({ pathname: location.pathname, search: location.search }, { replace: true });
      }
      return;
    }

    if (!location.hash) return;

    const sectionId = decodeURIComponent(location.hash.slice(1));
    let frame: number | undefined;
    const scrollToSection = () => {
      const section = document.getElementById(sectionId);
      if (!section) return false;

      if (frame !== undefined) return true;
      frame = window.requestAnimationFrame(() => {
        frame = undefined;
        const renderedSection = document.getElementById(sectionId);
        if (!renderedSection) return;
        const top = renderedSection.getBoundingClientRect().top + window.scrollY - 64;
        window.scrollTo({ top: Math.max(0, top), left: 0, behavior: 'auto' });
      });
      return true;
    };

    const observer = new MutationObserver(() => {
      if (scrollToSection()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    if (scrollToSection()) observer.disconnect();

    return () => {
      observer.disconnect();
      if (frame !== undefined) window.cancelAnimationFrame(frame);
    };
  }, [location.key, location.pathname, location.search, location.hash, navigate]);

  return null;
};
