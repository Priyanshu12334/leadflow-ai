import { useEffect, useState } from 'react';
import './LoadingScreen.css';

const loadingMessages = [
  <>Preparing your <strong>workspace</strong>...</>,
  <>Connecting your <strong>lead management system</strong>...</>,
  <>Getting your <strong>follow-ups</strong> ready...</>,
  <>Almost there! <strong>Setting things up</strong>...</>,
];

export const LoadingScreen = () => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [messageVisible, setMessageVisible] = useState(true);

  useEffect(() => {
    let fadeTimeout: ReturnType<typeof setTimeout> | undefined;
    const interval = setInterval(() => {
      setMessageVisible(false);
      fadeTimeout = setTimeout(() => {
        setMessageIndex((current) => (current + 1) % loadingMessages.length);
        setMessageVisible(true);
      }, 240);
    }, 3000);

    return () => {
      clearInterval(interval);
      if (fadeTimeout !== undefined) clearTimeout(fadeTimeout);
    };
  }, []);

  return (
    <main className="loading-screen" role="status" aria-live="polite" aria-busy="true">
      <div className="loading-screen__glow loading-screen__glow--blue" aria-hidden="true" />
      <div className="loading-screen__glow loading-screen__glow--violet" aria-hidden="true" />

      <div className="loading-screen__content">
        <img className="loading-screen__logo" src="/leadflow-icon.svg" alt="LeadFlow" />

        <h1 className="loading-screen__brand">
          <span>Lead</span><span className="text-indigo-400">Flow</span>
        </h1>
        <p className="loading-screen__tagline">Turn Leads Into Conversations</p>

        <div className="loading-screen__activity" aria-hidden="true">
          <span className="loading-screen__dot" />
          <span className="loading-screen__dot" />
          <span className="loading-screen__dot" />
        </div>
        <p className={`loading-screen__message${messageVisible ? ' is-visible' : ''}`}>
          <span>{loadingMessages[messageIndex]}</span>
        </p>
      </div>
    </main>
  );
};
