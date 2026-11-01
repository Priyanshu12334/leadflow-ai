import './LoadingScreen.css';

export const LoadingScreen = () => (
  <main className="loading-screen" role="status" aria-live="polite" aria-busy="true">
    <div className="loading-screen__glow loading-screen__glow--blue" aria-hidden="true" />
    <div className="loading-screen__glow loading-screen__glow--violet" aria-hidden="true" />

    <div className="loading-screen__content">
      <div className="loading-screen__logo-frame">
        <img className="loading-screen__logo" src="/leadflow-icon.svg" alt="LeadFlow" />
      </div>

      <h1 className="loading-screen__brand">LeadFlow</h1>
      <p className="loading-screen__tagline">Turn Leads Into Conversations</p>

      <div className="loading-screen__activity" aria-hidden="true">
        <span className="loading-screen__dot" />
        <span className="loading-screen__dot" />
        <span className="loading-screen__dot" />
      </div>
      <p className="loading-screen__message">Preparing your workspace...</p>
    </div>
  </main>
);
