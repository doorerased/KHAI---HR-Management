import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layouts/Layout';
import ProfileExtractor from './pages/ProfileExtractor';
import MessageTemplate from './pages/MessageTemplate';
import BankExtractor from './pages/BankExtractor';
import ProjectManager from './pages/ProjectManager';
import Guide from './pages/Guide';
import SplashScreen from './components/SplashScreen';
import { AnimatePresence } from 'framer-motion';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 2.5초 후 메인 화면으로 전환
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2800); // 애니메이션 여유 시간 포함
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {loading ? (
        <SplashScreen />
      ) : (
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/guide" replace />} />
            <Route element={<Layout />}>
              <Route path="guide" element={<Guide />} />
              <Route path="profile" element={<ProfileExtractor />} />
              <Route path="message" element={<MessageTemplate />} />
              <Route path="project" element={<ProjectManager />} />
              <Route path="bank" element={<BankExtractor />} />
            </Route>
          </Routes>
          {/* Version display moved outside of Routes to ensure syntactical correctness */}
          <span className="text-[10px] font-bold text-gray-300 tracking-wider">v1.7</span>
        </Router>
      )}
    </>
  );
}

export default App;
