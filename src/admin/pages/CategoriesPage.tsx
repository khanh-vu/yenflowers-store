// ==========================================
// Categories Management Page
// With nested 3-level hierarchy support
// ==========================================

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, MoreHorizontal, FolderTree, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Category } from '@/types';
import { categoriesApi } from '@/services/api';
import toast from 'react-hot-toast';

const generateSlug = (name: string) => name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// Calculate depth of a category
const getCategoryDepth = (cat: Category, allCats: Category[]): number => {
    if (!cat.parent_id) return 0;
    const parent = allCats.find(c => c.id === cat.parent_id);
    if (!parent) return 0;
    return 1 + getCategoryDepth(parent, allCats);
};

// Build tree structure for display
const buildCategoryTree = (categories: Category[]): (Category & { depth: number })[] => {
    const result: (Category & { depth: number })[] = [];

    // Get root categories first
    const roots = categories.filter(c => !c.parent_id).sort((a, b) => a.sort_order - b.sort_order);

    const addWithChildren = (cat: Category, depth: number) => {
        result.push({ ...cat, depth });
        const children = categories
            .filter(c => c.parent_id === cat.id)
            .sort((a, b) => a.sort_order - b.sort_order);
        children.forEach(child => addWithChildren(child, depth + 1));
    };

    roots.forEach(root => addWithChildren(root, 0));
    return result;
};

export default function CategoriesPage() {
    const queryClient = useQueryClient();
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Category | null>(null);
    const [form, setForm] = useState({
        name_vi: '',
        name_en: '',
        slug: '',
        description_vi: '',
        sort_order: 0,
        is_active: true,
        parent_id: '' // For nesting
    });

    // Fetch categories
    const { data: categories = [], isLoading } = useQuery({
        queryKey: ['admin_categories_all'],
        queryFn: () => categoriesApi.list(true),
    });

    // Build tree structure
    const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);

    // Create mutation
    const createMutation = useMutation({
        mutationFn: (data: typeof form) => categoriesApi.create({
            name_vi: data.name_vi,
            name_en: data.name_en || undefined,
            slug: data.slug,
            description_vi: data.description_vi || undefined,
            sort_order: data.sort_order,
            is_active: data.is_active,
            parent_id: data.parent_id || undefined,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin_categories_all'] });
            toast.success('Đã tạo danh mục mới');
            setModalOpen(false);
        },
        onError: () => toast.error('Lỗi khi tạo danh mục'),
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: typeof form }) => categoriesApi.update(id, {
            name_vi: data.name_vi,
            name_en: data.name_en || undefined,
            slug: data.slug,
            description_vi: data.description_vi || undefined,
            sort_order: data.sort_order,
            is_active: data.is_active,
            parent_id: data.parent_id || undefined,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin_categories_all'] });
            toast.success('Đã cập nhật danh mục');
            setModalOpen(false);
        },
        onError: () => toast.error('Lỗi khi cập nhật danh mục'),
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => categoriesApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin_categories_all'] });
            toast.success('Đã xóa danh mục');
        },
        onError: () => toast.error('Lỗi khi xóa danh mục'),
    });

    const openEdit = (c: Category) => {
        setEditing(c);
        setForm({
            name_vi: c.name_vi,
            name_en: c.name_en || '',
            slug: c.slug,
            description_vi: c.description_vi || '',
            sort_order: c.sort_order,
            is_active: c.is_active,
            parent_id: c.parent_id || '',
        });
        setModalOpen(true);
    };

    const openCreate = () => {
        setEditing(null);
        setForm({
            name_vi: '',
            name_en: '',
            slug: '',
            description_vi: '',
            sort_order: categories.length + 1,
            is_active: true,
            parent_id: ''
        });
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
        // Check if has children
        const hasChildren = categories.some(c => c.parent_id === id);
        if (hasChildren) {
            toast.error('Không thể xóa danh mục có danh mục con');
            return;
        }
        if (confirm('Xóa danh mục này?')) {
            deleteMutation.mutate(id);
        }
    };

    const toggleActive = (c: Category) => {
        updateMutation.mutate({
            id: c.id,
            data: {
                ...c,
                is_active: !c.is_active,
                name_en: c.name_en || '',
                description_vi: c.description_vi || '',
                parent_id: c.parent_id || ''
            },
        });
    };

    // Get available parents (exclude self and descendants, limit to max 2 levels)
    const getAvailableParents = () => {
        if (!editing) {
            // When creating, can select any category with depth < 2
            return categories.filter(c => getCategoryDepth(c, categories) < 2);
        }

        // When editing, exclude self and all descendants
        const descendants = new Set<string>();
        const addDescendants = (id: string) => {
            descendants.add(id);
            categories.filter(c => c.parent_id === id).forEach(c => addDescendants(c.id));
        };
        addDescendants(editing.id);

        return categories.filter(c => !descendants.has(c.id) && getCategoryDepth(c, categories) < 2);
    };

    const depthColors = ['bg-pink-500', 'bg-purple-500', 'bg-blue-500'];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Quản lý danh mục</h2>
                    <p className="text-muted-foreground">{categories.length} danh mục (3 cấp)</p>
                </div>
                <Button onClick={openCreate} className="bg-gradient-to-r from-pink-500 to-rose-500 text-white">
                    <Plus className="h-4 w-4 mr-2" />Thêm danh mục
                </Button>
            </div>

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
                                    <TableHead className="w-12"></TableHead>
                                    <TableHead>Tên danh mục</TableHead>
                                    <TableHead>Slug</TableHead>
                                    <TableHead>Cấp</TableHead>
                                    <TableHead className="text-center">Trạng thái</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categoryTree.map((c) => (
                                    <TableRow key={c.id} className={c.depth > 0 ? 'bg-muted/30' : ''}>
                                        <TableCell>
                                            <div
                                                className={`w-10 h-10 rounded-lg flex items-center justify-center ${depthColors[c.depth]}/20`}
                                                style={{ marginLeft: `${c.depth * 16}px` }}
                                            >
                                                <FolderTree className={`h-5 w-5 ${depthColors[c.depth].replace('bg-', 'text-')}`} />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2" style={{ paddingLeft: `${c.depth * 20}px` }}>
                                                {c.depth > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                                <div>
                                                    <div className="font-medium">{c.name_vi}</div>
                                                    {c.name_en && <div className="text-sm text-muted-foreground">{c.name_en}</div>}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <code className="text-sm bg-muted px-2 py-1 rounded">{c.slug}</code>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`${depthColors[c.depth]}/10 ${depthColors[c.depth].replace('bg-', 'text-')}`}>
                                                Cấp {c.depth + 1}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge className={c.is_active ? 'bg-green-500/10 text-green-600' : 'bg-gray-500/10 text-gray-600'}>
                                                {c.is_active ? 'Hoạt động' : 'Tắt'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openEdit(c)}>
                                                        <Edit className="h-4 w-4 mr-2" />Sửa
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => toggleActive(c)}>
                                                        {c.is_active ? 'Tắt' : 'Bật'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleDelete(c.id)} className="text-destructive">
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Sửa danh mục' : 'Thêm danh mục'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* Parent Category Selection */}
                        <div>
                            <Label>Danh mục cha (tùy chọn)</Label>
                            <Select value={form.parent_id} onValueChange={v => setForm({ ...form, parent_id: v === 'none' ? '' : v })}>
                                <SelectTrigger><SelectValue placeholder="Không có (danh mục gốc)" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Không có (danh mục gốc)</SelectItem>
                                    {getAvailableParents().map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {'—'.repeat(getCategoryDepth(c, categories))} {c.name_vi}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1">Tối đa 3 cấp (cha → con → cháu)</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Tên (Tiếng Việt) *</Label>
                                <Input
                                    value={form.name_vi}
                                    onChange={e => setForm({ ...form, name_vi: e.target.value, slug: form.slug || generateSlug(e.target.value) })}
                                    required
                                />
                            </div>
                            <div>
                                <Label>Tên (English)</Label>
                                <Input value={form.name_en} onChange={e => setForm({ ...form, name_en: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Slug *</Label>
                                <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} required />
                            </div>
                            <div>
                                <Label>Thứ tự</Label>
                                <Input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })} min={0} />
                            </div>
                        </div>
                        <div>
                            <Label>Mô tả</Label>
                            <Input value={form.description_vi} onChange={e => setForm({ ...form, description_vi: e.target.value })} />
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch checked={form.is_active} onCheckedChange={c => setForm({ ...form, is_active: c })} />
                            <Label>Hoạt động</Label>
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
