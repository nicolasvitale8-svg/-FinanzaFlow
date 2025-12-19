
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Budget } from './pages/Budget';
import { Jars } from './pages/Jars';
import { Accounts } from './pages/Accounts';
import { ImportPage } from './pages/Import';
import { SettingsPage } from './pages/Settings';
import { AICoach } from './pages/AICoach';
import { StorageService } from './services/storageService';
import { GoogleDriveService } from './services/googleDriveService';

function App() {
  useEffect(() => {
    const initialSync = async () => {
      const token = GoogleDriveService.getAccessToken();
      if (token) {
        console.info("🔄 Detectada sesión de Google. Sincronizando datos...");
        try {
          await StorageService.pullFromGoogleDrive();
        } catch (e) {
          console.warn("No se pudo realizar la sincronización inicial.");
        }
      }
    };
    initialSync();
  }, []);

  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/jars" element={<Jars />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/ai-coach" element={<AICoach />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}

export default App;
