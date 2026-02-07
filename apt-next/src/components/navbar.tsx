"use client";

import { Bell, Search, User, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export function Navbar() {
    const { user, login, logout } = useAuth();

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b glass px-6">
            {/* Search Bar */}
            <div className="relative w-96 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                    type="search"
                    placeholder="Search reports, boreholes..."
                    className="pl-10 bg-background/50 border-border/50 focus:bg-background transition-all"
                />
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon" className="relative hover:bg-accent/50">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-primary" />
                </Button>
                <div className="flex items-center space-x-3 pl-4 border-l border-border/50">
                    {user ? (
                        <>
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium leading-none">{user.displayName || "User"}</p>
                                <p className="text-xs text-muted-foreground mt-1">Authorized</p>
                            </div>
                            <Button onClick={() => logout()} variant="outline" size="icon" className="group relative rounded-full overflow-hidden border-2 border-primary/20">
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="Avatar" className="size-full object-cover" />
                                ) : (
                                    <User size={20} />
                                )}
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <LogOut size={16} className="text-white" />
                                </div>
                            </Button>
                        </>
                    ) : (
                        <Button onClick={() => login()} size="sm" className="bg-primary hover:bg-primary/90">
                            Sign In
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
}
