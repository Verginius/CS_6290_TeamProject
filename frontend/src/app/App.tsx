import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Overview } from './pages/Overview';
import { AttackSimulation } from './pages/AttackSimulation';
import { Comparison } from './pages/Comparison';
import { Governance } from './pages/Governance';
import { Economics } from './pages/Economics';
import { Defense } from './pages/Defense';
import { History } from './pages/History';

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/attack" element={<AttackSimulation />} />
          <Route path="/comparison" element={<Comparison />} />
          <Route path="/governance" element={<Governance />} />
          <Route path="/economics" element={<Economics />} />
          <Route path="/defense" element={<Defense />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </Layout>
    </Router>
  );
}
