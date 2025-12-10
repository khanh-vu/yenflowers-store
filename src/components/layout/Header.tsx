import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, ShoppingBag, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet";

export function Header() {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { to: "/products", label: "Shop", active: false },
        { to: "/about", label: "About Us", active: false },
        { to: "/blog", label: "Blog", active: false },
        { to: "/contact", label: "Contact", active: false },
        { to: "/faq", label: "FAQ", active: false },
    ];

    return (
        <header
            className={`sticky top-0 z-50 border-b px-4 py-5 transition-all duration-300 md:px-8 lg:px-10 ${isScrolled
                ? "border-b-black/10 bg-[#f6f8f6]/80 backdrop-blur-sm dark:border-white/10 dark:bg-[#102216]/80"
                : "border-transparent bg-[#f6f8f6] dark:bg-[#102216]"
                }`}
        >
            <div className="mx-auto flex max-w-7xl items-center justify-between">
                {/* Left: Desktop Navigation */}
                <nav className="hidden flex-1 items-center gap-8 md:flex">
                    {navLinks.slice(0, 3).map((link) => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className={`text-base font-medium leading-normal transition-colors ${link.active
                                ? "text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                {/* Center: Logo */}
                <Link to="/" className="flex items-center justify-center">
                    <img
                        src="/logo.png"
                        alt="YenFlowers"
                        className="h-20 w-auto"
                    />
                </Link>

                {/* Right: More Links + Icons */}
                <div className="flex flex-1 items-center justify-end gap-2">
                    {/* Desktop Navigation - Right Side */}
                    <nav className="hidden items-center gap-8 pr-4 md:flex">
                        {navLinks.slice(3).map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={`text-sm font-medium leading-normal transition-colors ${link.active
                                    ? "text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Search */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-full text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                        aria-label="Search products"
                    >
                        <Search className="h-5 w-5" />
                    </Button>

                    {/* User Account */}
                    <Link to="/account">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="hidden h-10 w-10 rounded-full text-foreground hover:bg-black/5 dark:hover:bg-white/5 md:flex"
                            aria-label="User account"
                        >
                            <User className="h-5 w-5" />
                        </Button>
                    </Link>

                    {/* Shopping Cart */}
                    <Link to="/cart" className="relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-full text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                            aria-label="Shopping cart"
                        >
                            <ShoppingBag className="h-5 w-5" />
                            <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center border-none bg-primary p-0 text-xs text-primary-foreground">
                                2
                            </Badge>
                        </Button>
                    </Link>

                    {/* Language Switcher */}
                    <div className="ml-2 hidden md:flex">
                        <LanguageSwitcher />
                    </div>

                    {/* Mobile Menu */}
                    <div className="md:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 rounded-full text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                                    aria-label="Open navigation menu"
                                >
                                    <Menu className="h-6 w-6" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-72 bg-background">
                                <div className="flex flex-col gap-6 pt-8">
                                    {navLinks.map((link) => (
                                        <Link
                                            key={link.to}
                                            to={link.to}
                                            className="text-lg font-medium text-foreground"
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                    <hr className="border-black/10 dark:border-white/10" />
                                    <Link to="/account" className="text-lg font-medium text-foreground">
                                        My Account
                                    </Link>
                                    <LanguageSwitcher />
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </header>
    );
}
