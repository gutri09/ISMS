import React, { useState } from 'react';
import { IntelligenceProvider, useIntelligence } from './context/IntelligenceContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { InputDataView } from './components/input/InputDataView';
import { LihatDataView } from './components/data/LihatDataView';
import { LoginPage } from './components/auth/LoginPage';
import { UserManagementView } from './components/admin/UserManagementView';
import { MasterConfigView } from './components/admin/MasterConfigView';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { SystemLoadingScreen } from './components/common/SystemLoadingScreen';

const MainContent: React.FC = () => {
  const { currentUser, activeMenu, isInitialLoading, bypassInitialLoading } = useIntelligence();
  const [collapsed, setCollapsed] = useState(false);

  // If user is not authenticated, display login page
  if (!currentUser) {
    return <LoginPage />;
  }

  // If initial database records are still loading, display military loading screen
  if (isInitialLoading) {
    return (
      <SystemLoadingScreen
        onBypass={bypassInitialLoading}
        message="Menghubungkan ke Basis Data Intelijen Terpusat..."
        subMessage="Sedang mengunduh dan menyinkronkan seluruh rekaman data dari database server..."
      />
    );
  }

  const role = currentUser.role;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
          {activeMenu === 'dashboard' && <DashboardView />}

          {/* Input Data: Admin & Analis only */}
          {activeMenu === 'input' && (role === 'admin' || role === 'analis' ? <InputDataView /> : <DashboardView />)}

          {/* Lihat Data: All roles (with role-gated mutations in LihatDataView) */}
          {activeMenu === 'data' && <LihatDataView />}

          {/* Master Config: Admin only */}
          {activeMenu === 'master' && (role === 'admin' ? <MasterConfigView /> : <DashboardView />)}

          {/* User Management: Admin only */}
          {activeMenu === 'users' && (role === 'admin' ? <UserManagementView /> : <DashboardView />)}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary fallbackTitle="Terjadi Kendala Memuat ISMS Dashboard">
      <IntelligenceProvider>
        <MainContent />
      </IntelligenceProvider>
    </ErrorBoundary>
  );
};

export default App;
