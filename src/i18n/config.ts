import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
const resources = {
    vi: {
        translation: {
            // Header & Navigation
            header: {
                home: "Trang Chủ",
                products: "Sản Phẩm",
                blog: "Chuyện Hoa",
                about: "Về Chúng Tôi",
                contact: "Liên Hệ",
                search: "Tìm kiếm sản phẩm",
                cart: "Giỏ hàng",
                account: "Tài khoản",
            },

            // Hero Section
            hero: {
                title: "Gửi Yêu Thương",
                subtitle: "Mỗi bông hoa là một câu chuyện. Đánh thức cảm xúc với những thiết kế hoa tươi nghệ thuật từ YenFlowers.",
                shopNow: "Mua Ngay",
                contact: "Liên Hệ",
            },

            // Trust Banner
            trust: {
                freeShipping: "Miễn phí ship từ 500k",
                fastDelivery: "Giao nhanh 2 giờ",
                securePayment: "Thanh toán an toàn",
                multipleOptions: "Đa dạng hình thức",
            },

            // Products
            products: {
                featured: "Sản Phẩm Nổi Bật",
                viewAll: "Xem Tất Cả Sản Phẩm",
                addToCart: "Thêm vào giỏ",
                quickView: "Xem nhanh",
                outOfStock: "Hết hàng",
                inStock: "Còn hàng",
                sale: "Giảm giá",
                new: "Mới",
                bestseller: "Bán chạy",
                showing: "Hiển thị",
                of: "/",
                products_other: "sản phẩm",
                filters: "Bộ lọc",
                clearFilters: "Xóa bộ lọc",
                sort: "Sắp xếp",
                newest: "Mới nhất",
                priceAsc: "Giá tăng dần",
                priceDesc: "Giá giảm dần",
                popular: "Phổ biến",
                categories: "Danh mục",
                priceRange: "Mức giá",
                under500k: "Dưới 500K",
                "500k-1m": "500K - 1M",
                "1m-2m": "1M - 2M",
                over2m: "Trên 2M",
                allCategories: "Tất cả",
                noProducts: "Không tìm thấy sản phẩm",
                tryDifferentFilters: "Vui lòng thử lại với bộ lọc khác",
            },

            // Product Detail
            productDetail: {
                sku: "SKU",
                quantity: "Số lượng",
                addToCartBtn: "Thêm vào giỏ hàng",
                addToWishlist: "Yêu thích",
                share: "Chia sẻ",
                description: "Mô tả sản phẩm",
                delivery: "Chính sách giao hàng",
                care: "Hướng dẫn bảo quản",
                relatedProducts: "Sản phẩm liên quan",
                inStock_other: "Còn hàng ({{count}} sản phẩm)",
                outOfStock: "Hết hàng",
                deliveryInfo: {
                    express: "Giao express trong 2 giờ (nội thành TP.HCM)",
                    standard: "Giao tiêu chuẩn trong ngày (đặt trước 15h)",
                    suburban: "Giao ngoại thành: 1-2 ngày",
                    freeShipping: "Miễn phí ship cho đơn hàng từ 500.000đ",
                    shippingFee: "Phí ship 30.000đ cho đơn dưới 500.000đ",
                },
                careInstructions: {
                    title: "Cách bảo quản hoa tươi lâu",
                    tip1: "Cắt chéo gốc hoa 2-3cm trước khi cắm",
                    tip2: "Thay nước sạch mỗi ngày",
                    tip3: "Đặt hoa ở nơi thoáng mát, tránh ánh nắng trực tiếp",
                    tip4: "Bỏ lá úa, hoa héo để giữ bình hoa luôn tươi đẹp",
                    tip5: "Sử dụng thuốc dưỡng hoa kèm theo (nếu có)",
                },
                benefits: {
                    fastDelivery: "Giao hàng nhanh 2 giờ trong nội thành",
                    securePayment: "Thanh toán COD, chuyển khoản, hoặc thẻ",
                    freeGift: "Miễn phí thiếp và đóng gói",
                },
            },

            // Common
            common: {
                loading: "Đang tải...",
                error: "Đã có lỗi xảy ra",
                prev: "Trước",
                next: "Sau",
                close: "Đóng",
                backToShop: "Quay lại cửa hàng",
                notFound: "Không tìm thấy sản phẩm",
            },

            // Footer
            footer: {
                copyright: "© 2024 YenFlowers. Bảo lưu mọi quyền.",
                followUs: "Theo dõi chúng tôi",
            },
        },
    },
    en: {
        translation: {
            // Header & Navigation
            header: {
                home: "Home",
                products: "Products",
                blog: "Stories",
                about: "About Us",
                contact: "Contact",
                search: "Search products",
                cart: "Cart",
                account: "Account",
            },

            // Hero Section
            hero: {
                title: "Send Love",
                subtitle: "Every flower tells a story. Awaken emotions with artistic fresh flower designs from YenFlowers.",
                shopNow: "Shop Now",
                contact: "Contact Us",
            },

            // Trust Banner
            trust: {
                freeShipping: "Free shipping from 500k",
                fastDelivery: "Fast 2-hour delivery",
                securePayment: "Secure payment",
                multipleOptions: "Multiple options",
            },

            // Products
            products: {
                featured: "Featured Products",
                viewAll: "View All Products",
                addToCart: "Add to Cart",
                quickView: "Quick View",
                outOfStock: "Out of Stock",
                inStock: "In Stock",
                sale: "Sale",
                new: "New",
                bestseller: "Bestseller",
                showing: "Showing",
                of: "of",
                products_other: "products",
                filters: "Filters",
                clearFilters: "Clear filters",
                sort: "Sort by",
                newest: "Newest",
                priceAsc: "Price: Low to High",
                priceDesc: "Price: High to Low",
                popular: "Popular",
                categories: "Categories",
                priceRange: "Price Range",
                under500k: "Under 500K",
                "500k-1m": "500K - 1M",
                "1m-2m": "1M - 2M",
                over2m: "Over 2M",
                allCategories: "All",
                noProducts: "No products found",
                tryDifferentFilters: "Please try different filters",
            },

            // Product Detail
            productDetail: {
                sku: "SKU",
                quantity: "Quantity",
                addToCartBtn: "Add to Cart",
                addToWishlist: "Add to Wishlist",
                share: "Share",
                description: "Product Description",
                delivery: "Delivery Policy",
                care: "Care Instructions",
                relatedProducts: "Related Products",
                inStock_other: "In Stock ({{count}} items)",
                outOfStock: "Out of Stock",
                deliveryInfo: {
                    express: "Express delivery in 2 hours (Saigon inner city)",
                    standard: "Standard same-day delivery (order before 3PM)",
                    suburban: "Suburban delivery: 1-2 days",
                    freeShipping: "Free shipping for orders over 500,000đ",
                    shippingFee: "Shipping fee 30,000đ for orders under 500,000đ",
                },
                careInstructions: {
                    title: "How to keep flowers fresh longer",
                    tip1: "Cut stems diagonally 2-3cm before arranging",
                    tip2: "Change water daily",
                    tip3: "Keep in a cool place, away from direct sunlight",
                    tip4: "Remove wilted leaves and flowers to keep bouquet fresh",
                    tip5: "Use flower food if provided",
                },
                benefits: {
                    fastDelivery: "Fast 2-hour delivery in inner city",
                    securePayment: "Pay by COD, bank transfer, or credit card",
                    freeGift: "Free card and gift wrapping",
                },
            },

            // Common
            common: {
                loading: "Loading...",
                error: "An error occurred",
                prev: "Previous",
                next: "Next",
                close: "Close",
                backToShop: "Back to Shop",
                notFound: "Product not found",
            },

            // Footer
            footer: {
                copyright: "© 2024 YenFlowers. All rights reserved.",
                followUs: "Follow Us",
            },
        },
    },
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'vi',
        interpolation: {
            escapeValue: false, // React already escapes
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        },
    });

export default i18n;
