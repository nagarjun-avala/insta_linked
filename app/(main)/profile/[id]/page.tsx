"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import NavBar from "@/components/nav-bar";
import ProfileHeader from "@/components/profile-header";
import PostCard from "@/components/post-card";
import { Loader2, BriefcaseBusiness, Image, Users, Settings } from "lucide-react";
import { User, Post } from "@/types";

export default function ProfilePage() {
  const params = useParams();
  const { data: session } = useSession();
  const userId = params.id as string;
  const isCurrentUser = session?.user?.id === userId;

  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const [userResponse, postsResponse] = await Promise.all([
          fetch(`/api/users/${userId}`),
          fetch(`/api/users/${userId}/posts`)
        ]);

        if (!userResponse.ok || !postsResponse.ok) {
          throw new Error("Failed to fetch profile data");
        }

        const userData = await userResponse.json();
        const postsData = await postsResponse.json();

        setUser(userData);
        setPosts(postsData);
        
        // Check if current user is following this profile
        if (session?.user) {
          const followResponse = await fetch(`/api/users/${session.user.id}/following/${userId}`);
          setIsFollowing(followResponse.ok && (await followResponse.json()).isFollowing);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchProfileData();
    }
  }, [userId, session]);

  const handleFollow = async () => {
    if (!session?.user) return;
    
    try {
      const response = await fetch(`/api/users/${session.user.id}/follow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetUserId: userId }),
      });

      if (!response.ok) {
        throw new Error("Failed to follow user");
      }

      setIsFollowing(true);
    } catch (error) {
      console.error("Error following user:", error);
    }
  };

  const handleUnfollow = async () => {
    if (!session?.user) return;
    
    try {
      const response = await fetch(`/api/users/${session.user.id}/unfollow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetUserId: userId }),
      });

      if (!response.ok) {
        throw new Error("Failed to unfollow user");
      }

      setIsFollowing(false);
    } catch (error) {
      console.error("Error unfollowing user:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavBar />
        <div className="flex justify-center items-center h-[calc(100vh-64px)]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavBar />
        <div className="container mx-auto py-12 px-4 text-center">
          <h1 className="text-2xl font-bold text-red-500">User Not Found</h1>
          <p className="mt-4 text-gray-600 dark:text-gray-400">The user you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar />
      
      <main className="container mx-auto py-6 px-4 max-w-4xl">
        <ProfileHeader 
          user={user}
          isCurrentUser={isCurrentUser}
          isFollowing={isFollowing}
          onFollow={handleFollow}
          onUnfollow={handleUnfollow}
        />

        <div className="mt-8">
          <Tabs defaultValue="posts">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="posts" className="flex items-center gap-2">
                <Image className="h-4 w-4" /> Posts
              </TabsTrigger>
              <TabsTrigger value="professional" className="flex items-center gap-2">
                <BriefcaseBusiness className="h-4 w-4" /> Professional
              </TabsTrigger>
              <TabsTrigger value="connections" className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Connections
              </TabsTrigger>
              {isCurrentUser && (
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" /> Settings
                </TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="posts" className="profile-tabs-content">
              {posts.length > 0 ? (
                <div className="space-y-6 mt-4">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">No posts yet</h3>
                  {isCurrentUser && (
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                      Share your first post to get started!
                    </p>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="professional" className="profile-tabs-content">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mt-4">
                <h3 className="text-xl font-bold mb-4">Professional Information</h3>
                
                {user.headline && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Headline</h4>
                    <p className="text-gray-800 dark:text-gray-200">{user.headline}</p>
                  </div>
                )}
                
                {user.experience && user.experience.length > 0 ? (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Experience</h4>
                    {user.experience.map((exp, index) => (
                      <div key={index} className="mb-3">
                        <div className="flex justify-between">
                          <h5 className="font-medium">{exp.title}</h5>
                          <span className="text-sm text-gray-500">{exp.startDate} - {exp.endDate || 'Present'}</span>
                        </div>
                        <p className="text-sm">{exp.company}</p>
                        {exp.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{exp.description}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No experience information added yet.</p>
                )}
                
                {isCurrentUser && (
                  <Button variant="outline" className="mt-4">Edit Professional Info</Button>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="connections" className="profile-tabs-content">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mt-4">
                <h3 className="text-xl font-bold mb-4">Connections</h3>
                
                {user.connections && user.connections.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user.connections.map((connection) => (
                      <div key={connection.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          {connection.image ? (
                            <img 
                              src={connection.image} 
                              alt={connection.name} 
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <div className="text-blue-500 font-bold">
                              {connection.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{connection.name}</p>
                          <p className="text-sm text-gray-500">{connection.headline || ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No connections yet.</p>
                )}
              </div>
            </TabsContent>
            
            {isCurrentUser && (
              <TabsContent value="settings" className="profile-tabs-content">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mt-4">
                  <h3 className="text-xl font-bold mb-4">Profile Settings</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-base font-medium mb-2">Privacy Settings</h4>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="publicProfile"
                            className="mr-2"
                            defaultChecked={user.settings?.publicProfile}
                          />
                          <label htmlFor="publicProfile">Public Profile</label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="showEmail"
                            className="mr-2"
                            defaultChecked={user.settings?.showEmail}
                          />
                          <label htmlFor="showEmail">Show Email to Connections</label>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-base font-medium mb-2">Notification Settings</h4>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="emailNotifications"
                            className="mr-2"
                            defaultChecked={user.settings?.emailNotifications}
                          />
                          <label htmlFor="emailNotifications">Email Notifications</label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="newPostNotifications"
                            className="mr-2"
                            defaultChecked={user.settings?.newPostNotifications}
                          />
                          <label htmlFor="newPostNotifications">New Post Notifications</label>
                        </div>
                      </div>
                    </div>
                    
                    <Button className="mt-4">Save Settings</Button>
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
    </div>
  );
}
