// ==========================================
// Products Management Page
// With image upload capability
// ==========================================

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, MoreHorizontal, Edit, Trash2, Star, Globe, GlobeLock, Upload, X, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product, Category } from '@/types';
import { productsApi, categoriesApi, uploadApi } from '@/services/api';
import toast from 'react-hot-toast';

const formatVND = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
const API_BASE = 'http://localhost:8000';

// Generate slug with Vietnamese accent removal
const generateSlug = (name: string): string => {
    return name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')  // Remove diacritics
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
};

export default function ProductsPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Product | null>(null);
    const [form, setForm] = useState({
        name_vi: '',
        slug: '',
        price: 0,
        category_id: '',
        is_published: true,
        is_featured: false,
        images: [] as { url: string; alt?: string; sort_order: number }[]
    });
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch products
    const { data: productsData, isLoading: loadingProducts } = useQuery({
        queryKey: ['admin_products', catFilter, search],
        queryFn: () => productsApi.list({
            page_size: 100,
            category_id: catFilter !== 'all' ? catFilter : undefined,
            search: search || undefined,
        }),
    });

    // Fetch categories
    const { data: categories = [] } = useQuery({
        queryKey: ['admin_categories'],
        queryFn: () => categoriesApi.list(true),
    });

    const products = productsData?.items || [];

    // Create mutation
    const createMutation = useMutation({
        mutationFn: (data: typeof form) => productsApi.create({
            name_vi: data.name_vi,
            slug: data.slug,
            price: data.price,
            category_id: data.category_id || undefined,
            is_published: data.is_published,
            is_featured: data.is_featured,
            images: data.images,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin_products'] });
            toast.success('Đã tạo sản phẩm mới');
            setModalOpen(false);
        },
        onError: () => toast.error('Lỗi khi tạo sản phẩm'),
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: typeof form }) => productsApi.update(id, {
            name_vi: data.name_vi,
            slug: data.slug,
            price: data.price,
            category_id: data.category_id || undefined,
            is_published: data.is_published,
            is_featured: data.is_featured,
            images: data.images,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin_products'] });
            toast.success('Đã cập nhật sản phẩm');
            setModalOpen(false);
        },
        onError: () => toast.error('Lỗi khi cập nhật sản phẩm'),
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => productsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin_products'] });
            toast.success('Đã xóa sản phẩm');
        },
        onError: () => toast.error('Lỗi khi xóa sản phẩm'),
    });

    const openEdit = (p: Product) => {
        setEditing(p);
        setForm({
            name_vi: p.name_vi,
            slug: p.slug,
            price: p.price,
            category_id: p.category_id || '',
            is_published: p.is_published,
            is_featured: p.is_featured,
            images: p.images || [],
        });
        setModalOpen(true);
    };

    const openCreate = () => {
        setEditing(null);
        setForm({ name_vi: '', slug: '', price: 0, category_id: '', is_published: true, is_featured: false, images: [] });
        setModalOpen(true);
    };

    const handleSave = () => {
        if (editing) {
            updateMutation.mutate({ id: editing.id, data: form });
        } else {
            createMutation.mutate(form);
        }
    };

    const handleDelete = (id: string) => {
        if (confirm('Xóa sản phẩm này?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        try {
            const newImages = [...form.images];

            for (const file of Array.from(files)) {
                const result = await uploadApi.uploadImage(file);
                newImages.push({ url: result.url, alt: form.name_vi || file.name, sort_order: newImages.length });
            }

            setForm({ ...form, images: newImages });
            toast.success(`Đã tải lên ${files.length} ảnh`);
        } catch (error: any) {
            toast.error(error.message || 'Lỗi khi tải ảnh');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeImage = (index: number) => {
        const newImages = form.images.filter((_, i) => i !== index);
        setForm({ ...form, images: newImages });
    };

    const getImageUrl = (url: string) => {
        if (url.startsWith('http')) return url;
        return `${API_BASE}${url}`;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Quản lý sản phẩm</h2>
                    <p className="text-muted-foreground">{productsData?.total || 0} sản phẩm</p>
                </div>
                <Button onClick={openCreate} className="bg-gradient-to-r from-pink-500 to-rose-500 text-white">
                    <Plus className="h-4 w-4 mr-2" />Thêm sản phẩm
                </Button>
            </div>

            <Card>
                <CardContent className="p-4 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Tìm kiếm..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                    </div>
                    <Select value={catFilter} onValueChange={setCatFilter}>
                        <SelectTrigger className="w-48"><SelectValue placeholder="Danh mục" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả</SelectItem>
                            {categories.map((c: Category) => <SelectItem key={c.id} value={c.id}>{c.name_vi}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    {loadingProducts ? (
                        <div className="p-6 space-y-4">
                            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16"></TableHead>
                                    <TableHead>Sản phẩm</TableHead>
                                    <TableHead>Giá</TableHead>
                                    <TableHead className="text-center">Tồn kho</TableHead>
                                    <TableHead className="text-center">Trạng thái</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.map((p: Product) => (
                                    <TableRow key={p.id}>
                                        <TableCell>
                                            <img src={p.images?.[0]?.url ? getImageUrl(p.images[0].url) : '/placeholder.jpg'} className="w-12 h-12 rounded-lg object-cover" />
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium flex items-center gap-2">
                                                {p.name_vi}
                                                {p.is_featured && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {p.sale_price ? (
                                                <>
                                                    <div className="font-semibold text-pink-600">{formatVND(p.sale_price)}</div>
                                                    <div className="text-sm line-through text-muted-foreground">{formatVND(p.price)}</div>
                                                </>
                                            ) : (
                                                <div className="font-semibold">{formatVND(p.price)}</div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge className={p.stock_quantity > 0 ? 'bg-green-500' : 'bg-red-500'}>
                                                {p.stock_quantity}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {p.is_published ? (
                                                <Badge className="bg-green-500"><Globe className="h-3 w-3 mr-1" />Công khai</Badge>
                                            ) : (
                                                <Badge variant="secondary"><GlobeLock className="h-3 w-3 mr-1" />Ẩn</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openEdit(p)}>
                                                        <Edit className="h-4 w-4 mr-2" />Sửa
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleDelete(p.id)} className="text-destructive">
                                                        <Trash2 className="h-4 w-4 mr-2" />Xóa
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {products.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                            Không có sản phẩm
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* Image Upload Section */}
                        <div>
                            <Label className="mb-2 block">Hình ảnh sản phẩm</Label>
                            <div className="flex flex-wrap gap-3">
                                {form.images.map((img, idx) => (
                                    <div key={idx} className="relative group">
                                        <img src={getImageUrl(img.url)} alt="" className="w-20 h-20 object-cover rounded-lg border" />
                                        <button
                                            onClick={() => removeImage(idx)}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="w-20 h-20 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:border-pink-500 hover:text-pink-500 transition-colors disabled:opacity-50"
                                >
                                    {uploading ? (
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    ) : (
                                        <>
                                            <Upload className="h-5 w-5" />
                                            <span className="text-xs mt-1">Tải ảnh</span>
                                        </>
                                    )}
                                </button>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Tên sản phẩm</Label>
                                <Input value={form.name_vi} onChange={e => setForm({ ...form, name_vi: e.target.value, slug: form.slug || generateSlug(e.target.value) })} />
                            </div>
                            <div>
                                <Label>Slug</Label>
                                <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Giá (VND)</Label>
                                <Input
                                    type="text"
                                    value={Number(form.price).toLocaleString('vi-VN')}
                                    onChange={e => {
                                        const raw = e.target.value.replace(/\D/g, '');
                                        setForm({ ...form, price: Number(raw) || 0 });
                                    }}
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <Label>Danh mục</Label>
                                <Select value={form.category_id} onValueChange={v => setForm({ ...form, category_id: v })}>
                                    <SelectTrigger><SelectValue placeholder="Chọn danh mục" /></SelectTrigger>
                                    <SelectContent>
                                        {categories.map((c: Category) => <SelectItem key={c.id} value={c.id}>{c.name_vi}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex gap-6">
                            <div className="flex items-center gap-2">
                                <Switch checked={form.is_published} onCheckedChange={c => setForm({ ...form, is_published: c })} />
                                <Label>Công khai</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch checked={form.is_featured} onCheckedChange={c => setForm({ ...form, is_featured: c })} />
                                <Label>Nổi bật</Label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>Hủy</Button>
                        <Button
                            onClick={handleSave}
                            className="bg-pink-500 text-white"
                            disabled={createMutation.isPending || updateMutation.isPending || uploading}
                        >
                            {editing ? 'Lưu' : 'Tạo'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
