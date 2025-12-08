// ==========================================
// Settings Page
// ==========================================

import { useState, useEffect } from 'react';
import { Save, Store, Truck, CreditCard, Facebook, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { settingsApi } from '@/services/api';

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Default states
    const [store, setStore] = useState({ name: '', phone: '', email: '', address: '' });
    const [delivery, setDelivery] = useState({ defaultFee: 0, freeThreshold: 0, sameDay: false, sameDayFee: 0 });
    const [payment, setPayment] = useState({ cod: true, stripe: false, paypal: false, bankTransfer: false });
    const [social, setSocial] = useState({ fbPageId: '', fbAccessToken: '', autoSync: false, syncInterval: 24 });
    const [notif, setNotif] = useState({ emailOrders: true, emailLowStock: true, lowStockThreshold: 5 });

    // Load settings
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const data = await settingsApi.getAll();
            if (data.store) setStore(prev => ({ ...prev, ...data.store }));
            if (data.delivery) setDelivery(prev => ({ ...prev, ...data.delivery }));
            if (data.payment) setPayment(prev => ({ ...prev, ...data.payment }));
            if (data.fb_sync) setSocial(prev => ({ ...prev, ...data.fb_sync }));
            if (data.notification) setNotif(prev => ({ ...prev, ...data.notification }));
        } catch (error) {
            console.error(error);
            // toast.error('Không thể tải cài đặt');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            // Save all sections in parallel
            await Promise.all([
                settingsApi.update('store', store),
                settingsApi.update('delivery', delivery),
                settingsApi.update('payment', payment),
                settingsApi.update('fb_sync', social),
                settingsApi.update('notification', notif)
            ]);
            alert('Đã lưu cài đặt!');
        } catch (error) {
            console.error(error);
            alert('Lưu thất bại');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div><h2 className="text-2xl font-bold">Cài đặt</h2><p className="text-muted-foreground">Quản lý cấu hình hệ thống</p></div>
                <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-pink-500 to-rose-500 text-white"><Save className="h-4 w-4 mr-2" />{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</Button>
            </div>

            <Tabs defaultValue="store" className="space-y-6">
                <TabsList className="grid grid-cols-5 w-full max-w-2xl"><TabsTrigger value="store"><Store className="h-4 w-4 mr-2" />Cửa hàng</TabsTrigger><TabsTrigger value="delivery"><Truck className="h-4 w-4 mr-2" />Giao hàng</TabsTrigger><TabsTrigger value="payment"><CreditCard className="h-4 w-4 mr-2" />Thanh toán</TabsTrigger><TabsTrigger value="social"><Facebook className="h-4 w-4 mr-2" />Social</TabsTrigger><TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-2" />Thông báo</TabsTrigger></TabsList>

                <TabsContent value="store"><Card><CardHeader><CardTitle>Thông tin cửa hàng</CardTitle><CardDescription>Thông tin hiển thị trên website và hóa đơn</CardDescription></CardHeader><CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4"><div><Label>Tên cửa hàng</Label><Input value={store.name} onChange={e => setStore({ ...store, name: e.target.value })} /></div><div><Label>Số điện thoại</Label><Input value={store.phone} onChange={e => setStore({ ...store, phone: e.target.value })} /></div></div>
                    <div><Label>Email</Label><Input type="email" value={store.email} onChange={e => setStore({ ...store, email: e.target.value })} /></div>
                    <div><Label>Địa chỉ</Label><Textarea value={store.address} onChange={e => setStore({ ...store, address: e.target.value })} rows={2} /></div>
                </CardContent></Card></TabsContent>

                <TabsContent value="delivery"><Card><CardHeader><CardTitle>Phí giao hàng</CardTitle><CardDescription>Cấu hình phí ship và điều kiện miễn phí</CardDescription></CardHeader><CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4"><div><Label>Phí giao hàng mặc định (VND)</Label><Input type="number" value={delivery.defaultFee} onChange={e => setDelivery({ ...delivery, defaultFee: Number(e.target.value) })} /></div><div><Label>Miễn phí ship từ (VND)</Label><Input type="number" value={delivery.freeThreshold} onChange={e => setDelivery({ ...delivery, freeThreshold: Number(e.target.value) })} /></div></div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted"><div><Label>Giao hàng trong ngày</Label><p className="text-sm text-muted-foreground">Cho phép khách chọn giao nhanh</p></div><Switch checked={delivery.sameDay} onCheckedChange={c => setDelivery({ ...delivery, sameDay: c })} /></div>
                    {delivery.sameDay && <div><Label>Phụ phí giao nhanh (VND)</Label><Input type="number" value={delivery.sameDayFee} onChange={e => setDelivery({ ...delivery, sameDayFee: Number(e.target.value) })} /></div>}
                </CardContent></Card></TabsContent>

                <TabsContent value="payment"><Card><CardHeader><CardTitle>Phương thức thanh toán</CardTitle><CardDescription>Bật/tắt các phương thức thanh toán</CardDescription></CardHeader><CardContent className="space-y-4">
                    {[{ key: 'cod', label: 'Thanh toán khi nhận hàng (COD)', desc: 'Khách thanh toán tiền mặt khi nhận hàng' }, { key: 'stripe', label: 'Stripe (Thẻ quốc tế)', desc: 'Visa, Mastercard, AMEX' }, { key: 'paypal', label: 'PayPal', desc: 'Thanh toán qua PayPal' }, { key: 'bankTransfer', label: 'Chuyển khoản ngân hàng', desc: 'Chuyển khoản trực tiếp' }].map(p => (
                        <div key={p.key} className="flex items-center justify-between p-4 rounded-lg bg-muted"><div><Label>{p.label}</Label><p className="text-sm text-muted-foreground">{p.desc}</p></div><Switch checked={payment[p.key as keyof typeof payment]} onCheckedChange={c => setPayment({ ...payment, [p.key]: c })} /></div>
                    ))}
                </CardContent></Card></TabsContent>

                <TabsContent value="social"><Card><CardHeader><CardTitle>Kết nối Facebook</CardTitle><CardDescription>Cấu hình sync từ Facebook Page</CardDescription></CardHeader><CardContent className="space-y-4">
                    <div><Label>Facebook Page ID</Label><Input value={social.fbPageId} onChange={e => setSocial({ ...social, fbPageId: e.target.value })} placeholder="Nhập Page ID" /></div>
                    <div><Label>Access Token</Label><Input type="password" value={social.fbAccessToken} onChange={e => setSocial({ ...social, fbAccessToken: e.target.value })} placeholder="Nhập Access Token" /></div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted"><div><Label>Tự động sync</Label><p className="text-sm text-muted-foreground">Tự động đồng bộ bài đăng mới</p></div><Switch checked={social.autoSync} onCheckedChange={c => setSocial({ ...social, autoSync: c })} /></div>
                    {social.autoSync && <div><Label>Tần suất sync (giờ)</Label><Input type="number" value={social.syncInterval} onChange={e => setSocial({ ...social, syncInterval: Number(e.target.value) })} min={1} max={168} /></div>}
                </CardContent></Card></TabsContent>

                <TabsContent value="notifications"><Card><CardHeader><CardTitle>Thông báo</CardTitle><CardDescription>Cấu hình email thông báo</CardDescription></CardHeader><CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted"><div><Label>Thông báo đơn hàng mới</Label><p className="text-sm text-muted-foreground">Nhận email khi có đơn hàng mới</p></div><Switch checked={notif.emailOrders} onCheckedChange={c => setNotif({ ...notif, emailOrders: c })} /></div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted"><div><Label>Cảnh báo hết hàng</Label><p className="text-sm text-muted-foreground">Nhận email khi sản phẩm sắp hết</p></div><Switch checked={notif.emailLowStock} onCheckedChange={c => setNotif({ ...notif, emailLowStock: c })} /></div>
                    {notif.emailLowStock && <div><Label>Ngưỡng cảnh báo (số lượng)</Label><Input type="number" value={notif.lowStockThreshold} onChange={e => setNotif({ ...notif, lowStockThreshold: Number(e.target.value) })} min={1} /></div>}
                </CardContent></Card></TabsContent>
            </Tabs>
        </div>
    );
}
