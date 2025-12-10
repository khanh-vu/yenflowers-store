import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SEO } from "@/components/SEO";

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        rememberMe: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Login:", formData);
    };

    return (
        <>
            <SEO
                title="Log In - YenFlowers"
                description="Sign in to your YenFlowers account."
            />

            <div className="flex min-h-screen">
                {/* Left Side - Image */}
                <div className="hidden items-center justify-center bg-background p-8 lg:flex lg:w-1/2">
                    <div className="h-full max-w-md overflow-hidden rounded-xl">
                        <img
                            src="https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=800"
                            alt="Beautiful flowers"
                            className="h-full w-full object-cover"
                        />
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="flex w-full flex-col justify-center bg-white px-4 py-12 dark:bg-card sm:px-6 lg:w-1/2 lg:px-8">
                    <div className="mx-auto w-full max-w-md">
                        {/* Header */}
                        <div className="mb-8 flex flex-col gap-3">
                            <h1 className="text-4xl font-black leading-tight tracking-[-0.033em]">
                                Welcome Back
                            </h1>
                            <p className="text-base text-muted-foreground">
                                Sign in to access your account and orders.
                            </p>
                        </div>

                        {/* Social Login */}
                        <div className="flex flex-col gap-3">
                            <Button
                                variant="outline"
                                className="w-full gap-2 rounded-xl"
                                type="button"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24">
                                    <path d="M22.578 12.245c0-.82-.07-1.62-.205-2.395H12v4.51h5.947c-.26 1.45-1.033 2.69-2.223 3.555v2.97h3.81c2.222-2.04 3.51-5.14 3.51-8.64z" fill="#4285F4" />
                                    <path d="M12 23c3.24 0 5.953-1.07 7.935-2.905l-3.81-2.97c-1.072.72-2.445 1.15-4.125 1.15-3.173 0-5.86-2.14-6.82-5.01H1.29v3.06C3.25 20.09 7.31 23 12 23z" fill="#34A853" />
                                    <path d="M5.18 13.24c-.18-.54-.28-1.12-.28-1.72s.1-1.18.28-1.72V6.74H1.29C.475 8.44 0 10.15 0 12s.475 3.56 1.29 5.26l3.89-3.02z" fill="#FBBC05" />
                                    <path d="M12 4.75c1.745 0 3.325.6 4.565 1.785l3.38-3.38C17.953 1.16 15.24 0 12 0 7.31 0 3.25 2.91 1.29 6.74l3.89 3.02c.96-2.87 3.647-5.01 6.82-5.01z" fill="#EA4335" />
                                </svg>
                                Continue with Google
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full gap-2 rounded-xl"
                                type="button"
                            >
                                <svg className="h-5 w-5" fill="#1877F2" viewBox="0 0 24 24">
                                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
                                </svg>
                                Continue with Facebook
                            </Button>
                        </div>

                        {/* Divider */}
                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-black/10 dark:border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-white px-2 text-muted-foreground dark:bg-card">or</span>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <Label htmlFor="email" className="mb-2 block">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    className="rounded-lg"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label htmlFor="password" className="mb-2 block">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="rounded-lg pr-10"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="remember"
                                        checked={formData.rememberMe}
                                        onCheckedChange={(checked) => setFormData({ ...formData, rememberMe: checked as boolean })}
                                    />
                                    <Label htmlFor="remember" className="text-sm">Remember me</Label>
                                </div>
                                <Link to="/forgot-password" className="text-sm font-medium text-primary hover:text-primary/80">
                                    Forgot password?
                                </Link>
                            </div>

                            <Button type="submit" className="w-full rounded-xl">
                                Log In
                            </Button>
                        </form>

                        {/* Footer Links */}
                        <div className="mt-6 text-center">
                            <p className="text-sm text-muted-foreground">
                                Don't have an account?{" "}
                                <Link to="/register" className="font-bold text-primary hover:text-primary/80">
                                    Sign up
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
