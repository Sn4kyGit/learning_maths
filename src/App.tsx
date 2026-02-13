import { useState, useEffect } from 'react';
import { Store, Calculator, Brain, Trophy, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoneyDragDrop } from './components/features/MoneyDragDrop';
import { ArithmeticTest } from './components/features/ArithmeticTest';
import { AIWordProblems } from './components/features/AIWordProblems';
import { WelcomeScreen } from './components/features/WelcomeScreen';
import { Leaderboard } from './components/features/Leaderboard';
import { GamificationProvider } from './context/GamificationContext';
import { useGamification } from './hooks/useGamification';
import { Analytics } from '@vercel/analytics/react';
import './index.css';

import { useDevice } from './hooks/useDevice';
import { MoneyDragDropMobile } from './components/features/mobile/MoneyDragDropMobile';
import { ArithmeticTestMobile } from './components/features/mobile/ArithmeticTestMobile';
import { AIWordProblemsMobile } from './components/features/mobile/AIWordProblemsMobile';

type Tab = 'supermarket' | 'arithmetic' | 'ai';

function AppContent() {
  const [heroName, setHeroName] = useState<string | null>(() => {
    return localStorage.getItem('heroName');
  });
  const [activeTab, setActiveTab] = useState<Tab>('supermarket');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const { isMobile } = useDevice();
  const { points, lives } = useGamification();

  useEffect(() => {
    if (heroName) {
      localStorage.setItem('heroName', heroName);
    }
  }, [heroName]);

  const handleStartMission = (name: string) => {
    setHeroName(name);
  };

  if (!heroName) {
    return <WelcomeScreen onStart={handleStartMission} />;
  }

  return (
    <div className={`app-container ${isMobile ? 'mobile' : ''}`}>
      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          {/* Section 1: Navigation */}
          <nav className="header-nav">
            <button
              className={`nav-item ${activeTab === 'supermarket' ? 'active' : ''}`}
              onClick={() => setActiveTab('supermarket')}
              title="Laden"
            >
              <Store size={isMobile ? 20 : 22} strokeWidth={2.5} />
              <span>Laden</span>
            </button>
            <button
              className={`nav-item ${activeTab === 'arithmetic' ? 'active' : ''}`}
              onClick={() => setActiveTab('arithmetic')}
              title="Kasse"
            >
              <Calculator size={isMobile ? 20 : 22} strokeWidth={2.5} />
              <span>Kasse</span>
            </button>
            <button
              className={`nav-item ${activeTab === 'ai' ? 'active' : ''}`}
              onClick={() => setActiveTab('ai')}
              title="Sachaufgaben"
            >
              <Brain size={isMobile ? 20 : 22} strokeWidth={2.5} />
              <span>Sachaufgaben</span>
            </button>
          </nav>

          {/* Section 2: Gamification Stats */}
          <div className="header-stats-center">
            <div className="stats-row">
              <span className="stats-label">{isMobile ? 'Vers.' : 'Versuche'}:</span>
              <div className="lives-mini-display">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: i < lives ? 1 : 0.8 }}
                    className={`heart-mini-icon ${i < lives ? 'active' : 'empty'}`}
                  >
                    <Heart
                      size={isMobile ? 18 : 20}
                      fill={i < lives ? "#ef4444" : "rgba(0,0,0,0.1)"}
                      color={i < lives ? "#ef4444" : "rgba(0,0,0,0.2)"}
                    />
                  </motion.div>
                ))}
              </div>

              <div className="stats-divider" />

              <motion.div
                className="points-mini-badge"
                key={points}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
              >
                <Trophy size={18} className="text-amber-500" />
                <span className="points-mini-value">{points}</span>
                <span className="points-mini-label">{isMobile ? 'P.' : 'Punkte'}</span>
              </motion.div>
            </div>
          </div>

          {/* Section 3: User Info & Leaderboard */}
          <div className="header-user-side">
            <div className="user-controls-group">
              {!isMobile && (
                <div className="mini-user-badge">
                  <span className="mini-hero-label">Held:</span>
                  <span className="mini-hero-name">{heroName}</span>
                </div>
              )}

              <button
                className="heldeliste-btn"
                onClick={() => setShowLeaderboard(true)}
                title="Heldeliste"
              >
                <Trophy size={18} strokeWidth={2.5} />
                <span>{isMobile ? 'Helden' : 'Heldeliste'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <motion.main
        key={`${activeTab}-${isMobile}`}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="dashboard-main"
      >
        {activeTab === 'supermarket' && (
          isMobile ? <MoneyDragDropMobile /> : <MoneyDragDrop />
        )}
        {activeTab === 'arithmetic' && (
          isMobile ? <ArithmeticTestMobile /> : <ArithmeticTest />
        )}
        {activeTab === 'ai' && (
          isMobile ? <AIWordProblemsMobile /> : <AIWordProblems />
        )}
      </motion.main>

      {/* Modals */}
      <AnimatePresence>
        {showLeaderboard && (
          <Leaderboard
            isModal={true}
            onClose={() => setShowLeaderboard(false)}
          />
        )}
      </AnimatePresence>
      <Analytics />
    </div>
  );
}

function App() {
  return (
    <GamificationProvider>
      <AppContent />
    </GamificationProvider>
  );
}

export default App;
