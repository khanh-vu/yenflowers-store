import { useEffect } from 'react';

interface SEOProps {
    title?: string;
    description?: string;
    image?: string;
    type?: 'website' | 'product' | 'article';
    canonical?: string;
}

export function SEO({
    title = "Hoa Tươi Cao Cấp - Giao Nhanh 2 Giờ",
    description = "YenFlowers - Thiết kế hoa tươi nghệ thuật, giao hoa nhanh 2 giờ nội thành. Miễn phí ship đơn từ 500k. Hoa sinh nhật, hoa tình yêu, hoa khai trương.",
    image = "/og-image.jpg",
    type = "website",
    canonical
}: SEOProps) {
    useEffect(() => {
        const siteUrl = window.location.origin;
        const currentUrl = window.location.href;
        const fullImageUrl = image.startsWith('http') ? image : `${siteUrl}${image}`;
        const canonicalUrl = canonical || currentUrl;

        // Set title
        document.title = `${title} | YenFlowers`;

        // Set or update meta tags
        const setMeta = (name: string, content: string, property = false) => {
            const attr = property ? 'property' : 'name';
            let element = document.querySelector(`meta[${attr}="${name}"]`);
            if (!element) {
                element = document.createElement('meta');
                element.setAttribute(attr, name);
                document.head.appendChild(element);
            }
            element.setAttribute('content', content);
        };

        // Primary meta tags
        setMeta('title', `${title} | YenFlowers`);
        setMeta('description', description);

        // Open Graph
        setMeta('og:type', type, true);
        setMeta('og:url', currentUrl, true);
        setMeta('og:title', `${title} | YenFlowers`, true);
        setMeta('og:description', description, true);
        setMeta('og:image', fullImageUrl, true);
        setMeta('og:site_name', 'YenFlowers', true);
        setMeta('og:locale', 'vi_VN', true);

        // Twitter
        setMeta('twitter:card', 'summary_large_image', true);
        setMeta('twitter:url', currentUrl, true);
        setMeta('twitter:title', `${title} | YenFlowers`, true);
        setMeta('twitter:description', description, true);
        setMeta('twitter:image', fullImageUrl, true);

        // Canonical
        let canonicalLink = document.querySelector('link[rel="canonical"]');
        if (!canonicalLink) {
            canonicalLink = document.createElement('link');
            canonicalLink.setAttribute('rel', 'canonical');
            document.head.appendChild(canonicalLink);
        }
        canonicalLink.setAttribute('href', canonicalUrl);

        // Structured Data
        let scriptTag = document.querySelector('script[type="application/ld+json"]');
        if (!scriptTag) {
            scriptTag = document.createElement('script');
            scriptTag.setAttribute('type', 'application/ld+json');
            document.head.appendChild(scriptTag);
        }

        const structuredData = {
            "@context": "https://schema.org",
            "@graph": [
                {
                    "@type": "Organization",
                    "name": "YenFlowers",
                    "url": siteUrl,
                    "logo": `${siteUrl}/logo.png`,
                    "description": "Premium flower shop delivering fresh, artistic flower arrangements",
                    "address": {
                        "@type": "PostalAddress",
                        "addressCountry": "VN",
                        "addressLocality": "Ho Chi Minh City"
                    },
                    "sameAs": [
                        "https://www.facebook.com/yenflowers",
                        "https://www.instagram.com/yen_flowers"
                    ]
                },
                {
                    "@type": "WebSite",
                    "url": siteUrl,
                    "name": "YenFlowers",
                    "description": description,
                    "publisher": {
                        "@type": "Organization",
                        "name": "YenFlowers"
                    }
                }
            ]
        };

        scriptTag.textContent = JSON.stringify(structuredData);
    }, [title, description, image, type, canonical]);

    return null;
}

