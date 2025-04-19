import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import GroceryChecklist from './pages/GroceryChecklist';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/checklist" element={<GroceryChecklist />} />
      </Routes>
    </Router>
  );
}

export default App;
