import { ShoppingCart, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

// Placeholder product data (will be replaced with Supabase)
const products = [
  { id: 1, name: "Hoa Hồng Đỏ", nameEn: "Red Roses", price: 450000, image: "https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?q=80&w=500" },
  { id: 2, name: "Hoa Cẩm Tú Cầu", nameEn: "Hydrangea", price: 550000, image: "https://images.unsplash.com/photo-1563241527-3004b7be025f?q=80&w=500" },
  { id: 3, name: "Hoa Lan Hồ Điệp", nameEn: "Orchid", price: 850000, image: "https://images.unsplash.com/photo-1507290439931-a861b5a38200?q=80&w=500" },
  { id: 4, name: "Bó Hoa Mùa Xuân", nameEn: "Spring Bouquet", price: 650000, image: "https://images.unsplash.com/photo-1596562092040-c976d8b97d26?q=80&w=500" },
];

const categories = [
  { name: "Sinh Nhật", nameEn: "Birthday", count: 24 },
  { name: "Tình Yêu", nameEn: "Romance", count: 18 },
  { name: "Chia Buồn", nameEn: "Sympathy", count: 12 },
  { name: "Khai Trương", nameEn: "Celebration", count: 15 },
];

function formatPrice(price: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <a href="/" className="text-2xl font-bold tracking-tight">
            Yen<span className="text-primary">Flowers</span>
          </a>

          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-sm font-medium hover:text-primary transition-colors">Sản Phẩm</a>
            <a href="#" className="text-sm font-medium hover:text-primary transition-colors">Dịch Vụ</a>
            <a href="#" className="text-sm font-medium hover:text-primary transition-colors">Blog</a>
            <a href="#" className="text-sm font-medium hover:text-primary transition-colors">Liên Hệ</a>
          </nav>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5" />
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    0
                  </Badge>
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Giỏ Hàng</SheetTitle>
                </SheetHeader>
                <div className="mt-8 text-center text-muted-foreground">
                  Giỏ hàng trống
                </div>
              </SheetContent>
            </Sheet>

            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1487530811176-3780de880c2d?q=80&w=2000')" }}
          >
            <div className="absolute inset-0 bg-black/40" />
          </div>
          <div className="relative z-10 text-center text-white space-y-6 px-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Hoa Tươi Cao Cấp
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto opacity-90">
              Nơi mỗi bông hoa kể một câu chuyện. Giao hàng nhanh tại TP.HCM
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" className="text-base">
                Xem Bộ Sưu Tập
              </Button>
              <Button size="lg" variant="outline" className="text-base bg-transparent border-white text-white hover:bg-white hover:text-black">
                Liên Hệ
              </Button>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="container py-16">
          <h2 className="text-3xl font-bold text-center mb-10">Danh Mục</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Card key={cat.name} className="group cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{cat.name}</h3>
                  <p className="text-sm text-muted-foreground">{cat.count} sản phẩm</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Featured Products */}
        <section className="container py-16 bg-muted/50">
          <h2 className="text-3xl font-bold text-center mb-10">Sản Phẩm Nổi Bật</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="group overflow-hidden">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{product.nameEn}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-bold">{formatPrice(product.price)}</span>
                    <Button size="sm">Thêm</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button variant="outline" size="lg">Xem Tất Cả</Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-12">
        <div className="container text-center">
          <h3 className="text-2xl font-bold mb-4">YenFlowers</h3>
          <p className="opacity-80 mb-6">Ho Chi Minh City, Vietnam</p>
          <div className="flex justify-center gap-6 mb-6">
            <a href="https://www.facebook.com/Flowers.Yen" target="_blank" className="hover:opacity-80">Facebook</a>
            <a href="https://www.instagram.com/yen_flowers/" target="_blank" className="hover:opacity-80">Instagram</a>
          </div>
          <p className="text-sm opacity-60">© 2025 YenFlowers. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
