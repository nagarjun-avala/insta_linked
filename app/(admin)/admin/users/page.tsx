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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NavBar from "@/components/nav-bar";
import { User } from "@/types";
import { Loader2, MoreVertical, Search, UserCheck, UserX, ShieldAlert } from "lucide-react";

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [userToModify, setUserToModify] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"ban" | "delete" | "promote" | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/admin/users");
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user.role === "ADMIN") {
      fetchUsers();
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

  const filteredUsers = searchQuery
    ? users.filter(
        (user) =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  const handleAction = (user: User, action: "ban" | "delete" | "promote") => {
    setUserToModify(user);
    setActionType(action);
    setIsDialogOpen(true);
  };

  const confirmAction = async () => {
    if (!userToModify || !actionType) return;

    try {
      let endpoint = "";
      let method = "POST";
      
      switch (actionType) {
        case "ban":
          endpoint = `/api/admin/users/${userToModify.id}/ban`;
          break;
        case "delete":
          endpoint = `/api/admin/users/${userToModify.id}`;
          method = "DELETE";
          break;
        case "promote":
          endpoint = `/api/admin/users/${userToModify.id}/promote`;
          break;
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to ${actionType} user`);
      }

      // Update local state based on action
      if (actionType === "delete") {
        setUsers(users.filter(user => user.id !== userToModify.id));
      } else {
        const updatedUser = await response.json();
        setUsers(users.map(user => user.id === updatedUser.id ? updatedUser : user));
      }
      
      setIsDialogOpen(false);
      setUserToModify(null);
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
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">User Management</h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Posts</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{user.postCount || 0}</TableCell>
                      <TableCell>
                        {user.isBanned ? (
                          <span className="text-red-500 flex items-center">
                            <UserX className="h-4 w-4 mr-1" /> Banned
                          </span>
                        ) : (
                          <span className="text-green-500 flex items-center">
                            <UserCheck className="h-4 w-4 mr-1" /> Active
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.role === "ADMIN" ? (
                          <span className="text-purple-500 flex items-center">
                            <ShieldAlert className="h-4 w-4 mr-1" /> Admin
                          </span>
                        ) : (
                          "User"
                        )}
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
                              onClick={() => window.open(`/profile/${user.id}`, '_blank')}
                            >
                              View Profile
                            </DropdownMenuItem>
                            
                            {user.isBanned ? (
                              <DropdownMenuItem 
                                onClick={() => handleAction(user, "ban")}
                                className="text-green-600"
                              >
                                Unban User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => handleAction(user, "ban")}
                                className="text-amber-600"
                              >
                                Ban User
                              </DropdownMenuItem>
                            )}
                            
                            {user.role !== "ADMIN" && (
                              <DropdownMenuItem 
                                onClick={() => handleAction(user, "promote")}
                                className="text-blue-600"
                              >
                                Promote to Admin
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleAction(user, "delete")}
                              className="text-red-600"
                            >
                              Delete User
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
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">No users found</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Try adjusting your search query
              </p>
            </div>
          )}
        </div>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "ban" 
                ? userToModify?.isBanned 
                  ? "Unban User" 
                  : "Ban User"
                : actionType === "delete"
                ? "Delete User"
                : "Promote User"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "ban" 
                ? userToModify?.isBanned
                  ? `Are you sure you want to unban ${userToModify?.name}? They will regain access to the platform.`
                  : `Are you sure you want to ban ${userToModify?.name}? They will lose access to the platform.`
                : actionType === "delete"
                ? `Are you sure you want to delete ${userToModify?.name}? This action cannot be undone.`
                : `Are you sure you want to promote ${userToModify?.name} to admin? They will gain full administrative access.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant={actionType === "delete" ? "destructive" : "default"}
              onClick={confirmAction}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
