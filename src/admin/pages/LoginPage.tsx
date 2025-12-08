// ==========================================
// Admin Login Page
// ==========================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Lock, Mail, Flower2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error('Vui lòng nhập email và mật khẩu');
            return;
        }

        setLoading(true);
        try {
            await login(email, password);
            toast.success('Đăng nhập thành công!');
            navigate('/admin');
        } catch (error: any) {
            toast.error(error.message || 'Đăng nhập thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-rose-50 p-4">
            <Card className="w-full max-w-md shadow-xl border-0">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center mb-4">
                        <Flower2 className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl">YenFlowers Admin</CardTitle>
                    <CardDescription>Đăng nhập để quản lý cửa hàng</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@yenflowers.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="pl-10"
                                    autoComplete="email"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Mật khẩu</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="pl-10"
                                    autoComplete="current-password"
                                />
                            </div>
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white h-11"
                            disabled={loading}
                        >
                            {loading ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang đăng nhập...</>
                            ) : (
                                'Đăng nhập'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
