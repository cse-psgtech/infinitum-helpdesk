'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    setIsAuthenticated(!!token);
  }, [pathname]);

  // Don't show sidebar on login page or if not authenticated
  if (pathname === '/login' || !isAuthenticated) {
    return null;
  }

  const navItems = [
    { label: 'Provide Kit', path: '/provide-kit' },
    { label: 'Kit List', path: '/kit-list' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    router.push('/login');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Image 
            src="/logo.png" 
            alt="Infinitum Logo" 
            width={80} 
            height={80}
            priority
          />
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={`sidebar-nav-item ${pathname === item.path ? 'active' : ''}`}
          >
            <span className="sidebar-nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <button onClick={handleLogout} className="sidebar-logout">
        <span className="sidebar-nav-label">Logout</span>
      </button>
    </div>
  );
}
