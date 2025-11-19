import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Excalidraw Plus</h1>
        <div className="user-actions">
          <Link to="/auth" className="btn btn-primary">
            Sign In
          </Link>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="hero-section">
          <h2>Welcome to Excalidraw Plus</h2>
          <p>Enhanced drawing experience with cloud sync, collaboration, and more!</p>
          <Link to="/editor" className="btn btn-large btn-primary">
            Start Drawing
          </Link>
        </div>

        <div className="features-section">
          <div className="feature-card">
            <h3>🎤 Voice Input</h3>
            <p>Create text elements using voice recognition</p>
          </div>
          <div className="feature-card">
            <h3>☁️ Cloud Sync</h3>
            <p>Save and sync your drawings across devices</p>
          </div>
          <div className="feature-card">
            <h3>👥 Collaboration</h3>
            <p>Work together in real-time</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
