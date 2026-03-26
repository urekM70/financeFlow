import { Bell, Menu } from 'lucide-react';

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  return (
    <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 fixed top-0 right-0 left-0 md:left-64 z-10 transition-all duration-300">
      <div className="h-full flex items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={onMenuClick}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg md:hidden"
          >
            <Menu className="h-6 w-6 text-slate-600 dark:text-slate-400" />
          </button>
          
        </div>

        <div className="flex items-center space-x-4">
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full relative">
            <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
          </button>
        </div>
      </div>
    </header>
  );
}
