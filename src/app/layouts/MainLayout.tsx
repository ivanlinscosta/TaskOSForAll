import { Outlet } from 'react-router';
import { useAppStore } from '../../stores/useAppStore';
import AppSidebar from '../components/layout/AppSidebar';
import AppHeader from '../components/layout/AppHeader';
import { useEffect } from 'react';

export default function MainLayout() {
  const { contextMode } = useAppStore();

  useEffect(() => {
    // Apply theme class to body
    document.body.className = contextMode;
  }, [contextMode]);

  return (
    <div className={`${contextMode} min-h-screen bg-background`}>
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
