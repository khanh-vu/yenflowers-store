// ==========================================
// Admin Layout Component
// With authentication protection
// ==========================================

import { useState } from 'react';
import { Link, useLocation, Outlet, Navigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    FolderTree,
    ShoppingCart,
    FileText,
    Share2,
    Settings,
    Menu,
    X,
    ChevronRight,
    Bell,
    LogOut,
    Flower2,
    Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Navigation items
const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/admin/products', icon: Package, label: 'Sản phẩm' },
    { path: '/admin/categories', icon: FolderTree, label: 'Danh mục' },
    { path: '/admin/orders', icon: ShoppingCart, label: 'Đơn hàng', badge: 3 },
    { path: '/admin/blog', icon: FileText, label: 'Bài viết' },
    { path: '/admin/social', icon: Share2, label: 'Social Feed' },
    { path: '/admin/settings', icon: Settings, label: 'Cài đặt' },
];

export default function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const location = useLocation();
    const { user, isLoading, isAuthenticated, logout } = useAuth();

    // Show loading while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-pink-50">
                <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/admin/login" replace />;
    }

    const handleLogout = () => {
        logout();
        toast.success('Đã đăng xuất');
    };

    const isActive = (path: string, exact = false) => {
        if (exact) return location.pathname === path;
        return location.pathname.startsWith(path);
    };

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-rose-50 via-white to-pink-50">
            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 flex flex-col bg-white/80 backdrop-blur-xl border-r border-rose-100 shadow-lg shadow-rose-100/20 transition-all duration-300',
                    sidebarOpen ? 'w-64' : 'w-20'
                )}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-rose-100">
                    <Link to="/admin" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-400 via-pink-400 to-rose-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-rose-200">
                            <Flower2 className="h-6 w-6" />
                        </div>
                        {sidebarOpen && (
                            <span className="text-lg font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                                YenFlowers
                            </span>
                        )}
                    </Link>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                    >
                        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
                    {navItems.map((item) => {
                        const active = isActive(item.path, item.exact);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    'flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group relative',
                                    active
                                        ? 'bg-gradient-to-r from-rose-400 to-pink-400 text-white shadow-lg shadow-rose-200'
                                        : 'text-gray-600 hover:bg-rose-50 hover:text-rose-600'
                                )}
                            >
                                <item.icon className={cn('h-5 w-5 flex-shrink-0', active ? 'text-white' : 'text-rose-400 group-hover:text-rose-500')} />
                                {sidebarOpen && (
                                    <>
                                        <span className="flex-1 font-medium">{item.label}</span>
                                        {item.badge && (
                                            <Badge className={cn(
                                                'text-xs px-2 py-0.5',
                                                active ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-600'
                                            )}>
                                                {item.badge}
                                            </Badge>
                                        )}
                                        {active && (
                                            <ChevronRight className="h-4 w-4 text-white/80" />
                                        )}
                                    </>
                                )}
                                {!sidebarOpen && item.badge && (
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-rose-400 rounded-full animate-pulse" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Section */}
                <div className="p-4 border-t border-rose-100 bg-gradient-to-r from-rose-50 to-pink-50">
                    <div className={cn('flex items-center gap-3', !sidebarOpen && 'justify-center')}>
                        <Avatar className="h-10 w-10 ring-2 ring-rose-200">
                            <AvatarImage src="https://api.dicebear.com/7.x/lorelei/svg?seed=yenflowers" />
                            <AvatarFallback className="bg-gradient-to-br from-rose-400 to-pink-400 text-white">
                                {user?.full_name?.charAt(0) || 'A'}
                            </AvatarFallback>
                        </Avatar>
                        {sidebarOpen && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-700 truncate">{user?.full_name || 'Admin'}</p>
                                <p className="text-xs text-rose-400 truncate">{user?.email}</p>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className={cn('flex-1 transition-all duration-300', sidebarOpen ? 'ml-64' : 'ml-20')}>
                {/* Header */}
                <header className="sticky top-0 z-40 h-16 flex items-center justify-between px-6 bg-white/80 backdrop-blur-xl border-b border-rose-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                            {navItems.find(item => isActive(item.path, item.exact))?.label || 'Dashboard'}
                        </h1>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="relative text-gray-500 hover:text-rose-500 hover:bg-rose-50">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-400 rounded-full animate-pulse" />
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="gap-2 hover:bg-rose-50">
                                    <Avatar className="h-8 w-8 ring-2 ring-rose-100">
                                        <AvatarImage src="https://api.dicebear.com/7.x/lorelei/svg?seed=yenflowers" />
                                        <AvatarFallback className="bg-rose-400 text-white text-xs">
                                            {user?.full_name?.charAt(0) || 'A'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="hidden md:inline-block text-gray-700 font-medium">{user?.full_name || 'Admin'}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-white border-rose-100">
                                <DropdownMenuItem className="hover:bg-rose-50 cursor-pointer">
                                    <Settings className="h-4 w-4 mr-2 text-rose-400" />
                                    Cài đặt
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-rose-100" />
                                <DropdownMenuItem onClick={handleLogout} className="text-red-500 hover:bg-red-50 cursor-pointer">
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Đăng xuất
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6 min-h-[calc(100vh-4rem)]">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
