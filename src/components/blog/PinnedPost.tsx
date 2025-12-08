import type { SocialFeedItem } from '@/types';
import { Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PinnedPostProps {
    post: SocialFeedItem;
}

export default function PinnedPost({ post }: PinnedPostProps) {
    return (
        <div className="relative group overflow-hidden rounded-2xl bg-white shadow-xl border-l-4 border-l-amber-400">
            <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
                {/* Image Section */}
                <div className="relative h-64 lg:h-full overflow-hidden">
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300 z-10" />
                    <img
                        src={post.image_url}
                        alt="Pinned Story"
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-4 left-4 z-20">
                        <Badge className="bg-amber-400 hover:bg-amber-500 text-black font-semibold border-none shadow-sm">
                            ★ Featured Story
                        </Badge>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-8 flex flex-col justify-center bg-gradient-to-br from-white to-amber-50/30">
                    <div className="flex items-center gap-2 text-amber-600 mb-4 text-sm font-medium">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(post.posted_at || post.synced_at).toLocaleDateString('vi-VN', {
                            year: 'numeric', month: 'long', day: 'numeric'
                        })}</span>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-800 mb-4 leading-tight line-clamp-2">
                        {post.caption ? post.caption.split('\n')[0] : 'A Special Moment'}
                    </h2>

                    <p className="text-gray-600 mb-8 line-clamp-3 leading-relaxed">
                        {post.caption}
                    </p>

                    <div className="mt-auto">
                        <Button
                            asChild
                            variant="outline"
                            className="group/btn border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 transition-all rounded-full px-6"
                        >
                            <a href={post.permalink} target="_blank" rel="noreferrer" className="flex items-center gap-2">
                                Read Full Story
                                <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                            </a>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
