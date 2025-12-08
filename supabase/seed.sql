-- =====================================================
-- YenFlowers Database Seed Data
-- Run after migrations to populate sample data
-- =====================================================

-- =====================================================
-- CATEGORIES
-- =====================================================
INSERT INTO public.categories (id, slug, name_vi, name_en, description_vi, sort_order, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'sinh-nhat', 'Sinh Nhật', 'Birthday', 'Hoa sinh nhật đặc biệt cho người thân yêu', 1, true),
  ('22222222-2222-2222-2222-222222222222', 'tinh-yeu', 'Tình Yêu', 'Romance', 'Bó hoa lãng mạn cho người yêu thương', 2, true),
  ('33333333-3333-3333-3333-333333333333', 'khai-truong', 'Khai Trương', 'Grand Opening', 'Hoa chúc mừng khai trương, thăng tiến', 3, true),
  ('44444444-4444-4444-4444-444444444444', 'chia-buon', 'Chia Buồn', 'Sympathy', 'Vòng hoa chia buồn, tang lễ', 4, true),
  ('55555555-5555-5555-5555-555555555555', 'tet', 'Hoa Tết', 'Lunar New Year', 'Hoa trang trí Tết Nguyên Đán', 5, true),
  ('66666666-6666-6666-6666-666666666666', 'chau-cay', 'Chậu Cây', 'Potted Plants', 'Cây cảnh, chậu hoa để bàn', 6, true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- PRODUCTS
-- =====================================================
INSERT INTO public.products (id, sku, slug, name_vi, name_en, description_vi, price, sale_price, category_id, stock_quantity, is_featured, is_published, images, tags) VALUES
  -- Hoa Tình Yêu
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'HOA-001', 'hoa-hong-do-premium', 'Hoa Hồng Đỏ Premium', 'Premium Red Roses', 'Bó hoa hồng đỏ Ecuador tươi thắm, 20 bông được gói tinh tế với giấy kraft và ruy băng lụa. Món quà hoàn hảo cho ngày Valentine hoặc kỷ niệm.', 450000, 399000, '22222222-2222-2222-2222-222222222222', 50, true, true, '[{"url": "https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=800", "alt": "Hoa Hồng Đỏ Premium", "sort_order": 0}]', '{"valentine", "romantic", "bestseller"}'),
  
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'HOA-002', 'bo-hoa-tinh-yeu', 'Bó Hoa Tình Yêu', 'Love Bouquet', 'Bó hoa hỗn hợp hồng, cẩm chướng và baby breath, được sắp xếp tinh tế thể hiện tình yêu chân thành.', 550000, NULL, '22222222-2222-2222-2222-222222222222', 30, true, true, '[{"url": "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=800", "alt": "Bó Hoa Tình Yêu", "sort_order": 0}]', '{"romantic", "gift"}'),

  -- Hoa Sinh Nhật  
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'HOA-003', 'bo-hoa-sinh-nhat-ruc-ro', 'Bó Hoa Sinh Nhật Rực Rỡ', 'Vibrant Birthday Bouquet', 'Bó hoa đầy màu sắc với hướng dương, cúc đồng tiền và hoa hồng. Mang đến niềm vui và năng lượng tích cực.', 380000, NULL, '11111111-1111-1111-1111-111111111111', 40, true, true, '[{"url": "https://images.unsplash.com/photo-1596438459194-f275f413d6ff?w=800", "alt": "Bó Hoa Sinh Nhật", "sort_order": 0}]', '{"birthday", "colorful"}'),

  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbc', 'HOA-004', 'bo-hoa-tulip-pastel', 'Bó Hoa Tulip Pastel', 'Pastel Tulip Bouquet', 'Bó tulip nhập khẩu Hà Lan với các sắc pastel nhẹ nhàng: hồng, tím, vàng. Thanh lịch và tinh tế.', 680000, 599000, '11111111-1111-1111-1111-111111111111', 20, false, true, '[{"url": "https://images.unsplash.com/photo-1520763185298-1b434c919102?w=800", "alt": "Tulip Pastel", "sort_order": 0}]', '{"tulip", "imported", "elegant"}'),

  -- Hoa Khai Trương
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'HOA-005', 'lan-ho-diep-trang', 'Lan Hồ Điệp Trắng', 'White Phalaenopsis Orchid', 'Chậu lan hồ điệp trắng 3 cành, biểu tượng của sự sang trọng và may mắn. Phù hợp làm quà khai trương, thăng chức.', 850000, NULL, '33333333-3333-3333-3333-333333333333', 25, true, true, '[{"url": "https://images.unsplash.com/photo-1507290439931-a861b5a38200?w=800", "alt": "Lan Hồ Điệp Trắng", "sort_order": 0}]', '{"orchid", "premium", "corporate"}'),

  ('cccccccc-cccc-cccc-cccc-cccccccccccd', 'HOA-006', 'ke-hoa-khai-truong', 'Kệ Hoa Khai Trương', 'Grand Opening Flower Stand', 'Kệ hoa hoành tráng với hoa hồng, ly, và lá tropical. Bao gồm băng rôn chúc mừng.', 1500000, 1350000, '33333333-3333-3333-3333-333333333333', 10, false, true, '[{"url": "https://images.unsplash.com/photo-1563241527-3004b7be025f?w=800", "alt": "Kệ Hoa Khai Trương", "sort_order": 0}]', '{"stand", "corporate", "grand"}'),

  -- Hoa Tết
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'HOA-007', 'cham-mai-vang', 'Chậu Mai Vàng', 'Yellow Apricot Blossom', 'Chậu mai vàng Bình Định, cành đều, hoa nở đúng Tết. Biểu tượng may mắn và thịnh vượng.', 2500000, NULL, '55555555-5555-5555-5555-555555555555', 15, true, true, '[{"url": "https://images.unsplash.com/photo-1548199569-8686fe8953e7?w=800", "alt": "Mai Vàng", "sort_order": 0}]', '{"tet", "traditional", "lucky"}'),

  ('dddddddd-dddd-dddd-dddd-dddddddddde', 'HOA-008', 'canh-dao-tet', 'Cành Đào Tết', 'Peach Blossom Branch', 'Cành đào phai Nhật Tân, hoa hồng phấn đẹp mê ly. Giao hoa tươi trong ngày.', 350000, NULL, '55555555-5555-5555-5555-555555555555', 100, false, true, '[{"url": "https://images.unsplash.com/photo-1518135714426-95f4a716d1e3?w=800", "alt": "Cành Đào", "sort_order": 0}]', '{"tet", "traditional", "peach"}'),

  -- Chậu Cây
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'HOA-009', 'cay-kim-tien', 'Cây Kim Tiền', 'Money Tree', 'Cây kim tiền phong thủy, dễ chăm sóc, mang lại tài lộc. Phù hợp để bàn làm việc.', 280000, NULL, '66666666-6666-6666-6666-666666666666', 35, false, true, '[{"url": "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=800", "alt": "Cây Kim Tiền", "sort_order": 0}]', '{"plants", "lucky", "easy-care"}'),

  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeef', 'HOA-010', 'xuong-rong-mini', 'Xương Rồng Mini Set', 'Mini Cactus Set', 'Bộ 3 chậu xương rồng mini dễ thương, phù hợp trang trí bàn làm việc. Kèm đĩa lót gỗ.', 150000, 120000, '66666666-6666-6666-6666-666666666666', 60, false, true, '[{"url": "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=800", "alt": "Xương Rồng Mini", "sort_order": 0}]', '{"cactus", "mini", "desk"}')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- BLOG POSTS
-- =====================================================
INSERT INTO public.blog_posts (id, slug, title_vi, title_en, excerpt_vi, content_vi, featured_image, tags, is_published, published_at, view_count) VALUES
  ('11111111-aaaa-bbbb-cccc-dddddddddddd', 'cach-cham-soc-hoa-hong', 'Cách Chăm Sóc Hoa Hồng Bền Lâu', 'How to Keep Roses Fresh Longer', 'Hướng dẫn chi tiết cách giữ hoa hồng tươi lâu hơn 2 tuần tại nhà.', '## Bước 1: Cắt gốc đúng cách\n\nCắt chéo 45 độ dưới nước để tránh bọt khí...\n\n## Bước 2: Nước sạch và phụ gia\n\nThay nước mỗi 2 ngày, thêm chút đường hoặc aspirin...', 'https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=800', '{"tips", "roses", "care"}', true, NOW() - INTERVAL '7 days', 1234),
  
  ('22222222-aaaa-bbbb-cccc-dddddddddddd', 'y-nghia-cac-loai-hoa', 'Ý Nghĩa Của Các Loại Hoa Phổ Biến', 'Meaning of Popular Flowers', 'Tìm hiểu ý nghĩa của hoa hồng, tulip, lily và nhiều loại hoa khác.', '## Hoa Hồng\n\n- **Đỏ**: Tình yêu nồng cháy\n- **Trắng**: Thuần khiết, kính trọng\n- **Hồng**: Ngưỡng mộ, biết ơn\n\n## Hoa Tulip\n\nTình yêu hoàn hảo...', 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800', '{"meanings", "guide", "flowers"}', true, NOW() - INTERVAL '14 days', 2567),

  ('33333333-aaaa-bbbb-cccc-dddddddddddd', 'xu-huong-hoa-cuoi-2025', 'Xu Hướng Hoa Cưới 2025', 'Wedding Flower Trends 2025', 'Những xu hướng hoa cưới hot nhất năm 2025 cho cô dâu hiện đại.', '## 1. Bó hoa tự nhiên\n\nPhong cách garden-style với các loại hoa đồng nội...\n\n## 2. Màu sắc đất\n\nTone màu terracotta, sage green đang rất được ưa chuộng...', 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800', '{"wedding", "trends", "2025"}', true, NOW() - INTERVAL '3 days', 892)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SETTINGS (if not already inserted by migration)
-- =====================================================
INSERT INTO public.settings (key, value, description) VALUES
  ('delivery_fees', '{"default": 30000, "districts": {"1": 25000, "3": 25000, "7": 30000, "tan_binh": 35000, "binh_thanh": 30000, "phu_nhuan": 28000, "go_vap": 35000, "thu_duc": 40000}}', 'Phí giao hàng theo quận'),
  ('payment_methods', '{"cod": true, "stripe": true, "paypal": false, "bank_transfer": true}', 'Phương thức thanh toán'),
  ('store_info', '{"name": "YenFlowers", "phone": "0901234567", "email": "hello@yenflowers.vn", "address": "123 Nguyễn Huệ, Quận 1, TP.HCM", "facebook": "Flowers.Yen", "instagram": "yen_flowers"}', 'Thông tin cửa hàng'),
  ('fb_sync', '{"page_id": "", "last_sync": null, "auto_sync": false}', 'Cài đặt đồng bộ Facebook')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- Done!
-- =====================================================
SELECT 'Seed data inserted successfully!' as status;
