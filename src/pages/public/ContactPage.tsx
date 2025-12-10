import { useState } from "react";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SEO } from "@/components/SEO";

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        message: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Contact form submitted:", formData);
        // TODO: Handle form submission
    };

    return (
        <>
            <SEO
                title="Contact Us - YenFlowers"
                description="Get in touch with YenFlowers. We'd love to hear from you about our flower arrangements."
            />

            <div className="min-h-screen bg-background">
                {/* Header */}
                <section className="px-4 py-16 sm:px-6 md:px-8 lg:px-20">
                    <div className="mx-auto max-w-2xl text-center">
                        <h1 className="text-4xl font-black leading-tight tracking-tighter text-primary md:text-5xl">
                            Get in Touch
                        </h1>
                        <p className="mt-4 text-base text-muted-foreground md:text-lg">
                            We'd love to hear from you. Whether you have a question about our arrangements,
                            pricing, or anything else, our team is ready to answer all your questions.
                        </p>
                    </div>
                </section>

                {/* Main Content */}
                <section className="px-4 pb-16 sm:px-6 md:px-8 lg:px-20">
                    <div className="mx-auto max-w-7xl">
                        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-16">
                            {/* Contact Form */}
                            <div className="rounded-xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-card">
                                <h3 className="mb-6 text-2xl font-bold text-primary">Send Us a Message</h3>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input
                                            id="name"
                                            placeholder="Your full name"
                                            className="mt-2"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            className="mt-2"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="phone">Phone Number (Optional)</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            placeholder="+84 ..."
                                            className="mt-2"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="message">Your Message</Label>
                                        <Textarea
                                            id="message"
                                            placeholder="How can we help you?"
                                            rows={4}
                                            className="mt-2"
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        />
                                    </div>
                                    <Button type="submit" className="w-full rounded-lg">
                                        Send Message
                                    </Button>
                                </form>
                            </div>

                            {/* Contact Info */}
                            <div className="flex flex-col gap-10">
                                {/* Contact Details */}
                                <div className="flex flex-col gap-6">
                                    <div className="flex items-start gap-4">
                                        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
                                            <MapPin className="h-5 w-5" />
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <p className="text-base font-bold text-primary">Our Boutique</p>
                                            <p className="text-base text-muted-foreground">
                                                123 Floral Avenue, District 1, Ho Chi Minh City, Vietnam
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
                                            <Phone className="h-5 w-5" />
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <p className="text-base font-bold text-primary">Phone</p>
                                            <a href="tel:+84123456789" className="text-base text-muted-foreground hover:text-primary">
                                                +84 123 456 789
                                            </a>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
                                            <Mail className="h-5 w-5" />
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <p className="text-base font-bold text-primary">Email</p>
                                            <a href="mailto:hello@yenflowers.vn" className="text-base text-muted-foreground hover:text-primary">
                                                hello@yenflowers.vn
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                {/* Map */}
                                <div className="aspect-video w-full overflow-hidden rounded-xl border border-black/10 shadow-lg dark:border-white/10">
                                    <iframe
                                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.447915033877!2d106.7001483152664!3d10.776989462199999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f4400a9a46b%3A0x2a2a4b8e2ed8d5b!2sHo%20Chi%20Minh%20City%20Hall!5e0!3m2!1sen!2sus!4v1678886400000"
                                        className="h-full w-full"
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                    />
                                </div>

                                {/* Business Hours */}
                                <div className="rounded-xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-card">
                                    <div className="mb-4 flex items-center gap-4">
                                        <Clock className="h-8 w-8 text-primary" />
                                        <h3 className="text-2xl font-bold text-primary">Business Hours</h3>
                                    </div>
                                    <div className="space-y-3 text-muted-foreground">
                                        <div className="flex items-center justify-between text-base">
                                            <span>Monday - Friday</span>
                                            <span className="font-medium text-foreground">9:00 AM - 7:00 PM</span>
                                        </div>
                                        <div className="w-full border-t border-dashed border-black/10 dark:border-white/10" />
                                        <div className="flex items-center justify-between text-base">
                                            <span>Saturday</span>
                                            <span className="font-medium text-foreground">10:00 AM - 6:00 PM</span>
                                        </div>
                                        <div className="w-full border-t border-dashed border-black/10 dark:border-white/10" />
                                        <div className="flex items-center justify-between text-base">
                                            <span>Sunday</span>
                                            <span className="font-medium text-foreground">Closed</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}
