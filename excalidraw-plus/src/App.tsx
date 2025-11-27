import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard/Dashboard';
import { Editor } from './components/Editor/Editor';
import Auth from './components/Auth/Auth';
import MainLayout from './components/MainLayout/MainLayout';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/editor/:id?" element={<Editor />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
