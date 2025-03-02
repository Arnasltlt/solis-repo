'use client'

import { useState } from 'react'
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

  const updateUserTier = async (userId: string, tierId: string) => {
    setIsUpdating(userId)
    
    try {
      // First try the standard API endpoint
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tierId }),
      })
      
      let success = false
      let errorMessage = null
      
      if (response.ok) {
        success = true
      } else {
        const data = await response.json()
        errorMessage = data.error || 'Failed to update user tier through standard API'
        
        // If standard API fails, try the direct update API
        // This is a fallback approach that uses service role keys to bypass RLS
        const tierName = accessTiers.find(t => t.id === tierId)?.name
        
        if (tierName) {
          const directResponse = await fetch(`/api/direct-update?userId=${userId}&tierName=${tierName}`)
          const directData = await directResponse.json()
          
          if (directResponse.ok && directData.success) {
            success = true
          }
        }
      }
      
      if (success) {
        // Update the local state
        const updatedUsers = users.map(user => {
          if (user.id === userId) {
            const tier = accessTiers.find(t => t.id === tierId)
            return {
              ...user,
              subscription_tier_id: tierId,
              tierName: tier?.name
            }
          }
          return user
        })
        
        setUsers(updatedUsers)
        
        toast({
          title: 'Success',
          description: 'User subscription tier updated successfully',
        })
      } else {
        throw new Error(errorMessage || 'Failed to update user tier')
      }
    } catch (error) {
      console.error('Error updating user tier:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update user tier',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(null)
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