import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Calendar, ExternalLink } from 'lucide-react';
import { publicApi } from '@/services/api';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import VerticalTimeline from '@/components/blog/VerticalTimeline';
import type { SocialFeedItem } from '@/types';

// Loading skeleton component
function PostSkeleton() {
    return (
        <div className="group py-8 first:pt-0 animate-pulse">
            <div className="flex flex-col gap-6 md:flex-row md:gap-8">
                <div className="flex-shrink-0 overflow-hidden rounded-xl md:w-72">
                    <div className="aspect-[4/3] w-full bg-muted rounded-xl" />
                </div>
                <div className="flex flex-1 flex-col justify-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-24 bg-muted rounded" />
                        <div className="h-4 w-16 bg-muted rounded-full" />
                    </div>
                    <div className="h-7 w-3/4 bg-muted rounded" />
                    <div className="space-y-2">
                        <div className="h-4 w-full bg-muted rounded" />
                        <div className="h-4 w-2/3 bg-muted rounded" />
                    </div>
                    <div className="h-4 w-32 bg-muted rounded" />
                </div>
            </div>
        </div>
    );
}

// Parse month string to year/month numbers
function parseMonthString(monthStr: string): { year: number; month: number } | null {
    const monthNames: Record<string, number> = {
        'January': 1, 'February': 2, 'March': 3, 'April': 4,
        'May': 5, 'June': 6, 'July': 7, 'August': 8,
        'September': 9, 'October': 10, 'November': 11, 'December': 12
    };

    const parts = monthStr.split(' ');
    if (parts.length !== 2) return null;

    const monthName = parts[0];
    const year = parseInt(parts[1]);
    const month = monthNames[monthName];

    if (!month || isNaN(year)) return null;
    return { year, month };
}

export default function BlogPage() {
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
    const [activeMonth] = useState<string | null>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // Parse selected month for API query
    const parsedMonth = selectedMonth ? parseMonthString(selectedMonth) : null;

    // Fetch ALL posts with infinite scroll (when no month filter)
    const {
        data: infiniteData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isLoadingInfinite,
        isError: isErrorInfinite,
    } = useInfiniteQuery({
        queryKey: ['social_feed', 'blog', 'all'],
        queryFn: ({ pageParam = 1 }) => publicApi.getSocialFeed(pageParam, 12),
        getNextPageParam: (lastPage, allPages) => {
            const totalFetched = allPages.reduce((acc, page) => acc + page.items.length, 0);
            if (totalFetched < lastPage.total) {
                return allPages.length + 1;
            }
            return undefined;
        },
        initialPageParam: 1,
        enabled: !selectedMonth, // Only fetch when no month is selected
    });

    // Fetch posts for SPECIFIC month (when month filter is active)
    const {
        data: monthData,
        isLoading: isLoadingMonth,
        isError: isErrorMonth,
    } = useQuery({
        queryKey: ['social_feed', 'blog', 'month', parsedMonth?.year, parsedMonth?.month],
        queryFn: () => publicApi.getSocialFeed(1, 50, parsedMonth?.year, parsedMonth?.month),
        enabled: !!parsedMonth, // Only fetch when month is selected
    });

    // Determine which data to use
    const isLoading = selectedMonth ? isLoadingMonth : isLoadingInfinite;
    const isError = selectedMonth ? isErrorMonth : isErrorInfinite;

    // Get posts based on mode
    const allPosts = selectedMonth
        ? (monthData?.items || [])
        : (infiniteData?.pages.flatMap(page => page.items) || []);

    // Get unique months for timeline (from infinite scroll data)
    const availableMonths = [...new Set(
        (infiniteData?.pages.flatMap(page => page.items) || []).map(post => {
            const date = new Date(post.posted_at || post.synced_at);
            return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        })
    )];

    // Infinite scroll observer (only when no month filter)
    const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
        const [target] = entries;
        if (target.isIntersecting && hasNextPage && !isFetchingNextPage && !selectedMonth) {
            fetchNextPage();
        }
    }, [fetchNextPage, hasNextPage, isFetchingNextPage, selectedMonth]);

    useEffect(() => {
        const element = loadMoreRef.current;
        if (!element) return;

        const observer = new IntersectionObserver(handleObserver, {
            root: null,
            rootMargin: '300px',
            threshold: 0,
        });

        observer.observe(element);
        return () => observer.disconnect();
    }, [handleObserver]);

    // Format date helper
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    // Get first line as title
    const getTitle = (caption?: string) => {
        if (!caption) return "Untitled Post";
        const firstLine = caption.split('\n')[0];
        return firstLine.length > 80 ? firstLine.slice(0, 80) + '...' : firstLine;
    };

    // Get excerpt from caption
    const getExcerpt = (caption?: string) => {
        if (!caption) return "";
        const lines = caption.split('\n').filter(l => l.trim());
        if (lines.length > 1) {
            const excerpt = lines.slice(1).join(' ').slice(0, 200);
            return excerpt + (excerpt.length >= 200 ? '...' : '');
        }
        return "";
    };

    return (
        <>
            <SEO
                title="Our Stories - YenFlowers"
                description="Inspiration, tips, and stories from our flower studio in the heart of Ho Chi Minh City."
            />

            <div className="min-h-screen bg-background">
                {/* Hero Section */}
                <div className="px-4 py-10 sm:px-6 md:px-8 md:py-16 lg:px-10">
                    <div className="mx-auto max-w-7xl">
                        <div
                            className="flex min-h-[320px] flex-col items-center justify-center gap-6 rounded-xl bg-cover bg-center bg-no-repeat p-4 text-center md:min-h-[400px]"
                            style={{
                                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.5) 100%), url("/hero-banner.jpg")`,
                            }}
                        >
                            <div className="flex flex-col gap-2">
                                <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] text-white md:text-5xl">
                                    Our Stories in Bloom
                                </h1>
                                <p className="mx-auto max-w-xl text-sm font-normal leading-normal text-white/90 md:text-base">
                                    Inspiration, tips, and stories from our flower studio in the heart of Ho Chi Minh City.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content with Timeline */}
                <div className="px-4 pb-16 sm:px-6 md:px-8 lg:px-10">
                    <div className="mx-auto max-w-7xl">
                        <div className="flex flex-col gap-12 lg:flex-row">
                            {/* Timeline Sidebar */}
                            <aside className="hidden w-64 flex-shrink-0 lg:block">
                                <VerticalTimeline
                                    availableMonths={availableMonths}
                                    selectedMonth={selectedMonth}
                                    activeMonth={activeMonth}
                                    onSelectMonth={setSelectedMonth}
                                />
                            </aside>

                            {/* Posts List */}
                            <div className="flex-1">
                                {/* Mobile Month Filter */}
                                <div className="mb-6 flex flex-wrap gap-2 lg:hidden">
                                    <Button
                                        variant={!selectedMonth ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setSelectedMonth(null)}
                                        className="rounded-full"
                                    >
                                        All Stories
                                    </Button>
                                    {availableMonths.slice(0, 5).map((month) => (
                                        <Button
                                            key={month}
                                            variant={selectedMonth === month ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setSelectedMonth(month)}
                                            className="rounded-full"
                                        >
                                            {month.split(' ')[0].slice(0, 3)}
                                        </Button>
                                    ))}
                                </div>

                                {/* Selected Month Header */}
                                {selectedMonth && (
                                    <div className="mb-6 flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                                        <span className="font-medium">
                                            Showing stories from <span className="text-primary">{selectedMonth}</span>
                                            {monthData && ` (${monthData.total} posts)`}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedMonth(null)}
                                        >
                                            Clear filter
                                        </Button>
                                    </div>
                                )}

                                {isLoading ? (
                                    <div className="flex flex-col divide-y divide-border">
                                        <PostSkeleton />
                                        <PostSkeleton />
                                        <PostSkeleton />
                                    </div>
                                ) : isError ? (
                                    <div className="py-20 text-center">
                                        <p className="text-lg text-muted-foreground">Failed to load stories</p>
                                        <Button
                                            onClick={() => window.location.reload()}
                                            variant="outline"
                                            className="mt-4"
                                        >
                                            Try again
                                        </Button>
                                    </div>
                                ) : allPosts.length === 0 ? (
                                    <div className="py-20 text-center">
                                        <p className="text-lg text-muted-foreground">
                                            {selectedMonth
                                                ? `No stories found for ${selectedMonth}`
                                                : 'No stories found'
                                            }
                                        </p>
                                        {selectedMonth && (
                                            <Button
                                                variant="outline"
                                                onClick={() => setSelectedMonth(null)}
                                                className="mt-4"
                                            >
                                                View all stories
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col divide-y divide-border">
                                        {allPosts.map((post: SocialFeedItem) => (
                                            <article key={post.id} className="group py-8 first:pt-0">
                                                <div className="flex flex-col gap-6 md:flex-row md:gap-8">
                                                    {/* Image */}
                                                    <Link
                                                        to={`/blog/${post.id}`}
                                                        className="flex-shrink-0 overflow-hidden rounded-xl md:w-72"
                                                    >
                                                        <img
                                                            src={post.image_url || 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=600'}
                                                            alt={getTitle(post.caption)}
                                                            loading="lazy"
                                                            className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                        />
                                                    </Link>

                                                    {/* Content */}
                                                    <div className="flex flex-1 flex-col justify-center gap-3">
                                                        <p className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <Calendar className="h-3.5 w-3.5" />
                                                            {formatDate(post.posted_at || post.synced_at)}
                                                            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase">
                                                                {post.platform}
                                                            </span>
                                                        </p>

                                                        <Link to={`/blog/${post.id}`}>
                                                            <h2 className="text-xl font-bold leading-tight text-foreground transition-colors group-hover:text-primary md:text-2xl">
                                                                {getTitle(post.caption)}
                                                            </h2>
                                                        </Link>

                                                        <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                                                            {getExcerpt(post.caption)}
                                                        </p>

                                                        <a
                                                            href={post.permalink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                                                        >
                                                            Read on {post.platform === 'facebook' ? 'Facebook' : 'Instagram'}
                                                            <ExternalLink className="h-3.5 w-3.5" />
                                                        </a>
                                                    </div>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                )}

                                {/* Loading More Skeleton (only for infinite scroll mode) */}
                                {!selectedMonth && isFetchingNextPage && (
                                    <div className="flex flex-col divide-y divide-border border-t border-border">
                                        <PostSkeleton />
                                        <PostSkeleton />
                                    </div>
                                )}

                                {/* Load More Trigger (only for infinite scroll mode) */}
                                {!selectedMonth && (
                                    <div ref={loadMoreRef} className="flex justify-center py-8">
                                        {!hasNextPage && allPosts.length > 0 && (
                                            <p className="text-sm text-muted-foreground">
                                                You've reached the end • {allPosts.length} stories
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
