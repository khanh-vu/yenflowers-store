
import { useState } from "react";
import { Facebook, Instagram, Twitter, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Footer() {
    const [email, setEmail] = useState("");

    const handleNewsletterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Handle newsletter signup
        console.log("Newsletter signup:", email);
        setEmail("");
    };

    return (
        <footer className="border-t border-black/10 bg-white dark:border-white/10 dark:bg-card">
            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:px-8 lg:px-10">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                    {/* Brand & Social */}
                    <div className="flex flex-col gap-4">
                        <Link to="/">
                            <img src="/logo.png" alt="YenFlowers" className="h-12 w-auto" />
                        </Link>
                        <p className="text-sm text-muted-foreground">
                            Artfully crafted flowers, delivered fresh in Ho Chi Minh City.
                        </p>
                        <div className="flex gap-4">
                            <a
                                href="#"
                                className="text-muted-foreground transition-colors hover:text-foreground"
                                aria-label="Facebook"
                            >
                                <Facebook className="h-5 w-5" />
                            </a>
                            <a
                                href="#"
                                className="text-muted-foreground transition-colors hover:text-foreground"
                                aria-label="Instagram"
                            >
                                <Instagram className="h-5 w-5" />
                            </a>
                            <a
                                href="#"
                                className="text-muted-foreground transition-colors hover:text-foreground"
                                aria-label="Twitter"
                            >
                                <Twitter className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="flex flex-col gap-4">
                        <h4 className="font-bold text-foreground">Quick Links</h4>
                        <Link
                            to="/faq"
                            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                            FAQs
                        </Link>
                        <Link
                            to="/delivery"
                            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                            Delivery Info
                        </Link>
                        <Link
                            to="/terms"
                            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                            Terms & Conditions
                        </Link>
                        <Link
                            to="/contact"
                            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                            Contact Us
                        </Link>
                    </div>

                    {/* Contact */}
                    <div className="flex flex-col gap-4">
                        <h4 className="font-bold text-foreground">Contact</h4>
                        <p className="text-sm text-muted-foreground">
                            123 Flower Street, District 1
                            <br />
                            Ho Chi Minh City, Vietnam
                        </p>
                        <p className="text-sm text-muted-foreground">
                            hello@yenflowers.vn
                            <br />
                            +84 123 456 789
                        </p>
                    </div>

                    {/* Newsletter */}
                    <div className="flex flex-col gap-4">
                        <h4 className="font-bold text-foreground">Newsletter</h4>
                        <p className="text-sm text-muted-foreground">
                            Sign up for special offers and first look at our new bouquets.
                        </p>
                        <form onSubmit={handleNewsletterSubmit} className="flex w-full">
                            <Input
                                type="email"
                                placeholder="Your email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-10 flex-1 rounded-r-none border-r-0 bg-background text-sm focus:border-primary focus:ring-primary"
                            />
                            <Button
                                type="submit"
                                size="icon"
                                className="h-10 w-10 rounded-l-none bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                <ArrowRight className="h-5 w-5" />
                            </Button>
                        </form>
                    </div>
                </div>

                {/* Copyright */}
                <div className="mt-10 border-t border-black/10 pt-6 text-center text-sm text-muted-foreground dark:border-white/10">
                    <p>© {new Date().getFullYear()} YenFlowers. All Rights Reserved.</p>
                </div>
            </div>
        </footer>
    );
}
