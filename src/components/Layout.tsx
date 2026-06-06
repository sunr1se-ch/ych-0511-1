import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  Wheat
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';

interface Props {
  children: React.ReactNode;
}

const menuItems = [
  { path: '/dashboard', label: '实时状态', icon: LayoutDashboard },
  { path: '/todos', label: '工单待办', icon: ClipboardList, showBadge: true },
  { path: '/history', label: '历史工单', icon: History },
  { path: '/fields', label: '晒场管理', icon: Settings, requireAdmin: true },
];

export default function Layout({ children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { getTotalPendingCount, refreshAll, fetchWorkOrders } = useAppStore();

  useEffect(() => {
    fetchWorkOrders('pending');
    const interval = setInterval(refreshAll, 30000);
    return () => clearInterval(interval);
  }, [fetchWorkOrders, refreshAll]);

  const pendingCount = getTotalPendingCount();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderMenuItem = (item: typeof menuItems[0]) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;
    const isDesktop = window.innerWidth >= 1024;

    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={() => setSidebarOpen(false)}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative ${
          isActive
            ? isDesktop
              ? 'bg-white/20 text-white'
              : 'bg-field text-white'
            : isDesktop
            ? 'text-white/70 hover:bg-white/10 hover:text-white'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <Icon className="w-5 h-5" />
        <span>{item.label}</span>
        {item.showBadge && pendingCount > 0 && (
          <span className="absolute right-2 inline-flex items-center justify-center px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5">
            {pendingCount > 99 ? '99+' : pendingCount}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-field text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <Wheat className="w-6 h-6" />
          <span className="font-semibold">苏北合作社</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <div className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)}></div>
        <div className={`absolute left-0 top-0 bottom-0 w-64 bg-white transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="pt-16 pb-4 h-full flex flex-col">
            <nav className="flex-1 px-4 space-y-1">
              {menuItems.filter(item => !item.requireAdmin || user?.role === 'admin').map(item => renderMenuItem(item))}
            </nav>
            <div className="px-4 py-3 border-t">
              <div className="text-sm text-gray-500 mb-2">{user?.name}</div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>退出登录</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:bg-field lg:text-white">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <Wheat className="w-8 h-8 text-wheat" />
          <div>
            <div className="font-semibold text-lg">苏北合作社</div>
            <div className="text-sm text-white/60">晒谷场管理系统</div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {menuItems.filter(item => !item.requireAdmin || user?.role === 'admin').map(item => renderMenuItem(item))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <span className="font-semibold">{user?.name?.[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{user?.name}</div>
              <div className="text-sm text-white/60">{user?.role === 'admin' ? '管理员' : '作业员'}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2 text-white/70 hover:bg-white/10 hover:text-white rounded-lg transition-colors mt-2"
          >
            <LogOut className="w-5 h-5" />
            <span>退出登录</span>
          </button>
        </div>
      </div>

      <div className="lg:pl-64 pt-14 lg:pt-0">
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
