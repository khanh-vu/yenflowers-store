import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { SocialFeedItem } from '@/types';
import { publicApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, ExternalLink, Share2, Facebook, ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';

// Get all images from post
const getPostImages = (post: SocialFeedItem): string[] => {
    if (post.image_urls && post.image_urls.length > 0) {
        return post.image_urls;
    }
    return post.image_url ? [post.image_url] : [];
};

export default function PostDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null); // For lightbox
    const [activeSlide, setActiveSlide] = useState(0); // For inline slider

    const { data: post, isLoading, error } = useQuery({
        queryKey: ['social_post', id],
        queryFn: () => publicApi.getSocialPost(id || ''),
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-10 h-10 border-3 border-stone-200 border-t-stone-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
                <p className="text-stone-500 font-serif text-lg">Post not found.</p>
                <Button asChild variant="outline" className="rounded-full">
                    <Link to="/blog">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to stories
                    </Link>
                </Button>
            </div>
        );
    }

    const images = getPostImages(post);
    const date = new Date(post.posted_at || post.synced_at);
    const formattedDate = date.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    // Parse caption - first line as title, rest as content
    const lines = post.caption?.split('\n') || [];
    const title = lines[0] || 'Flower Story';
    const contentLines = lines.slice(1).filter(line => line.trim());

    // Group content into paragraphs (separated by empty lines in original)
    const paragraphs: string[] = [];
    let currentParagraph = '';

    for (const line of contentLines) {
        if (line.trim() === '') {
            if (currentParagraph) {
                paragraphs.push(currentParagraph.trim());
                currentParagraph = '';
            }
        } else {
            currentParagraph += (currentParagraph ? '\n' : '') + line;
        }
    }
    if (currentParagraph) {
        paragraphs.push(currentParagraph.trim());
    }

    const nextSlide = (e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveSlide(prev => (prev + 1) % images.length);
    };

    const prevSlide = (e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveSlide(prev => (prev - 1 + images.length) % images.length);
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-stone-100">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-5xl">
                    <Button asChild variant="ghost" size="sm" className="text-stone-600 hover:text-stone-900 -ml-2">
                        <Link to="/blog">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Flower Stories
                        </Link>
                    </Button>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="text-stone-400 hover:text-stone-600 w-9 h-9">
                            <Share2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <article className="container mx-auto px-4 py-8 max-w-5xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

                    {/* Image Section */}
                    <div className="space-y-4">
                        {/* Main Image Slider */}
                        {images.length > 0 && (
                            <div
                                className="relative group cursor-pointer overflow-hidden rounded-2xl bg-stone-100"
                                onClick={() => setSelectedImageIndex(activeSlide)}
                            >
                                <img
                                    src={images[activeSlide]}
                                    alt={title}
                                    className="w-full aspect-[4/5] object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                    <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>

                                {/* Slide Controls */}
                                {images.length > 1 && (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm shadow-xl"
                                            onClick={prevSlide}
                                        >
                                            <ChevronLeft className="h-6 w-6" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm shadow-xl"
                                            onClick={nextSlide}
                                        >
                                            <ChevronRight className="h-6 w-6" />
                                        </Button>

                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                                            {activeSlide + 1} / {images.length}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Thumbnail Gallery */}
                        {images.length > 1 && (
                            <div className="grid grid-cols-5 gap-2">
                                {images.map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveSlide(i)}
                                        className={`relative aspect-square rounded-lg overflow-hidden transition-all ${activeSlide === i ? 'ring-2 ring-stone-900 ring-offset-2' : 'hover:opacity-80 opacity-60'}`}
                                    >
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Content Section */}
                    <div className="flex flex-col">
                        {/* Meta */}
                        <div className="flex items-center gap-3 text-sm text-stone-400 mb-4">
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                <time>{formattedDate}</time>
                            </div>
                            <span className="w-1 h-1 rounded-full bg-stone-300" />
                            <div className="flex items-center gap-1">
                                <Facebook className="w-3.5 h-3.5 text-blue-500" />
                                <span>Facebook</span>
                            </div>
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 mb-6 leading-tight">
                            {title}
                        </h1>

                        {/* Body */}
                        <div className="flex-1 space-y-4 text-stone-600 leading-relaxed">
                            {paragraphs.map((para, i) => (
                                <p key={i} className="whitespace-pre-line">
                                    {para}
                                </p>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="mt-8 pt-6 border-t border-stone-100 flex flex-wrap items-center gap-3">
                            <Button asChild className="rounded-full bg-stone-900 hover:bg-stone-800">
                                <a href={post.permalink} target="_blank" rel="noreferrer">
                                    View on Facebook
                                    <ExternalLink className="w-4 h-4 ml-2" />
                                </a>
                            </Button>
                            <Button asChild variant="outline" className="rounded-full">
                                <Link to="/blog">
                                    More Stories
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </article>

            {/* Lightbox Modal */}
            {selectedImageIndex !== null && images.length > 0 && (
                <div
                    className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
                    onClick={() => setSelectedImageIndex(null)}
                >
                    {/* Close button */}
                    <button
                        className="absolute top-4 right-4 text-white/70 hover:text-white p-2"
                        onClick={() => setSelectedImageIndex(null)}
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Navigation arrows */}
                    {images.length > 1 && (
                        <>
                            <button
                                className="absolute left-4 text-white/70 hover:text-white p-2"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedImageIndex(prev =>
                                        prev !== null ? (prev - 1 + images.length) % images.length : 0
                                    );
                                }}
                            >
                                <ChevronLeft className="w-8 h-8" />
                            </button>
                            <button
                                className="absolute right-4 text-white/70 hover:text-white p-2"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedImageIndex(prev =>
                                        prev !== null ? (prev + 1) % images.length : 0
                                    );
                                }}
                            >
                                <ChevronRight className="w-8 h-8" />
                            </button>
                        </>
                    )}

                    {/* Image */}
                    <img
                        src={images[selectedImageIndex]}
                        alt=""
                        className="max-w-[90vw] max-h-[90vh] object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />

                    {/* Counter */}
                    {images.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
                            {selectedImageIndex + 1} / {images.length}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
