import type { SocialFeedItem } from '@/types';
import { Calendar, Facebook, Instagram, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PostCardProps {
    post: SocialFeedItem;
}

export default function PostCard({ post }: PostCardProps) {
    const isFacebook = post.platform === 'facebook';
    const date = new Date(post.posted_at || post.synced_at).toLocaleDateString('vi-VN', {
        day: '2-digit', month: 'long', year: 'numeric'
    });

    return (
        <Card className="h-full border-none shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white overflow-hidden group rounded-xl">
            {/* Image Header */}
            <div className="relative aspect-[4/3] overflow-hidden">
                <img
                    src={post.image_url}
                    alt="Story"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm">
                    {isFacebook ? (
                        <Facebook className="w-4 h-4 text-blue-600" />
                    ) : (
                        <Instagram className="w-4 h-4 text-pink-600" />
                    )}
                </div>
            </div>

            {/* Content */}
            <CardContent className="p-5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">
                    <Calendar className="w-3 h-3" />
                    {date}
                </div>

                <p className="text-gray-700 line-clamp-4 leading-relaxed text-sm">
                    {post.caption}
                </p>
            </CardContent>

            {/* Footer */}
            <CardFooter className="p-5 pt-0 mt-auto border-t border-gray-50 bg-gray-50/50">
                <Button
                    variant="ghost"
                    asChild
                    className="w-full justify-between hover:bg-transparent hover:text-pink-600 p-0 h-auto py-4 text-gray-500 text-sm font-medium"
                >
                    <a href={post.permalink} target="_blank" rel="noreferrer">
                        Read on {isFacebook ? 'Facebook' : 'Instagram'}
                        <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                </Button>
            </CardFooter>
        </Card>
    );
}
