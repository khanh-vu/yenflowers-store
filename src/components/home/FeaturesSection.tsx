
import { Flower, Palette, Truck } from "lucide-react";

const features = [
    {
        icon: Flower,
        title: "Fresh Daily",
        description: "We source the freshest blooms every morning from local farms to ensure long-lasting beauty."
    },
    {
        icon: Palette,
        title: "Handcrafted in HCMC",
        description: "Each bouquet is a unique work of art, thoughtfully designed by our skilled florists in Saigon."
    },
    {
        icon: Truck,
        title: "Same-Day Delivery",
        description: "Need flowers now? We offer reliable same-day delivery across Ho Chi Minh City."
    }
];

export function FeaturesSection() {
    return (
        <section className="px-4 pb-10 sm:px-6 md:px-8 lg:px-10">
            <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-3">
                {features.map((feature, idx) => (
                    <div
                        key={idx}
                        className="flex flex-col items-center gap-4 rounded-xl border border-black/10 bg-white p-8 text-center dark:border-white/10 dark:bg-card"
                    >
                        <feature.icon className="h-9 w-9 text-primary" />
                        <h3 className="text-lg font-bold text-foreground">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">
                            {feature.description}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}
