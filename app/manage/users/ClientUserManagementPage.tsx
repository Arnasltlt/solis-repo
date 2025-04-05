'use client'

import { useState, useEffect } from 'react'
import { User, AccessTier } from '@/lib/services/users'
import { toast } from '@/hooks/use-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { UserRoles } from '@/hooks/useAuth'

interface ClientUserManagementPageProps {
  initialUsers: User[]
  accessTiers: AccessTier[]
}

export function ClientUserManagementPage({
  initialUsers,
  accessTiers,
}: ClientUserManagementPageProps) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [searchTerm, setSearchTerm] = useState('')
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Function to load users from our new API endpoint
  const loadUsers = async () => {
    try {
      // Get auth token
      const token = localStorage.getItem('supabase_access_token');
      
      console.log('Loading users via API endpoint');
      const response = await fetch('/api/manage/users', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error loading users:', errorData);
        throw new Error(errorData.error || 'Failed to load users');
      }
      
      const data = await response.json();
      if (data.users) {
        setUsers(data.users);
        console.log(`Loaded ${data.users.length} users from API`);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Load users when component mounts
  useEffect(() => {
    loadUsers();
  }, []);

  const updateUserTier = async (userId: string, tierId: string) => {
    setIsUpdating(userId)
    
    try {
      // Get auth token
      const token = localStorage.getItem('supabase_access_token');
      
      console.log(`Updating user ${userId} to tier ${tierId} via API endpoint`);
      const response = await fetch(`/api/manage/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ tierId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error updating user:', errorData);
        throw new Error(errorData.error || 'Failed to update user');
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Update the local state
        setUsers(users.map(user => {
          if (user.id === userId) {
            const tierName = accessTiers.find(t => t.id === tierId)?.name || '';
            return { ...user, subscription_tier_id: tierId, tierName };
          }
          return user;
        }));
        
        toast({
          title: "Success",
          description: `User's access tier has been updated`,
        });
      } else {
        throw new Error('Failed to update user tier');
      }
    } catch (error) {
      console.error('Error updating user tier:', error);
      toast({
        title: "Error",
        description: "Failed to update user tier. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(null);
    }
  }

  const getTierBadgeVariant = (tierName: string | undefined) => {
    switch (tierName) {
      case 'free':
        return 'secondary'
      case 'premium':
        return 'default'
      case 'administrator':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>Manage user access tiers and permissions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Search users by email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Current Tier</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getTierBadgeVariant(user.tierName) as any}>
                        {user.tierName || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.created_at 
                        ? new Date(user.created_at).toLocaleDateString() 
                        : 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select
                          value={user.subscription_tier_id}
                          onValueChange={(value) => updateUserTier(user.id, value)}
                          disabled={isUpdating === user.id}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Select tier" />
                          </SelectTrigger>
                          <SelectContent>
                            {accessTiers.map((tier) => (
                              <SelectItem key={tier.id} value={tier.id}>
                                {tier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
} 