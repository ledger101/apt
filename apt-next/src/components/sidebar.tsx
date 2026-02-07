import Link from "next/link";
import {
    LayoutDashboard,
    Upload,
    FileText,
    Settings,
    ChevronLeft,
    ChevronRight,
    Database,
    Users,
    Truck,
    Wrench
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { name: "Upload Data", icon: Upload, href: "/upload" },
    { name: "Reports", icon: FileText, href: "/reports" },
    { name: "Sites & Boreholes", icon: Database, href: "/sites" },
    { name: "Personnel", icon: Users, href: "/personnel" },
    { name: "Vehicles & Rigs", icon: Truck, href: "/assets" },
    { name: "Maintenance", icon: Wrench, href: "/maintenance" },
];

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out border-r glass",
                collapsed ? "w-20" : "w-64"
            )}
        >
            <div className="flex flex-col h-full py-4 px-3">
                {/* Logo */}
                <div className="flex items-center justify-between mb-8 px-2">
                    {!collapsed && (
                        <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                            APT Admin
                        </span>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCollapsed(!collapsed)}
                        className="hover:bg-accent/50"
                    >
                        {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                    </Button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1">
                    {menuItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center p-3 rounded-lg text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-accent-foreground group",
                                collapsed ? "justify-center" : ""
                            )}
                        >
                            <item.icon className={cn("shrink-0", collapsed ? "size-6" : "size-5 mr-3")} />
                            {!collapsed && (
                                <span className="font-medium">{item.name}</span>
                            )}
                            {collapsed && (
                                <div className="fixed left-24 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border shadow-md">
                                    {item.name}
                                </div>
                            )}
                        </Link>
                    ))}
                </nav>

                {/* Bottom Actions */}
                <div className="mt-auto pt-4 border-t border-border/50">
                    <Link
                        href="/settings"
                        className={cn(
                            "flex items-center p-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all",
                            collapsed ? "justify-center" : ""
                        )}
                    >
                        <Settings className={cn("shrink-0", collapsed ? "size-6" : "size-5 mr-3")} />
                        {!collapsed && <span className="font-medium">Settings</span>}
                    </Link>
                </div>
            </div>
        </aside>
    );
}
