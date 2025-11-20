import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  return (
    <div className="dashboard min-h-screen bg-gray-50">
      <header className="dashboard-header bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Excalidraw Plus</h1>
        <div className="user-actions">
          <Link to="/auth" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Sign In
          </Link>
        </div>
      </header>

      <main className="dashboard-main px-6 py-12">
        <div className="hero-section text-center max-w-4xl mx-auto mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Excalidraw Plus</h2>
          <p className="text-xl text-gray-600 mb-8">Enhanced drawing experience with cloud sync, collaboration, and more!</p>
          <Link to="/editor" className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors inline-block">
            Start Drawing
          </Link>
        </div>

        <div className="features-section grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="feature-card bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-2xl mb-3">🎤 Voice Input</h3>
            <p className="text-gray-600">Create text elements using voice recognition</p>
          </div>
          <div className="feature-card bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-2xl mb-3">☁️ Cloud Sync</h3>
            <p className="text-gray-600">Save and sync your drawings across devices</p>
          </div>
          <div className="feature-card bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-2xl mb-3">👥 Collaboration</h3>
            <p className="text-gray-600">Work together in real-time</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
