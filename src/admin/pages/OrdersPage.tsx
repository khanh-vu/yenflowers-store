// ==========================================
// Orders Management Page
// ==========================================

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Eye, Truck, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Order, OrderStatus } from '@/types';
import { ordersApi } from '@/services/api';
import toast from 'react-hot-toast';

const formatVND = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const statusConfig: Record<OrderStatus, { label: string; className: string; icon: React.ElementType }> = {
    pending: { label: 'Chờ xử lý', className: 'bg-yellow-500/10 text-yellow-600', icon: Clock },
    confirmed: { label: 'Đã xác nhận', className: 'bg-blue-500/10 text-blue-600', icon: CheckCircle },
    processing: { label: 'Đang xử lý', className: 'bg-purple-500/10 text-purple-600', icon: Clock },
    shipped: { label: 'Đang giao', className: 'bg-indigo-500/10 text-indigo-600', icon: Truck },
    delivered: { label: 'Đã giao', className: 'bg-green-500/10 text-green-600', icon: CheckCircle },
    cancelled: { label: 'Đã hủy', className: 'bg-red-500/10 text-red-600', icon: XCircle },
};

export default function OrdersPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selected, setSelected] = useState<Order | null>(null);

    // Fetch orders
    const { data: ordersData, isLoading } = useQuery({
        queryKey: ['admin_orders', statusFilter],
        queryFn: () => ordersApi.list({
            page_size: 100,
            order_status: statusFilter !== 'all' ? statusFilter : undefined,
        }),
    });

    const orders = ordersData?.items || [];

    // Update status mutation
    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
            ordersApi.updateStatus(id, { order_status: status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin_orders'] });
            toast.success('Đã cập nhật trạng thái đơn hàng');
        },
        onError: () => toast.error('Lỗi khi cập nhật trạng thái'),
    });

    const filtered = orders.filter((o: Order) => {
        const matchSearch = o.order_number.toLowerCase().includes(search.toLowerCase()) ||
            o.shipping_address.full_name.toLowerCase().includes(search.toLowerCase());
        return matchSearch;
    });

    const updateStatus = (id: string, status: OrderStatus) => {
        updateStatusMutation.mutate({ id, status });
        if (selected?.id === id) {
            setSelected({ ...selected, order_status: status });
        }
    };

    const counts = {
        all: ordersData?.total || 0,
        pending: orders.filter((o: Order) => o.order_status === 'pending').length,
        confirmed: orders.filter((o: Order) => o.order_status === 'confirmed').length,
        shipped: orders.filter((o: Order) => o.order_status === 'shipped').length,
        delivered: orders.filter((o: Order) => o.order_status === 'delivered').length,
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Quản lý đơn hàng</h2>
                <p className="text-muted-foreground">{ordersData?.total || 0} đơn hàng • {counts.pending} chờ xử lý</p>
            </div>

            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList>
                    <TabsTrigger value="all">Tất cả ({counts.all})</TabsTrigger>
                    <TabsTrigger value="pending">Chờ xử lý ({counts.pending})</TabsTrigger>
                    <TabsTrigger value="confirmed">Đã xác nhận ({counts.confirmed})</TabsTrigger>
                    <TabsTrigger value="shipped">Đang giao ({counts.shipped})</TabsTrigger>
                    <TabsTrigger value="delivered">Đã giao ({counts.delivered})</TabsTrigger>
                </TabsList>
            </Tabs>

            <Card>
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm mã đơn hoặc tên..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9 max-w-md"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-6 space-y-4">
                            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Mã đơn</TableHead>
                                    <TableHead>Khách hàng</TableHead>
                                    <TableHead>Tổng tiền</TableHead>
                                    <TableHead>Thanh toán</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((o: Order) => {
                                    const cfg = statusConfig[o.order_status];
                                    return (
                                        <TableRow key={o.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelected(o)}>
                                            <TableCell className="font-mono font-medium">{o.order_number}</TableCell>
                                            <TableCell>
                                                <div className="font-medium">{o.shipping_address.full_name}</div>
                                                <div className="text-sm text-muted-foreground">{o.guest_phone}</div>
                                            </TableCell>
                                            <TableCell className="font-semibold text-pink-600">{formatVND(o.total)}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={o.payment_status === 'paid' ? 'default' : 'secondary'}
                                                    className={o.payment_status === 'paid' ? 'bg-green-500' : ''}
                                                >
                                                    {o.payment_status === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={cfg.className}>
                                                    <cfg.icon className="h-3 w-3 mr-1" />{cfg.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); setSelected(o); }}>
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {filtered.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                            Không có đơn hàng
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
                <DialogContent className="max-w-lg">
                    {selected && (
                        <>
                            <DialogHeader>
                                <DialogTitle>Đơn hàng {selected.order_number}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Khách hàng:</span>
                                        <div className="font-medium">{selected.shipping_address.full_name}</div>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Điện thoại:</span>
                                        <div className="font-medium">{selected.guest_phone}</div>
                                    </div>
                                </div>
                                <div className="text-sm">
                                    <span className="text-muted-foreground">Địa chỉ:</span>
                                    <div className="font-medium">
                                        {selected.shipping_address.address_line}, {selected.shipping_address.ward}, Q.{selected.shipping_address.district}, {selected.shipping_address.city}
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Tạm tính:</span>
                                        <div>{formatVND(selected.subtotal)}</div>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Phí ship:</span>
                                        <div>{formatVND(selected.shipping_fee)}</div>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Tổng:</span>
                                        <div className="font-bold text-pink-600">{formatVND(selected.total)}</div>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground">Cập nhật trạng thái:</span>
                                    <Select
                                        value={selected.order_status}
                                        onValueChange={v => updateStatus(selected.id, v as OrderStatus)}
                                    >
                                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(statusConfig).map(([k, v]) => (
                                                <SelectItem key={k} value={k}>{v.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={() => setSelected(null)}>Đóng</Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
