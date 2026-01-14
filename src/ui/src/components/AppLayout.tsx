import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopToolbar from './TopToolbar';
import { useThemeStore } from '../store/theme-store';

interface AppLayoutProps {
  children?: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { theme } = useThemeStore();

  // Apply theme to HTML element on mount and theme change
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  return (
    <div className="flex h-screen bg-base-100" data-theme={theme}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopToolbar />
        <main className="flex-1 overflow-y-auto p-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

