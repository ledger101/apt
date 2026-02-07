"use client";

import { useState, useCallback } from "react";
import { Upload, File, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ExcelParser } from "@/lib/logic/excel-parser";
import { useUploadStore } from "@/lib/store/use-upload-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { firestoreService } from "@/lib/firestore-service";
import { useAuth } from "@/lib/auth-context";

export function Uploader() {
    const [isDragging, setIsDragging] = useState(false);
    const [saving, setSaving] = useState(false);
    const { user } = useAuth();
    const { uploading, progress, result, error, setUploading, setProgress, setResult, setError, reset } = useUploadStore();

    const handleFile = async (file: File) => {
        if (!file.name.endsWith('.xlsx')) {
            setError("Please upload a valid Excel file (.xlsx)");
            return;
        }

        setUploading(true);
        setError(null);
        setProgress(10);

        try {
            const parser = new ExcelParser();
            setProgress(30);

            const parseResult = await parser.parseFile(file);
            setProgress(90);

            if (!parseResult.validation.isValid) {
                setError(parseResult.validation.errors.join(", "));
                return;
            }

            setResult(parseResult);
            setProgress(100);
        } catch (err) {
            console.error("Parse error:", err);
            setError("Failed to parse data. Please ensure the template is correct.");
        } finally {
            setTimeout(() => setUploading(false), 500);
        }
    };

    const handleSave = async () => {
        if (!result) return;
        setSaving(true);
        try {
            if (result.type === 'progress_report') {
                await firestoreService.saveReport({
                    ...result.data,
                    createdBy: user?.uid || 'anonymous'
                });
            } else {
                await firestoreService.saveBoreholeData(result.site, result.borehole, result.data);
                await firestoreService.saveSeriesData(result.site.siteId, result.borehole.boreholeNo, result.series);
                await firestoreService.saveQualityData(result.site.siteId, result.borehole.boreholeNo, result.quality);
            }
            reset();
            alert("Successfully saved to Firestore!");
        } catch (err) {
            console.error("Save error:", err);
            setError("Failed to save to Firestore.");
        } finally {
            setSaving(false);
        }
    };

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, []);

    return (
        <Card className="glass-card overflow-hidden">
            <CardHeader>
                <CardTitle className="text-xl">Import Data</CardTitle>
                <CardDescription>
                    Drag and drop your report or discharge test templates here.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {!result && !uploading && (
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={onDrop}
                        className={cn(
                            "relative flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-xl transition-all duration-300",
                            isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border/50 hover:border-primary/50 hover:bg-accent/5"
                        )}
                    >
                        <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                            accept=".xlsx"
                        />
                        <div className="flex flex-col items-center text-center px-6">
                            <div className="p-4 rounded-full bg-primary/10 mb-4 text-primary">
                                <Upload size={32} />
                            </div>
                            <p className="text-lg font-medium">Click or drag to upload</p>
                            <p className="text-sm text-muted-foreground mt-1">Excel (.xlsx) templates only</p>
                        </div>
                    </div>
                )}

                {uploading && (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4 animate-in fade-in duration-300">
                        <Loader2 className="size-10 text-primary animate-spin" />
                        <div className="w-full max-w-xs space-y-2 text-center">
                            <p className="text-sm font-medium">Parsing Excel logic...</p>
                            <Progress value={progress} className="h-2" />
                        </div>
                    </div>
                )}

                {error && (
                    <Alert variant="destructive" className="animate-in slide-in-from-top-2 duration-300">
                        <AlertCircle className="size-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                        <Button variant="ghost" size="sm" onClick={reset} className="mt-2 h-8">Try Again</Button>
                    </Alert>
                )}

                {result && (
                    <div className="flex flex-col items-center justify-center py-8 space-y-6 animate-in zoom-in-95 duration-500">
                        <div className="p-4 rounded-full bg-green-500/10 text-green-500">
                            <CheckCircle2 size={48} />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-semibold">Success! Data Extracted</h3>
                            <p className="text-muted-foreground mt-1">
                                Detected: <span className="text-foreground font-medium uppercase">{result.type.replace('_', ' ')}</span>
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full">
                            <Card className="bg-accent/5 border-none shadow-none p-4">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Points Scanned</p>
                                <p className="text-2xl font-bold mt-1">{(result as any).series?.reduce((acc: number, s: any) => acc + s.points.length, 0) || 0}</p>
                            </Card>
                            <Card className="bg-accent/5 border-none shadow-none p-4">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Validation Status</p>
                                <p className="text-2xl font-bold mt-1 text-green-500">Clean</p>
                            </Card>
                        </div>

                        <div className="flex space-x-3 w-full">
                            <Button onClick={reset} variant="outline" className="flex-1" disabled={saving}>Clear</Button>
                            <Button className="flex-1" onClick={handleSave} disabled={saving}>
                                {saving ? <Loader2 className="animate-spin size-4 mr-2" /> : null}
                                {saving ? "Saving..." : "Save to Firestore"}
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// Sub-components for Alert
function Alert({ children, className, variant }: any) {
    return (
        <div className={cn(
            "p-4 rounded-lg flex items-start space-x-3",
            variant === "destructive" ? "bg-destructive/10 text-destructive border border-destructive/20" : "bg-accent text-accent-foreground",
            className
        )}>
            {children}
        </div>
    );
}
function AlertTitle({ children, className }: any) {
    return <h5 className={cn("font-semibold leading-none tracking-tight mb-1", className)}>{children}</h5>;
}
function AlertDescription({ children, className }: any) {
    return <div className={cn("text-sm opacity-90", className)}>{children}</div>;
}
