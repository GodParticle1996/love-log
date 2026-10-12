import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useApi, ApiProvider } from './hooks/useApi';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Timeline } from './pages/Timeline';
import { CreateMemory } from './pages/CreateMemory';
import { EditMemory } from './pages/EditMemory';
import { MemoryDetail } from './pages/MemoryDetail';
import { MoodTracker } from './pages/MoodTracker';
import { YearInReview } from './pages/YearInReview';
import { Capsules } from './pages/Capsules';
import { CreateCapsule } from './pages/CreateCapsule';
import { CapsuleDetail } from './pages/CapsuleDetail';
import './styles.css';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useApi();
  if (loading) return <div className="loading-screen"><div className="spinner" /><p>Loading LoveLog...</p></div>;
  if (!token) return <Navigate to="/login" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ApiProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <PrivateRoute>
            <div className="app-layout">
              <Navbar />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Timeline />} />
                  <Route path="/create" element={<CreateMemory />} />
                  <Route path="/memory/:id/edit" element={<EditMemory />} />
                  <Route path="/memory/:id" element={<MemoryDetail />} />
                  <Route path="/moods" element={<MoodTracker />} />
                  <Route path="/year-in-review/:year?" element={<YearInReview />} />
                  <Route path="/capsules" element={<Capsules />} />
                  <Route path="/capsules/create" element={<CreateCapsule />} />
                  <Route path="/capsules/:id" element={<CapsuleDetail />} />
                </Routes>
              </main>
            </div>
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
    </ApiProvider>
  );
}
