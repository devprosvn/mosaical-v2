import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Web3Provider } from './contexts/Web3Context';
import { NotificationProvider } from './contexts/NotificationContext';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import LoanPage from './pages/LoanPage';
import DPOTokensPage from './pages/DPOTokensPage';
import MainLayout from './layouts/MainLayout';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <Web3Provider>
          <MainLayout>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/loans" element={<LoanPage />} />
              <Route path="/dpo-tokens" element={<DPOTokensPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </MainLayout>
        </Web3Provider>
      </NotificationProvider>
    </BrowserRouter>
  );
}

export default App;
