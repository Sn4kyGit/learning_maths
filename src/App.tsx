import { useState } from 'react';
import { Store, Calculator, Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import { MoneyDragDrop } from './components/features/MoneyDragDrop';
import { ArithmeticTest } from './components/features/ArithmeticTest';
import { AIWordProblems } from './components/features/AIWordProblems';
import './index.css';

type Tab = 'supermarket' | 'arithmetic' | 'ai';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('supermarket');

  return (
    <div className="app-container">
      <header className="supermarket-header">
        <motion.h1
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
        >
          Mathe-Superhelden
        </motion.h1>
      </header>

      <nav className="nav-bar">
        <button
          className={`nav-item ${activeTab === 'supermarket' ? 'active' : ''}`}
          onClick={() => setActiveTab('supermarket')}
          title="Supermarkt"
        >
          <Store size={28} strokeWidth={2.5} />
          <span>Laden</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'arithmetic' ? 'active' : ''}`}
          onClick={() => setActiveTab('arithmetic')}
          title="Rechnen"
        >
          <Calculator size={28} strokeWidth={2.5} />
          <span>Kasse</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'ai' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai')}
          title="KI-Aufgaben"
        >
          <Brain size={28} strokeWidth={2.5} />
          <span>Sachaufgaben</span>
        </button>
      </nav>

      <motion.main
        key={activeTab}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        {activeTab === 'supermarket' && <MoneyDragDrop />}
        {activeTab === 'arithmetic' && <ArithmeticTest />}
        {activeTab === 'ai' && <AIWordProblems />}
      </motion.main>
    </div>
  );
}

export default App;
