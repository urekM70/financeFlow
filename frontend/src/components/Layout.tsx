import { useState, ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

/**
 * Props for the Layout component.
 */
interface LayoutProps {
  /**
   * The main content to be displayed within the layout.
   */
  children: ReactNode;
}

/**
 * The main layout component for the application.
 * It includes the Navbar and Sidebar, and manages the sidebar's open/close state.
 * The main content of the page is rendered as children.
 *
 * @param {LayoutProps} props - The component props.
 * @returns {JSX.Element} The rendered layout component.
 */
export function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  /**
   * Toggles the sidebar's visibility.
   */
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <Navbar onMenuClick={toggleSidebar} />
      <main className="md:ml-64 pt-16 transition-all duration-300">
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
