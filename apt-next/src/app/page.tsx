"use client";

import { Uploader } from "@/components/uploader";
import { RecentActivity } from "@/components/recent-activity";
import {
  Users,
  Database,
  Activity,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Monitor your geotechnical data parsing and reporting status.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Reports"
          value="1,284"
          desc="+12% from last month"
          icon={Database}
          trend="up"
        />
        <StatCard
          title="Active Boreholes"
          value="48"
          desc="Across 6 sites"
          icon={Activity}
        />
        <StatCard
          title="Team Members"
          value="12"
          desc="3 rigs active"
          icon={Users}
        />
        <StatCard
          title="Pending Sync"
          value="5"
          desc="Required attention"
          icon={Clock}
          trend="warning"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Main Feed */}
        <div className="lg:col-span-4">
          <RecentActivity />
        </div>

        {/* Uploader Section */}
        <div className="lg:col-span-3">
          <Uploader />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, desc, icon: Icon, trend }: any) {
  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className={cn(
          "text-xs mt-1",
          trend === "up" ? "text-green-500" : trend === "warning" ? "text-yellow-500" : "text-muted-foreground"
        )}>
          {desc}
        </p>
      </CardContent>
    </Card>
  );
}
