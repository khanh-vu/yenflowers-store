import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import type { SocialFeedItem } from '@/types';
import VerticalTimeline from '@/components/blog/VerticalTimeline';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowRight } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api/v1';

const fetchSocialFeed = async () => {
    const response = await fetch(`${API_BASE}/social/feed`);
    if (!response.ok) throw new Error('Failed to fetch social feed');
    const data = await response.json();
    if (Array.isArray(data)) return data as SocialFeedItem[];
    return (data?.items || []) as SocialFeedItem[];
};

// Hook to get image dimensions
function useImageDimensions(src: string | undefined) {
    const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

    useEffect(() => {
        if (!src) return;
        const img = new Image();
        img.onload = () => setDimensions({ width: img.width, height: img.height });
        img.src = src;
    }, [src]);

    return dimensions;
}

export default function BlogPage() {
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

    const { data: posts, isLoading, error } = useQuery({
        queryKey: ['social_feed'],
        queryFn: fetchSocialFeed,
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#f8f6f3] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-stone-300 border-t-stone-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-stone-500 font-serif">Loading stories...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#f8f6f3] flex items-center justify-center text-red-500">
                Failed to load stories. Please try again later.
            </div>
        );
    }

    // Filter and sort posts
    const filteredPosts = posts?.filter((post: SocialFeedItem) => {
        if (selectedMonth && (post.posted_at || post.synced_at)) {
            const date = new Date(post.posted_at || post.synced_at);
            const monthLabel = date.toLocaleString('default', { month: 'long', year: 'numeric' });
            return monthLabel === selectedMonth;
        }
        return true;
    }) || [];

    const pinnedPost = posts?.find((p: SocialFeedItem) => p.is_pinned);
    const gridPosts = filteredPosts.filter((p: SocialFeedItem) => !p.is_pinned);
    gridPosts.sort((a, b) => new Date(b.posted_at || b.synced_at).getTime() - new Date(a.posted_at || a.synced_at).getTime());

    const availableMonths = Array.from(new Set(posts?.map(p => {
        const d = new Date(p.posted_at || p.synced_at);
        return d.toLocaleString('default', { month: 'long', year: 'numeric' });
    }).filter(Boolean) as string[]));

    // Format date helper
    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    // Get first line as title
    const getTitle = (caption?: string) => caption?.split('\n')[0]?.slice(0, 60) || 'Flower Story';

    return (
        <div className="min-h-screen bg-[#f8f6f3] font-sans">
            {/* Header */}
            <header className="bg-[#3d3d3d] text-white py-6 px-4">
                <div className="container mx-auto max-w-6xl flex items-center justify-between">
                    <Link to="/blog" className="font-serif text-xl tracking-wide">
                        Flower Stories
                    </Link>
                    <p className="text-sm text-stone-300 font-serif italic hidden md:block">Chuyện Của Hoa</p>
                </div>
            </header>

            {/* Hero Pinned Post */}
            {pinnedPost && !selectedMonth && (
                <section className="relative">
                    <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
                        <img
                            src={pinnedPost.image_url}
                            alt="Featured"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                        {/* PINNED badge */}
                        <div className="absolute top-6 left-6 bg-stone-800/80 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                            ★ PINNED
                        </div>

                        {/* Content overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 text-white">
                            <div className="container mx-auto max-w-6xl">
                                <p className="text-sm opacity-80 mb-2 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">🌸</span>
                                    Posted by Yen Flowers
                                </p>
                                <h1 className="text-2xl md:text-4xl font-serif font-bold mb-4 leading-tight max-w-2xl">
                                    {getTitle(pinnedPost.caption)}
                                </h1>
                                <p className="text-sm md:text-base opacity-90 max-w-xl line-clamp-2 mb-4">
                                    {pinnedPost.caption?.split('\n').slice(1, 3).join(' ')}
                                </p>
                                <Link to={`/blog/${pinnedPost.id}`}>
                                    <Button variant="secondary" className="rounded-full">
                                        Read Story
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Main Content */}
            <div className="container mx-auto max-w-6xl px-4 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Timeline Sidebar */}
                    <aside className="lg:col-span-2">
                        <VerticalTimeline
                            availableMonths={availableMonths}
                            selectedMonth={selectedMonth}
                            onSelectMonth={setSelectedMonth}
                        />
                    </aside>

                    {/* Posts - Row Layout with Dynamic Photo Sizing */}
                    <main className="lg:col-span-10">
                        <div className="space-y-16">
                            {gridPosts.map((post) => (
                                <PostRow
                                    key={post.id}
                                    post={post}
                                    formatDate={formatDate}
                                    getTitle={getTitle}
                                />
                            ))}
                        </div>

                        {gridPosts.length === 0 && (
                            <div className="text-center py-20 bg-stone-100 rounded-2xl border border-dashed border-stone-300">
                                <p className="text-stone-500 font-serif text-lg">No stories found for this period.</p>
                                <Button
                                    variant="link"
                                    onClick={() => setSelectedMonth(null)}
                                    className="text-stone-700 mt-2"
                                >
                                    View all stories
                                </Button>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-[#3d3d3d] text-white py-8 px-4 mt-12">
                <div className="container mx-auto max-w-6xl text-center">
                    <p className="font-serif text-lg mb-2">Flower Stories</p>
                    <p className="text-sm text-stone-400">© 2025 Yen Flowers. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}

// Individual post row component with dynamic image sizing
function PostRow({
    post,
    formatDate,
    getTitle
}: {
    post: SocialFeedItem;
    formatDate: (date: string) => string;
    getTitle: (caption?: string) => string;
}) {
    const dimensions = useImageDimensions(post.image_url);
    const isPortrait = dimensions ? dimensions.height > dimensions.width : false;
    const aspectRatio = dimensions ? dimensions.width / dimensions.height : 1;

    // Determine image column span based on aspect ratio
    const imageColSpan = isPortrait ? 'md:col-span-1' : 'md:col-span-2';
    const contentColSpan = isPortrait ? 'md:col-span-2' : 'md:col-span-1';

    return (
        <article className="group">
            <div className={`grid gap-6 md:grid-cols-3`}>
                {/* Image - Dynamic sizing based on actual ratio */}
                <div className={`${imageColSpan} overflow-hidden rounded-lg`}>
                    <Link to={`/blog/${post.id}`}>
                        <div
                            className="relative bg-stone-100 overflow-hidden"
                            style={{
                                paddingBottom: dimensions ? `${(1 / aspectRatio) * 100}%` : '75%'
                            }}
                        >
                            <img
                                src={post.image_url}
                                alt="Post"
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                        </div>
                    </Link>
                </div>

                {/* Content */}
                <div className={`${contentColSpan} flex flex-col justify-center`}>
                    <div className="flex items-center gap-2 text-xs text-stone-500 mb-3">
                        <Calendar className="w-3 h-3" />
                        {formatDate(post.posted_at || post.synced_at)}
                    </div>

                    <h2 className="text-xl font-serif font-semibold text-stone-800 mb-3 leading-tight">
                        {getTitle(post.caption)}
                    </h2>

                    <p className="text-stone-600 text-sm leading-relaxed line-clamp-4 mb-4">
                        {post.caption?.split('\n').slice(1).join(' ')}
                    </p>

                    <div className="flex items-center gap-4 mt-auto">
                        <Link
                            to={`/blog/${post.id}`}
                            className="text-sm font-medium text-stone-700 hover:text-stone-900 transition-colors"
                        >
                            Read More →
                        </Link>
                    </div>
                </div>
            </div>
        </article>
    );
}
