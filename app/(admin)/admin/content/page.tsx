"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NavBar from "@/components/nav-bar";
import { Post } from "@/types";
import { Loader2, MoreVertical, Search, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

type ReportedContent = Post & {
  reportCount: number;
  reportReason: string;
  lastReportDate: string;
};

export default function AdminContentPage() {
  const { data: session, status } = useSession();
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [reportedContent, setReportedContent] = useState<ReportedContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [contentToModify, setContentToModify] = useState<Post | ReportedContent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "delete" | "view" | null>(null);
  const [activeTab, setActiveTab] = useState("recent");

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const [recentResponse, reportedResponse] = await Promise.all([
          fetch("/api/posts?limit=20"),
          fetch("/api/admin/reported-content")
        ]);

        if (!recentResponse.ok || !reportedResponse.ok) {
          throw new Error("Failed to fetch content");
        }

        const recentData = await recentResponse.json();
        const reportedData = await reportedResponse.json();

        setRecentPosts(recentData);
        setReportedContent(reportedData);
      } catch (error) {
        console.error("Error fetching content:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user.role === "ADMIN") {
      fetchContent();
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

  const filteredContent = searchQuery
    ? (activeTab === "recent" 
        ? recentPosts.filter(post => 
            post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
            post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.author.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : reportedContent.filter(post => 
            post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
            post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.reportReason.toLowerCase().includes(searchQuery.toLowerCase())))
    : (activeTab === "recent" ? recentPosts : reportedContent);

  const handleAction = (content: Post | ReportedContent, action: "approve" | "delete" | "view") => {
    setContentToModify(content);
    setActionType(action);
    setIsDialogOpen(true);
  };

  const confirmAction = async () => {
    if (!contentToModify || !actionType) return;

    try {
      if (actionType === "view") {
        // Just close the dialog, no action needed
        setIsDialogOpen(false);
        setContentToModify(null);
        setActionType(null);
        return;
      }

      let endpoint = "";
      let method = "POST";
      
      // Check if it's a ReportedContent with reportId
      const isReportedContent = 'reportId' in contentToModify;
      
      switch (actionType) {
        case "approve":
          if (isReportedContent) {
            endpoint = `/api/admin/reported-content/${(contentToModify as ReportedContent).reportId}`;
            method = "PATCH";
          } else {
            // This shouldn't happen, but fallback
            endpoint = `/api/posts/${contentToModify.id}/report`;
            method = "PATCH";
          }
          break;
        case "delete":
          endpoint = `/api/posts/${contentToModify.id}`;
          method = "DELETE";
          break;
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to ${actionType} content`);
      }

      // Update local state
      if (actionType === "delete") {
        setRecentPosts(recentPosts.filter(post => post.id !== contentToModify.id));
        setReportedContent(reportedContent.filter(post => post.id !== contentToModify.id));
      } else if (actionType === "approve") {
        // Remove from reported content
        setReportedContent(reportedContent.filter(post => post.id !== contentToModify.id));
      }
      
      setIsDialogOpen(false);
      setContentToModify(null);
      setActionType(null);
    } catch (error) {
      console.error(`Error during ${actionType} action:`, error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar />
      
      <main className="container mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Content Moderation</h1>
        </div>

        <Tabs 
          defaultValue="recent" 
          className="w-full"
          onValueChange={setActiveTab}
        >
          <div className="flex justify-between items-center mb-6">
            <TabsList>
              <TabsTrigger value="recent">Recent Content</TabsTrigger>
              <TabsTrigger value="reported">
                Reported Content
                {reportedContent.length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {reportedContent.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder={`Search ${activeTab === "recent" ? "content" : "reported content"}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <TabsContent value="recent">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : filteredContent.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Posted</TableHead>
                        <TableHead>Engagement</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContent.map((post) => (
                        <TableRow key={post.id}>
                          <TableCell className="font-medium">
                            <div className="max-w-xs truncate">{post.title}</div>
                          </TableCell>
                          <TableCell>{post.author.name}</TableCell>
                          <TableCell className="capitalize">{post.type}</TableCell>
                          <TableCell>{new Date(post.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {post.likes} likes · {post.comments} comments
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleAction(post, "view")}
                                >
                                  View Content
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleAction(post, "delete")}
                                  className="text-red-600"
                                >
                                  Delete Content
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">No content found</h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">
                    {searchQuery ? "Try adjusting your search query" : "No recent content to display"}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="reported">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : filteredContent.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Content</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>
                          <div className="flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-1 text-amber-500" />
                            Reports
                          </div>
                        </TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Last Reported</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(filteredContent as ReportedContent[]).map((content) => (
                        <TableRow key={content.id}>
                          <TableCell className="font-medium">
                            <div className="max-w-xs truncate">{content.title}</div>
                          </TableCell>
                          <TableCell>{content.author.name}</TableCell>
                          <TableCell>{content.reportCount}</TableCell>
                          <TableCell>
                            <div className="max-w-xs truncate">{content.reportReason}</div>
                          </TableCell>
                          <TableCell>{new Date(content.lastReportDate).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleAction(content, "view")}
                                >
                                  View Content
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleAction(content, "approve")}
                                  className="text-green-600"
                                >
                                  Approve Content
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleAction(content, "delete")}
                                  className="text-red-600"
                                >
                                  Delete Content
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
                    {searchQuery 
                      ? "No reported content matches your search" 
                      : "No reported content"}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">
                    {searchQuery 
                      ? "Try adjusting your search query" 
                      : "All content has been reviewed"}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" 
                ? "Approve Content"
                : actionType === "delete"
                ? "Delete Content"
                : "View Content"}
            </DialogTitle>
            {actionType !== "view" && (
              <DialogDescription>
                {actionType === "approve" 
                  ? "This will mark the content as reviewed and remove all reports."
                  : "This will permanently delete the content from the platform."}
              </DialogDescription>
            )}
          </DialogHeader>

          {contentToModify && (
            <div className="mt-2 max-h-96 overflow-y-auto">
              <h3 className="font-bold text-lg mb-1">{contentToModify.title}</h3>
              <p className="text-sm text-gray-500 mb-4">
                By {contentToModify.author.name} - {new Date(contentToModify.createdAt).toLocaleDateString()}
              </p>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line">
                  {contentToModify.content}
                </p>
                {contentToModify.imageUrl && (
                  <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-md p-1">
                    <p className="text-blue-500 text-sm">[Image attached]</p>
                  </div>
                )}
              </div>

              {"reportReason" in contentToModify && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
                  <h4 className="text-red-600 dark:text-red-400 font-medium flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" /> 
                    Reported {contentToModify.reportCount} times
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    <span className="font-medium">Latest reason:</span> {contentToModify.reportReason}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {actionType === "view" ? (
              <Button onClick={() => setIsDialogOpen(false)}>
                Close
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  variant={actionType === "delete" ? "destructive" : "default"}
                  onClick={confirmAction}
                  className={actionType === "approve" ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  {actionType === "approve" ? (
                    <span className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" /> Approve
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <XCircle className="h-4 w-4 mr-1" /> Delete
                    </span>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
