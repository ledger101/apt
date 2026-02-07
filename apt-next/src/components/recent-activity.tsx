"use client";

import { useEffect, useState } from "react";
import { Database, ArrowUpRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { firestoreService } from "@/lib/firestore-service";
import { Report } from "@/types";

export function RecentActivity() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchActivity() {
            try {
                const recent = await firestoreService.getRecentReports(5);
                setReports(recent);
            } catch (err) {
                console.error("Failed to fetch activity:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchActivity();
    }, []);

    return (
        <Card className="lg:col-span-4 glass-card">
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest parsing jobs and data uploads.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="animate-spin text-primary" />
                    </div>
                ) : reports.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No recent activity found.</p>
                ) : (
                    <div className="space-y-4">
                        {reports.map((report) => (
                            <div key={report.reportId} className="flex items-center p-4 rounded-lg bg-accent/5 border border-border/50 hover:bg-accent/10 transition-colors cursor-pointer group">
                                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-4">
                                    <Database size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">{report.projectSiteArea || "Unknown Site"}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {report.status} • {new Date(report.reportDate as any).toLocaleDateString()}
                                    </p>
                                </div>
                                <ArrowUpRight className="text-muted-foreground size-5 group-hover:text-primary transition-colors" />
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
