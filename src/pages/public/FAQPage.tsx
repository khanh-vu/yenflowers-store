import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SEO } from "@/components/SEO";

const faqCategories = [
    { id: "ordering", label: "Ordering & Payments" },
    { id: "delivery", label: "Delivery" },
    { id: "care", label: "Flower & Plant Care" },
    { id: "products", label: "Our Products & Services" },
];

const faqs = [
    {
        category: "ordering",
        question: "How do I place an order online?",
        answer: "To place an order, simply browse our collection, select the bouquet you love, add it to your cart, and proceed to checkout. You will be guided through the payment and delivery information steps.",
    },
    {
        category: "ordering",
        question: "What payment methods do you accept?",
        answer: "We accept various payment methods including credit/debit cards (Visa, Mastercard), bank transfers, MoMo, ZaloPay, and cash on delivery (COD) for orders within Ho Chi Minh City.",
    },
    {
        category: "delivery",
        question: "What areas in Ho Chi Minh City do you deliver to?",
        answer: "We deliver to all districts within Ho Chi Minh City. Delivery fees may vary based on the distance from our store. Please check our delivery policy page for detailed information on zones and charges.",
    },
    {
        category: "delivery",
        question: "Do you offer same-day delivery?",
        answer: "Yes! We offer same-day delivery for orders placed before 2:00 PM. Express delivery within 2 hours is also available for select areas in the city center.",
    },
    {
        category: "care",
        question: "How can I keep my flowers fresh for longer?",
        answer: "To maximize the lifespan of your flowers, trim the stems at an angle before placing them in a clean vase with fresh water. Keep them away from direct sunlight and heat. Change the water every two days for best results.",
    },
    {
        category: "care",
        question: "What should I do when I receive my bouquet?",
        answer: "Upon receiving your bouquet, immediately place it in a clean vase with fresh water. Trim about 2-3cm from the bottom of each stem at a 45-degree angle. Remove any leaves that would be submerged in water.",
    },
    {
        category: "products",
        question: "Do you offer custom bouquet arrangements?",
        answer: "Absolutely! We love creating unique arrangements. Please contact us directly via our 'Contact' page or phone number to discuss your specific needs, preferred flowers, and color palette with our florists.",
    },
    {
        category: "products",
        question: "Can I request specific flowers for my arrangement?",
        answer: "Yes, you can request specific flowers. However, availability may vary depending on the season. Our team will contact you if any substitutions are needed.",
    },
];

export default function FAQPage() {
    const [selectedCategory, setSelectedCategory] = useState("ordering");
    const [searchQuery, setSearchQuery] = useState("");
    const [openItems, setOpenItems] = useState<number[]>([0]);

    const filteredFaqs = faqs.filter((faq) => {
        const matchesCategory = faq.category === selectedCategory;
        const matchesSearch = searchQuery === "" ||
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const toggleItem = (index: number) => {
        setOpenItems((prev) =>
            prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
        );
    };

    return (
        <>
            <SEO
                title="FAQ - YenFlowers"
                description="Find answers to common questions about ordering, delivery, and flower care at YenFlowers."
            />

            <div className="min-h-screen bg-background">
                <main className="flex flex-1 justify-center py-10 sm:py-16 md:py-20">
                    <div className="flex w-full max-w-3xl flex-col gap-8 px-4">
                        {/* Page Heading */}
                        <div className="flex w-full flex-col gap-3 text-center">
                            <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] text-primary sm:text-5xl">
                                Frequently Asked Questions
                            </h1>
                            <p className="text-base font-normal leading-normal text-muted-foreground">
                                Find answers to common questions about ordering, delivery, and flower care.
                            </p>
                        </div>

                        {/* Search Bar */}
                        <div className="px-4 py-3">
                            <div className="flex h-14 w-full items-stretch rounded-xl shadow-sm">
                                <div className="flex items-center justify-center rounded-l-xl border-r-0 bg-white pl-4 text-muted-foreground dark:bg-card">
                                    <Search className="h-6 w-6" />
                                </div>
                                <Input
                                    className="h-full flex-1 rounded-l-none rounded-r-xl border-none bg-white text-base dark:bg-card"
                                    placeholder="What can we help you with?"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Category Chips */}
                        <div className="flex flex-wrap justify-center gap-2 p-3">
                            {faqCategories.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => setSelectedCategory(category.id)}
                                    className={`flex h-8 cursor-pointer items-center justify-center gap-x-2 rounded-lg px-4 text-sm transition-colors ${selectedCategory === category.id
                                            ? "bg-primary/20 font-bold text-primary"
                                            : "bg-muted font-medium text-foreground hover:bg-muted/80"
                                        }`}
                                >
                                    {category.label}
                                </button>
                            ))}
                        </div>

                        {/* Accordions */}
                        <div className="flex flex-col p-4">
                            {filteredFaqs.map((faq, index) => (
                                <div key={index} className="border-t border-black/10 py-2 dark:border-white/10">
                                    <button
                                        onClick={() => toggleItem(index)}
                                        className="flex w-full cursor-pointer items-center justify-between gap-6 py-4 text-left"
                                    >
                                        <p className="text-base font-medium leading-normal text-foreground">
                                            {faq.question}
                                        </p>
                                        <div
                                            className={`text-foreground transition-transform duration-300 ${openItems.includes(index) ? "rotate-180" : ""
                                                }`}
                                        >
                                            <ChevronDown className="h-5 w-5" />
                                        </div>
                                    </button>
                                    {openItems.includes(index) && (
                                        <p className="pb-4 pr-8 text-sm font-normal leading-relaxed text-muted-foreground">
                                            {faq.answer}
                                        </p>
                                    )}
                                </div>
                            ))}
                            <div className="border-b border-black/10 dark:border-white/10" />
                        </div>

                        {/* CTA */}
                        <div className="mt-8 flex flex-col items-center justify-center gap-4 rounded-xl bg-white p-8 text-center shadow-sm dark:bg-card">
                            <h3 className="text-2xl font-bold text-primary">Still have questions?</h3>
                            <p className="max-w-md text-muted-foreground">
                                Can't find the answer you're looking for? Our team is happy to help you with any inquiries.
                            </p>
                            <Link to="/contact">
                                <Button size="lg" className="mt-2 rounded-xl">
                                    Contact Us
                                </Button>
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
