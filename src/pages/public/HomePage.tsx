import { lazy, Suspense } from "react";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { SEO } from "@/components/SEO";
import { TrustBanner } from "@/components/home/TrustBanner";

// Lazy load below-fold components
const CategoryGrid = lazy(() => import("@/components/home/CategoryGrid").then(m => ({ default: m.CategoryGrid })));
const ProductShowcase = lazy(() => import("@/components/home/ProductShowcase").then(m => ({ default: m.ProductShowcase })));
const StorySection = lazy(() => import("@/components/home/StorySection").then(m => ({ default: m.StorySection })));
const PaymentTrustBadges = lazy(() => import("@/components/home/TrustBanner").then(m => ({ default: m.PaymentTrustBadges })));
const InstagramFeed = lazy(() => import("@/components/home/InstagramFeed").then(m => ({ default: m.InstagramFeed })));

// Loading skeleton component
const SectionSkeleton = () => (
    <div className="container py-20">
        <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3 mx-auto" />
            <div className="h-64 bg-muted rounded" />
        </div>
    </div>
);

export default function HomePage() {
    return (
        <>
            <SEO
                title="Hoa Tươi Cao Cấp - Giao Nhanh 2 Giờ"
                description="YenFlowers - Thiết kế hoa tươi nghệ thuật, giao hoa nhanh 2 giờ nội thành. Miễn phí ship đơn từ 500k. Hoa sinh nhật, hoa tình yêu, hoa khai trương tươi đẹp mỗi ngày."
                type="website"
            />
            <div className="flex flex-col min-h-screen bg-background">
                <HeroSection />
                <TrustBanner />
                <FeaturesSection />

                <Suspense fallback={<SectionSkeleton />}>
                    <CategoryGrid />
                </Suspense>

                <Suspense fallback={<SectionSkeleton />}>
                    <ProductShowcase />
                </Suspense>

                <Suspense fallback={<SectionSkeleton />}>
                    <StorySection />
                </Suspense>

                <Suspense fallback={<SectionSkeleton />}>
                    <PaymentTrustBadges />
                </Suspense>

                <Suspense fallback={<SectionSkeleton />}>
                    <InstagramFeed />
                </Suspense>
            </div>
        </>
    );
}
