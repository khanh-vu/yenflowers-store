// ==========================================
// Social Feed (Facebook Sync) Page
// Real batch sync with progress bar
// ==========================================

import { useState, useEffect } from 'react';
import { RefreshCw, Facebook, Instagram, Import, Check, ExternalLink, ImageIcon, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { socialFeedApi } from '@/services/api';
import type { SocialFeedItem } from '@/types';

const formatDate = (d: string) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const PAGE_SIZE = 24;

// Sub-component for individual feed items to handle carousel state independent of main list
function SocialFeedItemCard({ item, onImport }: { item: SocialFeedItem; onImport: (item: SocialFeedItem) => void }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const images = (item.image_urls && item.image_urls.length > 0) ? item.image_urls : (item.image_url ? [item.image_url] : []);
    const hasMultipleImages = images.length > 1;

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex(prev => (prev + 1) % images.length);
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length);
    };

    return (
        <Card className="overflow-hidden group">
            <div className="relative aspect-square bg-muted">
                {images.length > 0 ? (
                    <img
                        src={images[currentImageIndex]}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                )}

                <div className="absolute top-2 left-2 flex gap-1 z-10">
                    <Badge className={item.platform === 'facebook' ? 'bg-blue-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'}>
                        {item.platform === 'facebook' ? <Facebook className="h-3 w-3 mr-1" /> : <Instagram className="h-3 w-3 mr-1" />}
                        {item.platform}
                    </Badge>
                </div>

                {hasMultipleImages && (
                    <>
                        <div className="absolute top-2 right-2 z-10">
                            <Badge variant="secondary" className="bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm">
                                <ImageIcon className="h-3 w-3 mr-1" />
                                {currentImageIndex + 1}/{images.length}
                            </Badge>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                            onClick={prevImage}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                            onClick={nextImage}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>

                        {/* Dots indicator at bottom */}
                        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10">
                            {images.slice(0, 5).map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`w-1.5 h-1.5 rounded-full shadow-sm transition-colors ${idx === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}
                                />
                            ))}
                            {images.length > 5 && <div className="w-1.5 h-1.5 rounded-full bg-white/50" />}
                        </div>
                    </>
                )}

                {item.is_imported_as_product && !hasMultipleImages && (
                    <div className="absolute top-2 right-2 z-10">
                        <Badge className="bg-green-500"><Check className="h-3 w-3 mr-1" />Đã import</Badge>
                    </div>
                )}

                {/* Status bagde for imported items even with slider */}
                {item.is_imported_as_product && hasMultipleImages && (
                    <div className="absolute bottom-2 right-2 z-10">
                        <Badge className="bg-green-500 shadow-lg"><Check className="h-3 w-3 mr-1" />Đã import</Badge>
                    </div>
                )}
            </div>

            <CardContent className="p-4">
                <p className="text-sm line-clamp-2 mb-3 h-10">{item.caption}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span>{item.posted_at ? formatDate(item.posted_at) : formatDate(item.synced_at)}</span>
                    <a href={item.permalink} target="_blank" rel="noopener noreferrer" className="hover:text-foreground flex items-center gap-1">
                        Xem gốc <ExternalLink className="h-3 w-3" />
                    </a>
                </div>
                {!item.is_imported_as_product && (
                    <Button onClick={() => onImport(item)} size="sm" className="w-full bg-pink-500 hover:bg-pink-600 text-white">
                        <Import className="h-4 w-4 mr-2" />Import làm sản phẩm
                    </Button>
                )}
                {item.is_imported_as_product && (
                    <Button variant="outline" size="sm" disabled className="w-full border-green-200 text-green-700 bg-green-50">
                        <Check className="h-4 w-4 mr-2" />Đã import
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

export default function SocialFeedPage() {
    const [feed, setFeed] = useState<SocialFeedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0);
    const [syncMessage, setSyncMessage] = useState('');
    const [fbTotal, setFbTotal] = useState(0);
    const [syncedCount, setSyncedCount] = useState(0);
    const [importModal, setImportModal] = useState<SocialFeedItem | null>(null);
    const [importForm, setImportForm] = useState({ name_vi: '', price: 0 });

    // Pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const loadFeed = async (pageNum = 1) => {
        try {
            setLoading(true);
            const response = await socialFeedApi.list({ page: pageNum, page_size: PAGE_SIZE });
            setFeed(response.items);
            setTotalPages(response.total_pages);
            setTotalItems(response.total);
            setPage(pageNum);
        } catch (error) {
            toast.error('Không thể tải bài đăng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFeed(1);
    }, []);

    // Real batch sync with progress
    const handleSyncBatches = async () => {
        try {
            setSyncing(true);
            setSyncProgress(0);
            setSyncedCount(0);
            setSyncMessage('Đang đếm tổng bài đăng từ Facebook...');

            // Step 1: Get total count from Facebook
            const status = await socialFeedApi.getSyncStatus(true); // refresh_count=true
            const total = status.fb_total_posts;
            setFbTotal(total);

            if (total === 0) {
                toast.error('Không tìm thấy bài đăng nào trên Facebook');
                setSyncing(false);
                return;
            }

            setSyncMessage(`Tìm thấy ${total} bài đăng. Đang sync...`);

            // Step 2: Sync in batches, calling API repeatedly
            let totalSynced = 0;
            let totalUpdated = 0;
            let batchNum = 0;
            let hasMore = true;

            while (hasMore) {
                batchNum++;
                setSyncMessage(`Đang sync batch ${batchNum}...`);

                const result = await socialFeedApi.sync();
                totalSynced += result.synced;
                totalUpdated += (result as any).updated || 0;
                hasMore = result.has_more;

                // Update progress based on total_in_db vs fb_total
                const currentInDb = result.total_in_db;
                const progress = Math.min(100, Math.round((currentInDb / total) * 100));
                setSyncProgress(progress);
                setSyncedCount(currentInDb);
                setSyncMessage(`Batch ${batchNum}: ${result.synced} mới. Tổng: ${currentInDb}/${total}`);

                // Small delay to avoid rate limiting
                if (hasMore) {
                    await new Promise(r => setTimeout(r, 300));
                }
            }

            setSyncProgress(100);
            setSyncMessage(`Hoàn tất! ${totalSynced} mới, ${totalUpdated} cập nhật`);
            toast.success(`Đã sync xong ${totalSynced + totalUpdated} bài đăng!`);

            // Reload feed
            setTimeout(() => {
                loadFeed(1);
                setSyncing(false);
            }, 1500);

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Sync thất bại');
            setSyncing(false);
        }
    };

    const openImport = (item: SocialFeedItem) => {
        setImportModal(item);
        const name = item.caption?.split(/[#\n]/)[0].trim().slice(0, 50) || 'Sản phẩm mới';
        // Suggest price if we can finding numbers, else default
        // Simple regex to find money-like numbers could be added here
        setImportForm({ name_vi: name, price: 300000 });
    };

    const handleImport = async () => {
        if (importModal) {
            try {
                await socialFeedApi.importAsProduct(importModal.id, importForm);
                setFeed(feed.map(f => f.id === importModal.id ? { ...f, is_imported_as_product: true } : f));
                toast.success('Đã import thành sản phẩm!');
                setImportModal(null);
            } catch (error) {
                toast.error('Import thất bại');
            }
        }
    };

    const goToPage = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            loadFeed(newPage);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Social Feed</h2>
                    <p className="text-muted-foreground">
                        {totalItems} bài đăng trong DB
                    </p>
                </div>
                <Button
                    onClick={handleSyncBatches}
                    disabled={syncing}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white min-w-[160px]"
                >
                    {syncing ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang sync...</>
                    ) : (
                        <><RefreshCw className="h-4 w-4 mr-2" />Sync Facebook</>
                    )}
                </Button>
            </div>

            {/* Progress Bar */}
            {syncing && (
                <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-blue-700">{syncMessage}</span>
                            <span className="text-blue-600 font-bold">{syncProgress}%</span>
                        </div>
                        <Progress value={syncProgress} className="h-3" />
                        {fbTotal > 0 && (
                            <div className="text-xs text-blue-600 text-center">
                                {syncedCount} / {fbTotal} bài đăng
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                <Card><CardContent className="p-4 flex items-center gap-4"><div className="p-3 rounded-xl bg-blue-500/10"><Facebook className="h-6 w-6 text-blue-500" /></div><div><div className="text-2xl font-bold">{totalItems}</div><div className="text-sm text-muted-foreground">Tổng bài</div></div></CardContent></Card>
                <Card><CardContent className="p-4 flex items-center gap-4"><div className="p-3 rounded-xl bg-pink-500/10"><Instagram className="h-6 w-6 text-pink-500" /></div><div><div className="text-2xl font-bold">{feed.filter(f => f.platform === 'instagram').length}</div><div className="text-sm text-muted-foreground">Instagram</div></div></CardContent></Card>
                <Card><CardContent className="p-4 flex items-center gap-4"><div className="p-3 rounded-xl bg-green-500/10"><Check className="h-6 w-6 text-green-500" /></div><div><div className="text-2xl font-bold">{feed.filter(f => f.is_imported_as_product).length}</div><div className="text-sm text-muted-foreground">Đã import</div></div></CardContent></Card>
                <Card><CardContent className="p-4 flex items-center gap-4"><div className="p-3 rounded-xl bg-purple-500/10"><ImageIcon className="h-6 w-6 text-purple-500" /></div><div><div className="text-2xl font-bold">{feed.filter(f => (f.image_urls?.length || 0) > 1).length}</div><div className="text-sm text-muted-foreground">Nhiều ảnh</div></div></CardContent></Card>
            </div>

            {/* Feed Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-80 w-full rounded-xl" />)}</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {feed.map(item => (
                        <SocialFeedItemCard key={item.id} item={item} onImport={openImport} />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => goToPage(page - 1)} disabled={page <= 1 || loading}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum: number;
                            if (totalPages <= 5) pageNum = i + 1;
                            else if (page <= 3) pageNum = i + 1;
                            else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                            else pageNum = page - 2 + i;
                            return (
                                <Button key={pageNum} variant={page === pageNum ? 'default' : 'outline'} size="sm" onClick={() => goToPage(pageNum)} disabled={loading} className={page === pageNum ? 'bg-pink-500 hover:bg-pink-600' : ''}>
                                    {pageNum}
                                </Button>
                            );
                        })}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => goToPage(page + 1)} disabled={page >= totalPages || loading}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground ml-4">Trang {page} / {totalPages}</span>
                </div>
            )}

            {/* Import Modal */}
            <Dialog open={!!importModal} onOpenChange={() => setImportModal(null)}><DialogContent>
                <DialogHeader><DialogTitle>Import làm sản phẩm</DialogTitle></DialogHeader>
                {importModal && <>
                    <div className="flex gap-4"><img src={importModal.image_url} alt="" className="w-24 h-24 rounded-lg object-cover" /><div className="flex-1"><p className="text-sm text-muted-foreground line-clamp-3">{importModal.caption}</p></div></div>
                    <div className="space-y-4"><div><Label>Tên sản phẩm *</Label><Input value={importForm.name_vi} onChange={e => setImportForm({ ...importForm, name_vi: e.target.value })} /></div><div><Label>Giá (VND) *</Label><Input type="text" value={Number(importForm.price).toLocaleString('vi-VN')} onChange={e => { const raw = e.target.value.replace(/\D/g, ''); setImportForm({ ...importForm, price: Number(raw) || 0 }); }} /></div></div>
                </>}
                <DialogFooter><Button variant="outline" onClick={() => setImportModal(null)}>Hủy</Button><Button onClick={handleImport} className="bg-pink-500 text-white">Import</Button></DialogFooter>
            </DialogContent></Dialog>
        </div>
    );
}
