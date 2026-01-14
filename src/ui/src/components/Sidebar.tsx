import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Cloud,
  FileText,
  GitMerge,
  Bug,
  FolderGit,
  Settings,
  Activity,
  Play,
  Code,
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    // WORKSPACE Section
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'WORKSPACE' },
    { path: '/test-viewer', label: 'Test Script Viewer', icon: Code, section: 'WORKSPACE' },
    
    // EXECUTION Section
    { path: '/automate', label: 'BrowserStack Automate', icon: Cloud, section: 'EXECUTION' },
    { path: '/test-management', label: 'Test Management', icon: FileText, section: 'EXECUTION' },
    { path: '/execution', label: 'Remote Execution', icon: Play, section: 'EXECUTION' },
    
    // QUALITY & INSIGHTS Section
    { path: '/correlation', label: 'Correlation View', icon: GitMerge, section: 'QUALITY & INSIGHTS' },
    { path: '/jira', label: 'Jira Defects', icon: Bug, section: 'QUALITY & INSIGHTS' },
    
    // TOOLS Section
    { path: '/repo', label: 'Repo Companion', icon: FolderGit, section: 'TOOLS' },
    { path: '/settings', label: 'Settings', icon: Settings, section: 'TOOLS' },
    { path: '/diagnostics', label: 'Diagnostics', icon: Activity, section: 'TOOLS' },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const groupedItems = navItems.reduce((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = [];
    }
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, typeof navItems>);

  return (
    <aside className="w-64 bg-base-200 border-r border-base-300 flex flex-col h-screen">
      {/* Logo Section */}
      <div className="p-4 border-b border-base-300">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          <span className="font-semibold text-lg text-base-content">Axis</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        {Object.entries(groupedItems).map(([section, items]) => (
          <div key={section} className="mb-6">
            <div className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-2 px-2">
              {section}
            </div>
            <ul className="space-y-1">
              {items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`
                        flex items-center gap-3 px-3 py-2 rounded-lg
                        transition-colors duration-200
                        ${active
                          ? 'bg-primary text-primary-content'
                          : 'text-base-content/70 hover:bg-base-300 hover:text-base-content'
                        }
                      `}
                    >
                      <Icon size={18} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-base-300">
        <div className="text-xs text-base-content/50 text-center">
          Axis
          <br />
          v1.0.0
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

