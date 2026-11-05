import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ToastContainer } from './components/common/Toast';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Login } from './pages/auth/Login';

// Admin modules
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { StudentManagement } from './pages/admin/StudentManagement';
import { ParentManagement } from './pages/admin/ParentManagement';
import { BusManagement } from './pages/admin/BusManagement';
import { DriverManagement } from './pages/admin/DriverManagement';
import { RouteManagement } from './pages/admin/RouteManagement';
import { TransportAllocationPage } from './pages/admin/TransportAllocation';
import { AttendanceManagement } from './pages/admin/AttendanceManagement';
import { TripManagement } from './pages/admin/TripManagement';
import { ComplaintManagement } from './pages/admin/ComplaintManagement';
import { NoticeManagement } from './pages/admin/NoticeManagement';
import { ReportsAnalytics } from './pages/admin/ReportsAnalytics';
import { SettingsPage } from './pages/admin/SettingsPage';
import { HandoverManagement } from './pages/admin/HandoverManagement';
import { DisruptionManagement } from './pages/admin/DisruptionManagement';
import { UserManagement } from './pages/admin/UserManagement';

// Portal views for Driver, Parent, Student
import { DriverDashboard } from './pages/driver/DriverDashboard';
import { ParentDashboard } from './pages/parent/ParentDashboard';
import { StudentDashboard } from './pages/student/StudentDashboard';

const MainApp: React.FC = () => {
  const { currentUser, isAuthenticated } = useAuth();

  const getDefaultTabForRole = (role?: string) => {
    switch (role) {
      case 'driver':
        return 'driver-console';
      case 'parent':
        return 'parent-portal';
      case 'student':
        return 'student-portal';
      case 'admin':
      default:
        return 'dashboard';
    }
  };

  const [currentTab, setCurrentTab] = useState<string>(() =>
    getDefaultTabForRole(currentUser?.role)
  );
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Sync tab when user logs in or role changes
  useEffect(() => {
    if (currentUser?.role) {
      setCurrentTab(getDefaultTabForRole(currentUser.role));
    }
  }, [currentUser?.role]);

  // STRICT LOGIN-FIRST GUARD:
  // If not authenticated or no currentUser, immediately show the Login screen!
  if (!isAuthenticated || !currentUser) {
    return <Login />;
  }

  // Render content based on role and tab
  const renderContent = () => {
    // 1. Driver Persona
    if (currentUser.role === 'driver') {
      if (currentTab === 'notices') {
        return <NoticeManagement />;
      }
      return <DriverDashboard activeTab={currentTab} onSelectTab={setCurrentTab} />;
    }

    // 2. Parent Persona
    if (currentUser.role === 'parent') {
      if (currentTab === 'notices') {
        return <NoticeManagement />;
      }
      return <ParentDashboard activeTab={currentTab} onSelectTab={setCurrentTab} />;
    }

    // 3. Student Persona
    if (currentUser.role === 'student') {
      if (currentTab === 'notices') {
        return <NoticeManagement />;
      }
      return <StudentDashboard activeTab={currentTab} onSelectTab={setCurrentTab} />;
    }

    // 4. Administrator Persona (All Modules)
    switch (currentTab) {
      case 'dashboard':
        return <AdminDashboard onNavigate={setCurrentTab} />;
      case 'students':
        return <StudentManagement />;
      case 'parents':
        return <ParentManagement />;
      case 'buses':
        return <BusManagement />;
      case 'drivers':
        return <DriverManagement />;
      case 'routes':
        return <RouteManagement />;
      case 'allocation':
        return <TransportAllocationPage />;
      case 'attendance':
        return <AttendanceManagement />;
      case 'handovers':
        return <HandoverManagement />;
      case 'disruptions':
        return <DisruptionManagement />;
      case 'trips':
        return <TripManagement />;
      case 'complaints':
        return <ComplaintManagement />;
      case 'notices':
        return <NoticeManagement />;
      case 'reports':
        return <ReportsAnalytics />;
      case 'users':
        return <UserManagement />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <AdminDashboard onNavigate={setCurrentTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex flex-col">
      <Navbar
        toggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        onNavigate={setCurrentTab}
      />
      <div className="flex flex-1">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full transition-all duration-300 overflow-x-hidden">
          {renderContent()}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainApp />
      </DataProvider>
    </AuthProvider>
  );
}
