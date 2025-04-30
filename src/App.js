import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import GroceryChecklist from './pages/GroceryChecklist';
import InventoryReport from './pages/InventoryReport';
import MetaManager from './pages/MetaManager';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/checklist" element={<GroceryChecklist />} />
        <Route path="/manager" element={<MetaManager />} />
        <Route path="/inventory-report" element={<InventoryReport />} />        
      </Routes>
      <Toaster position="top-center" reverseOrder={false} />
    </Router>
  );
}

export default App;
