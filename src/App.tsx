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
        <h1>Mathe-Supermarkt</h1>
      </header>

      <nav className="nav-bar">
        <button
          className={`nav-item ${activeTab === 'supermarket' ? 'active' : ''}`}
          onClick={() => setActiveTab('supermarket')}
        >
          <Store size={18} /> <span>Supermarkt</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'arithmetic' ? 'active' : ''}`}
          onClick={() => setActiveTab('arithmetic')}
        >
          <Calculator size={18} /> <span>Rechnen</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'ai' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai')}
        >
          <Brain size={18} /> <span>KI-Aufgaben</span>
        </button>
      </nav>

      <motion.main
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {activeTab === 'supermarket' && <MoneyDragDrop />}
        {activeTab === 'arithmetic' && <ArithmeticTest />}
        {activeTab === 'ai' && <AIWordProblems />}
      </motion.main>
    </div>
  );
}

export default App;
