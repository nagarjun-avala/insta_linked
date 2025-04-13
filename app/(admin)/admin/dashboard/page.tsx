"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NavBar from "@/components/nav-bar";
import UserGrowthChart from "@/components/charts/user-growth-chart";
import EngagementChart from "@/components/charts/engagement-chart";
import ContentDistributionChart from "@/components/charts/content-distribution-chart";
import {
  Loader2,
  Users,
  Image as LucideImage,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

type DashboardStats = {
  totalUsers: number;
  newUsersToday: number;
  totalPosts: number;
  newPostsToday: number;
  totalComments: number;
  totalLikes: number;
  reportedContent: number;
  userGrowthData: {
    labels: string[];
    data: number[];
  };
  engagementData: {
    posts: number[];
    comments: number[];
    likes: number[];
    labels: string[];
  };
  contentDistribution: {
    labels: string[];
    data: number[];
  };
};

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await fetch("/api/admin/dashboard-stats");
        if (!response.ok) {
          throw new Error("Failed to fetch dashboard stats");
        }
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user.role === "ADMIN") {
      fetchDashboardStats();
    }
  }, [session]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (status === "unauthenticated" || session?.user.role !== "ADMIN") {
    redirect("/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar />

      <main className="container mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Admin Dashboard
          </h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-blue-500 mr-2" />
                    <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    +{stats.newUsersToday} today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Posts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <LucideImage className="h-4 w-4 text-green-500 mr-2" />
                    <div className="text-2xl font-bold">{stats.totalPosts}</div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    +{stats.newPostsToday} today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Engagement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 text-purple-500 mr-2" />
                    <div className="text-2xl font-bold">
                      {stats.totalComments + stats.totalLikes}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.totalComments} comments, {stats.totalLikes} likes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Reported Content
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                    <div className="text-2xl font-bold">
                      {stats.reportedContent}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Needs review
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="growth">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="growth">User Growth</TabsTrigger>
                <TabsTrigger value="engagement">Engagement</TabsTrigger>
                <TabsTrigger value="content">Content Distribution</TabsTrigger>
              </TabsList>

              <TabsContent value="growth" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>User Growth</CardTitle>
                    <CardDescription>
                      New user registrations over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <UserGrowthChart data={stats.userGrowthData} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="engagement" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Platform Engagement</CardTitle>
                    <CardDescription>
                      Posts, comments, and likes over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <EngagementChart data={stats.engagementData} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="content" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Content Distribution</CardTitle>
                    <CardDescription>
                      Breakdown of content types across the platform
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <ContentDistributionChart
                      data={stats.contentDistribution}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
              Error loading dashboard data
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Please try refreshing the page
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
