// ==========================================
// Blog Management Page
// ==========================================

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, MoreHorizontal, FileText, Eye, Globe, GlobeLock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import type { BlogPost } from '@/types';
import { blogApi } from '@/services/api';
import toast from 'react-hot-toast';

const genSlug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function BlogPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<BlogPost | null>(null);
    const [form, setForm] = useState({ title_vi: '', title_en: '', slug: '', excerpt_vi: '', content_vi: '', is_published: false });

    // Fetch posts
    const { data: postsData, isLoading } = useQuery({
        queryKey: ['admin_blog_posts'],
        queryFn: () => blogApi.list({ page_size: 100 }),
    });

    const posts = postsData?.items || [];
    const filtered = posts.filter((p: BlogPost) => p.title_vi.toLowerCase().includes(search.toLowerCase()));

    // Create mutation
    const createMutation = useMutation({
        mutationFn: (data: typeof form) => blogApi.create({
            title_vi: data.title_vi,
            title_en: data.title_en || undefined,
            slug: data.slug,
            excerpt_vi: data.excerpt_vi || undefined,
            content_vi: data.content_vi || undefined,
            is_published: data.is_published,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin_blog_posts'] });
            toast.success('Đã tạo bài viết mới');
            setModalOpen(false);
        },
        onError: () => toast.error('Lỗi khi tạo bài viết'),
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: typeof form }) => blogApi.update(id, {
            title_vi: data.title_vi,
            title_en: data.title_en || undefined,
            slug: data.slug,
            excerpt_vi: data.excerpt_vi || undefined,
            content_vi: data.content_vi || undefined,
            is_published: data.is_published,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin_blog_posts'] });
            toast.success('Đã cập nhật bài viết');
            setModalOpen(false);
        },
        onError: () => toast.error('Lỗi khi cập nhật bài viết'),
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => blogApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin_blog_posts'] });
            toast.success('Đã xóa bài viết');
        },
        onError: () => toast.error('Lỗi khi xóa bài viết'),
    });

    const openEdit = (p: BlogPost) => {
        setEditing(p);
        setForm({
            title_vi: p.title_vi,
            title_en: p.title_en || '',
            slug: p.slug,
            excerpt_vi: p.excerpt_vi || '',
            content_vi: p.content_vi || '',
            is_published: p.is_published,
        });
        setModalOpen(true);
    };

    const openCreate = () => {
        setEditing(null);
        setForm({ title_vi: '', title_en: '', slug: '', excerpt_vi: '', content_vi: '', is_published: false });
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
        if (confirm('Xóa bài viết này?')) {
            deleteMutation.mutate(id);
        }
    };

    const togglePublish = (p: BlogPost) => {
        updateMutation.mutate({
            id: p.id,
            data: {
                title_vi: p.title_vi,
                title_en: p.title_en || '',
                slug: p.slug,
                excerpt_vi: p.excerpt_vi || '',
                content_vi: p.content_vi || '',
                is_published: !p.is_published,
            },
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Quản lý Blog</h2>
                    <p className="text-muted-foreground">{postsData?.total || 0} bài viết • {posts.filter((p: BlogPost) => p.is_published).length} đã đăng</p>
                </div>
                <Button onClick={openCreate} className="bg-gradient-to-r from-pink-500 to-rose-500 text-white">
                    <Plus className="h-4 w-4 mr-2" />Viết bài mới
                </Button>
            </div>

            <Card>
                <CardContent className="p-4">
                    <Input placeholder="Tìm bài viết..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-md" />
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-6 space-y-4">
                            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12"></TableHead>
                                    <TableHead>Tiêu đề</TableHead>
                                    <TableHead>Lượt xem</TableHead>
                                    <TableHead className="text-center">Trạng thái</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((p: BlogPost) => (
                                    <TableRow key={p.id}>
                                        <TableCell>
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center">
                                                <FileText className="h-5 w-5 text-pink-500" />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{p.title_vi}</div>
                                            <div className="text-sm text-muted-foreground line-clamp-1">{p.excerpt_vi}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Eye className="h-4 w-4 text-muted-foreground" />
                                                {p.view_count?.toLocaleString() || 0}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {p.is_published ? (
                                                <Badge className="bg-green-500/10 text-green-600">
                                                    <Globe className="h-3 w-3 mr-1" />Đã đăng
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">
                                                    <GlobeLock className="h-3 w-3 mr-1" />Nháp
                                                </Badge>
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
                                                    <DropdownMenuItem onClick={() => togglePublish(p)}>
                                                        {p.is_published ? 'Ẩn bài' : 'Đăng bài'}
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
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Sửa bài viết' : 'Viết bài mới'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Tiêu đề (Tiếng Việt) *</Label>
                            <Input
                                value={form.title_vi}
                                onChange={e => setForm({ ...form, title_vi: e.target.value, slug: form.slug || genSlug(e.target.value) })}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Tiêu đề (English)</Label>
                                <Input value={form.title_en} onChange={e => setForm({ ...form, title_en: e.target.value })} />
                            </div>
                            <div>
                                <Label>Slug *</Label>
                                <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} />
                            </div>
                        </div>
                        <div>
                            <Label>Mô tả ngắn</Label>
                            <Textarea value={form.excerpt_vi} onChange={e => setForm({ ...form, excerpt_vi: e.target.value })} rows={2} />
                        </div>
                        <div>
                            <Label>Nội dung</Label>
                            <Textarea value={form.content_vi} onChange={e => setForm({ ...form, content_vi: e.target.value })} rows={6} placeholder="Nội dung bài viết..." />
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch checked={form.is_published} onCheckedChange={c => setForm({ ...form, is_published: c })} />
                            <Label>Đăng ngay</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>Hủy</Button>
                        <Button
                            onClick={handleSave}
                            className="bg-pink-500 text-white"
                            disabled={createMutation.isPending || updateMutation.isPending}
                        >
                            {editing ? 'Lưu' : 'Tạo'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
