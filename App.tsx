import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ProductDetails from './pages/ProductDetails';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/edit/:id" element={<AdminDashboard />} />
                <Route path="/product/:id" element={<ProductDetails />} />
              </Routes>
            </main>
          </div>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
};

export default App;