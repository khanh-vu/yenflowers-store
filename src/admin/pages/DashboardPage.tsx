// ==========================================
// Admin Dashboard Page
// Overview with key metrics and recent activity
// ==========================================

import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Package,
    ShoppingCart,
    DollarSign,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    Eye,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import type { Order, Product } from '@/types';
import { dashboardApi } from '@/services/api';

// Format currency
function formatVND(amount: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// Format relative time
function formatRelativeTime(date: string) {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
}

// Status badge component
function OrderStatusBadge({ status }: { status: string }) {
    const variants: Record<string, { className: string; label: string }> = {
        pending: { className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', label: 'Chờ xử lý' },
        confirmed: { className: 'bg-blue-500/10 text-blue-600 border-blue-500/20', label: 'Đã xác nhận' },
        processing: { className: 'bg-purple-500/10 text-purple-600 border-purple-500/20', label: 'Đang xử lý' },
        shipped: { className: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20', label: 'Đang giao' },
        delivered: { className: 'bg-green-500/10 text-green-600 border-green-500/20', label: 'Đã giao' },
        cancelled: { className: 'bg-red-500/10 text-red-600 border-red-500/20', label: 'Đã hủy' },
    };

    const variant = variants[status] || variants.pending;

    return (
        <Badge variant="outline" className={variant.className}>
            {variant.label}
        </Badge>
    );
}

// Stat Card Component
function StatCard({
    title,
    value,
    icon: Icon,
    change,
    changeType,
    loading,
}: {
    title: string;
    value: string;
    icon: React.ElementType;
    change?: string;
    changeType?: 'up' | 'down';
    loading?: boolean;
}) {
    if (loading) {
        return (
            <Card className="bg-white/80 backdrop-blur-sm border-rose-100">
                <CardContent className="p-6">
                    <Skeleton className="h-4 w-24 mb-3" />
                    <Skeleton className="h-8 w-32 mb-2" />
                    <Skeleton className="h-4 w-20" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="relative overflow-hidden bg-white/80 backdrop-blur-sm border-rose-100 shadow-lg shadow-rose-100/30 hover:shadow-xl hover:shadow-rose-200/40 transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-100/50 to-pink-100/50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-500">{title}</span>
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-rose-100 to-pink-100">
                        <Icon className="h-5 w-5 text-rose-500" />
                    </div>
                </div>
                <div className="text-2xl font-bold text-gray-800 mb-1">{value}</div>
                {change && (
                    <div className="flex items-center gap-1 text-sm">
                        {changeType === 'up' ? (
                            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                        ) : (
                            <ArrowDownRight className="h-4 w-4 text-red-400" />
                        )}
                        <span className={changeType === 'up' ? 'text-emerald-600 font-medium' : 'text-red-500 font-medium'}>
                            {change}
                        </span>
                        <span className="text-gray-400">so với tuần trước</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function DashboardPage() {
    const { data: stats, isLoading, error } = useQuery({
        queryKey: ['dashboard_stats'],
        queryFn: dashboardApi.getStats,
        refetchInterval: 60000, // Refresh every minute
    });

    const recentOrders = stats?.recent_orders || [];
    const topProducts = stats?.top_products || [];

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                    Failed to load dashboard data. Please try again.
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Tổng sản phẩm"
                    value={stats?.total_products?.toString() || '0'}
                    icon={Package}
                    loading={isLoading}
                />
                <StatCard
                    title="Tổng đơn hàng"
                    value={stats?.total_orders?.toLocaleString() || '0'}
                    icon={ShoppingCart}
                    loading={isLoading}
                />
                <StatCard
                    title="Doanh thu"
                    value={formatVND(stats?.total_revenue || 0)}
                    icon={DollarSign}
                    loading={isLoading}
                />
                <StatCard
                    title="Đơn chờ xử lý"
                    value={stats?.pending_orders?.toString() || '0'}
                    icon={Clock}
                    loading={isLoading}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Orders */}
                <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-rose-100 shadow-lg shadow-rose-100/20">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Đơn hàng gần đây</CardTitle>
                            <CardDescription>Danh sách đơn hàng mới nhất</CardDescription>
                        </div>
                        <Button asChild variant="outline" size="sm">
                            <Link to="/admin/orders">
                                Xem tất cả
                                <ArrowUpRight className="ml-1 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <Skeleton key={i} className="h-16 w-full" />
                                ))}
                            </div>
                        ) : recentOrders.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Mã đơn</TableHead>
                                        <TableHead>Khách hàng</TableHead>
                                        <TableHead>Tổng tiền</TableHead>
                                        <TableHead>Trạng thái</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentOrders.map((order: Order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium">{order.order_number}</TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{order.shipping_address.full_name}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {formatRelativeTime(order.created_at)}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-semibold text-pink-600">
                                                {formatVND(order.total)}
                                            </TableCell>
                                            <TableCell>
                                                <OrderStatusBadge status={order.order_status} />
                                            </TableCell>
                                            <TableCell>
                                                <Button asChild variant="ghost" size="icon">
                                                    <Link to={`/admin/orders/${order.id}`}>
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                Chưa có đơn hàng nào
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Top Products */}
                <Card className="bg-white/80 backdrop-blur-sm border-rose-100 shadow-lg shadow-rose-100/20">
                    <CardHeader>
                        <CardTitle>Sản phẩm nổi bật</CardTitle>
                        <CardDescription>Sản phẩm bán chạy nhất</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <Skeleton key={i} className="h-20 w-full" />
                                ))}
                            </div>
                        ) : topProducts.length > 0 ? (
                            <div className="space-y-4">
                                {topProducts.slice(0, 5).map((product: Product, index: number) => (
                                    <div
                                        key={product.id}
                                        className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                                    >
                                        <div className="relative">
                                            <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-pink-500 text-white text-xs flex items-center justify-center font-bold">
                                                {index + 1}
                                            </span>
                                            <img
                                                src={product.images?.[0]?.url || '/placeholder.jpg'}
                                                alt={product.name_vi}
                                                className="w-14 h-14 rounded-lg object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium truncate">{product.name_vi}</h4>
                                            <p className="text-sm text-pink-600 font-semibold">
                                                {formatVND(product.price)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <TrendingUp className="h-4 w-4 text-green-500" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                Chưa có sản phẩm nổi bật
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card className="bg-white/80 backdrop-blur-sm border-rose-100 shadow-lg shadow-rose-100/20">
                <CardHeader>
                    <CardTitle>Thao tác nhanh</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
                            <Link to="/admin/products">
                                <Package className="h-6 w-6 text-pink-500" />
                                <span>Thêm sản phẩm</span>
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
                            <Link to="/admin/orders?status=pending">
                                <ShoppingCart className="h-6 w-6 text-pink-500" />
                                <span>Đơn chờ xử lý</span>
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
                            <Link to="/admin/blog">
                                <TrendingUp className="h-6 w-6 text-pink-500" />
                                <span>Viết bài mới</span>
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
                            <Link to="/admin/social">
                                <Clock className="h-6 w-6 text-pink-500" />
                                <span>Sync Facebook</span>
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
