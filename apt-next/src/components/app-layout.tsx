"use client";

import { Sidebar } from "@/components/sidebar";
import { Navbar } from "@/components/navbar";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function AppLayout({ children }: { children: React.ReactNode }) {
    // We can't easily sync state between Sidebar and this wrapper without a shared state
    // But for now, we'll assume a fixed width margin or use a context if we want it dynamic.
    // Using a simpler approach: fixed sidebar space for non-collapsed state.

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <Sidebar />
            <div className="flex flex-col flex-1 pl-64 transition-all duration-300 ease-in-out">
                <Navbar />
                <main className="flex-1 p-6 overflow-y-auto">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
