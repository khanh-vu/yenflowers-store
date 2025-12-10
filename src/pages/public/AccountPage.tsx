import { useState } from "react";
import { LayoutDashboard, Receipt, Heart, User, Home, Settings, LogOut, Plus, Pencil, Trash2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/SEO";

const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", active: false },
    { icon: Receipt, label: "Order History", active: false },
    { icon: Heart, label: "Wishlist", active: false },
    { icon: User, label: "My Profile", active: false },
    { icon: Home, label: "Address Book", active: true },
];

const addresses = [
    {
        id: "1",
        type: "Shipping Address",
        isDefault: true,
        name: "Jane Doe",
        address: "123 Duong Le Loi, Phuong Ben Nghe",
        city: "Quan 1, Ho Chi Minh City, 700000",
        country: "Vietnam",
        phone: "+84 123 456 789",
    },
    {
        id: "2",
        type: "Billing Address",
        isDefault: false,
        name: "Jane Doe",
        address: "123 Duong Le Loi, Phuong Ben Nghe",
        city: "Quan 1, Ho Chi Minh City, 700000",
        country: "Vietnam",
        phone: "+84 123 456 789",
    },
    {
        id: "3",
        type: "Work Address",
        isDefault: false,
        name: "Jane Doe",
        address: "456 Duong Nguyen Hue, Phuong Ben Nghe",
        city: "Quan 1, Ho Chi Minh City, 700000",
        country: "Vietnam",
        phone: "+84 987 654 321",
    },
];

export default function AccountPage() {
    const [activeMenu, setActiveMenu] = useState("Address Book");

    return (
        <>
            <SEO
                title="My Account - YenFlowers"
                description="Manage your account, addresses, and order history."
            />

            <div className="min-h-screen bg-background">
                <div className="flex flex-1">
                    {/* Sidebar */}
                    <aside className="hidden w-64 shrink-0 p-6 lg:block">
                        <div className="flex min-h-[700px] flex-col justify-between rounded-xl bg-white p-4 dark:bg-card">
                            {/* User Info */}
                            <div className="flex flex-col gap-4">
                                <div className="flex gap-3">
                                    <div className="size-10 overflow-hidden rounded-full bg-primary/20">
                                        <img
                                            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100"
                                            alt="User"
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <h1 className="text-base font-medium">Jane Doe</h1>
                                        <p className="text-sm text-muted-foreground">jane.doe@email.com</p>
                                    </div>
                                </div>

                                {/* Menu */}
                                <div className="flex flex-col gap-2">
                                    {menuItems.map((item) => (
                                        <button
                                            key={item.label}
                                            onClick={() => setActiveMenu(item.label)}
                                            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${activeMenu === item.label
                                                ? "bg-primary/20 text-foreground"
                                                : "text-muted-foreground hover:bg-primary/10"
                                                }`}
                                        >
                                            <item.icon className="h-5 w-5" />
                                            <span className="text-sm font-medium">{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Bottom Section */}
                            <div className="flex flex-col gap-4">
                                <div className="border-t border-black/10 pt-4 dark:border-white/10">
                                    <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-primary/10">
                                        <Settings className="h-5 w-5" />
                                        <span className="text-sm font-medium">Preferences</span>
                                    </button>
                                </div>
                                <Button className="w-full rounded-lg">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Log Out
                                </Button>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <div className="flex-1 p-6">
                        <div className="flex flex-col gap-6">
                            {/* Header */}
                            <div className="flex flex-wrap items-center justify-between gap-4 p-4">
                                <div className="flex min-w-72 flex-col gap-2">
                                    <h1 className="text-4xl font-black leading-tight tracking-[-0.033em]">
                                        Address Management
                                    </h1>
                                    <p className="text-base text-muted-foreground">
                                        Manage your shipping and billing addresses for a faster checkout experience.
                                    </p>
                                </div>
                                <Button className="gap-2 rounded-lg">
                                    <Plus className="h-5 w-5" />
                                    Add New Address
                                </Button>
                            </div>

                            {/* Address Cards */}
                            <div className="flex flex-col gap-6 p-4">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    {addresses.map((address) => (
                                        <div
                                            key={address.id}
                                            className="flex flex-col gap-4 rounded-xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-card"
                                        >
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-lg font-bold">{address.type}</h3>
                                                {address.isDefault && (
                                                    <Badge className="bg-primary/20 text-primary">Default</Badge>
                                                )}
                                            </div>
                                            <div className="space-y-1 text-sm text-muted-foreground">
                                                <p className="font-medium text-foreground">{address.name}</p>
                                                <p>{address.address}</p>
                                                <p>{address.city}</p>
                                                <p>{address.country}</p>
                                                <p>{address.phone}</p>
                                            </div>
                                            <div className="flex items-center gap-4 pt-2">
                                                <button className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80">
                                                    <Pencil className="h-4 w-4" />
                                                    Edit
                                                </button>
                                                <button className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-500">
                                                    <Trash2 className="h-4 w-4" />
                                                    Delete
                                                </button>
                                                {!address.isDefault && (
                                                    <button className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                                                        <CheckCircle className="h-4 w-4" />
                                                        Set as Default
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
