"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NavBar from "@/components/nav-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Search, Loader2, UserCheck } from "lucide-react";
import { User, Post } from "@/types";
import Link from "next/link";

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get("q") || "";
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState("users");

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const performSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    
    try {
      // Perform combined search by default
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=all`);

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      
      setUsers(data.users || []);
      setPosts(data.posts || []);
      
      // Update URL with search query
      router.push(`/search?q=${encodeURIComponent(query)}`, { scroll: false });
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar />
      
      <main className="container mx-auto py-6 px-4 max-w-4xl">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Search</h1>
        
        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search for people, posts, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={isSearching}>
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Search
          </Button>
        </form>

        {searchQuery && !isSearching && (
          <>
            <Tabs defaultValue="users" className="mb-6" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="users">People ({users.length})</TabsTrigger>
                <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="users" className="mt-4">
                {users.length > 0 ? (
                  <div className="space-y-4">
                    {users.map((user) => (
                      <Link href={`/profile/${user.id}`} key={user.id}>
                        <Card className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <CardContent className="p-4 flex items-center">
                            <Avatar className="h-12 w-12 mr-4">
                              {user.image ? (
                                <img 
                                  src={user.image} 
                                  alt={user.name} 
                                  className="h-12 w-12 rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                  <span className="text-blue-700 dark:text-blue-300 font-bold">
                                    {user.name.substring(0, 2).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </Avatar>
                            <div className="flex-1">
                              <h3 className="font-medium">{user.name}</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {user.headline || user.bio?.substring(0, 60) || ''}
                              </p>
                            </div>
                            {user.isConnected && (
                              <UserCheck className="h-5 w-5 text-green-500 ml-2" />
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No users found matching "{searchQuery}"</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="posts" className="mt-4">
                {posts.length > 0 ? (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <Link href={`/post/${post.id}`} key={post.id}>
                        <Card className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-center mb-3">
                              <Avatar className="h-8 w-8 mr-2">
                                {post.author.image ? (
                                  <img 
                                    src={post.author.image} 
                                    alt={post.author.name} 
                                    className="h-8 w-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                    <span className="text-blue-700 dark:text-blue-300 font-bold text-xs">
                                      {post.author.name.substring(0, 2).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{post.author.name}</p>
                                <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                            
                            <h3 className="font-bold text-lg mb-2">{post.title}</h3>
                            <p className="text-gray-600 dark:text-gray-300 line-clamp-2">
                              {post.content}
                            </p>
                            
                            <div className="mt-3 text-sm text-gray-500 flex items-center gap-4">
                              <span>{post.likes} likes</span>
                              <span>{post.comments} comments</span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No posts found matching "{searchQuery}"</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
        
        {isSearching && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        )}

        {!searchQuery && !isSearching && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Search for people or content</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Find professionals, friends, posts and more
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
