'use client'

import { useEffect, useMemo, useState } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { UserRoles } from '@/hooks/useAuth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'

type UIType = { id: string; slug: string; name: string; is_active: boolean; content_count?: number }

export function UITypeManager() {
  const [items, setItems] = useState<UIType[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')

  const fetchItems = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/manage/ui-types', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load types')
      setItems(data.items || [])
    } catch (e: any) {
      toast({ title: 'Klaida', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems() }, [])

  const handleCreate = async () => {
    if (!name || !slug) {
      toast({ title: 'Patikrinkite formą', description: 'Pavadinimas ir šliužas privalomi', variant: 'destructive' })
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/manage/ui-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Nepavyko sukurti')
      setName(''); setSlug('')
      await fetchItems()
      toast({ title: 'Sukurta', description: 'Turinio tipas pridėtas' })
    } catch (e: any) {
      toast({ title: 'Klaida', description: e.message, variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const setActive = async (id: string, active: boolean) => {
    try {
      const res = await fetch(`/api/manage/ui-types/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: active })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Nepavyko atnaujinti')
      await fetchItems()
    } catch (e: any) {
      toast({ title: 'Klaida', description: e.message, variant: 'destructive' })
    }
  }

  const deleteType = async (id: string) => {
    try {
      const res = await fetch(`/api/manage/ui-types/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Nepavyko ištrinti')
      await fetchItems()
    } catch (e: any) {
      toast({ title: 'Klaida', description: e.message, variant: 'destructive' })
    }
  }

  const deactivateWithReassign = async (id: string, reassignToId: string) => {
    try {
      const res = await fetch(`/api/manage/ui-types/${id}/deactivate-reassign`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reassignToId })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Nepavyko deaktyvuoti')
      await fetchItems()
      toast({ title: 'Atnaujinta', description: 'Turinys perkeltas, tipas deaktyvuotas' })
    } catch (e: any) {
      toast({ title: 'Klaida', description: e.message, variant: 'destructive' })
    }
  }

  const activeOthers = (id: string) => items.filter(i => i.is_active && i.id !== id)

  return (
    <ProtectedRoute requiredRole={UserRoles.ADMIN}>
      <div className="container py-8 space-y-6">
        <h1 className="text-2xl font-semibold">Turinio tipai</h1>

        <Card className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Pavadinimas</Label>
              <Input value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="pvz. mankstos" />
            </div>
            <div className="flex items-end">
              <Button onClick={handleCreate} disabled={creating}>Sukurti</Button>
            </div>
          </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pavadinimas</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Būsena</TableHead>
                <TableHead>Kiekis</TableHead>
                <TableHead className="text-right">Veiksmai</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{t.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.slug}</TableCell>
                  <TableCell>{t.is_active ? <Badge>Aktyvus</Badge> : <Badge variant="outline">Neaktyvus</Badge>}</TableCell>
                  <TableCell>{t.content_count ?? 0}</TableCell>
                  <TableCell className="text-right space-x-2">
                    {t.is_active ? (
                      activeOthers(t.id).length > 0 ? (
                        <Button variant="outline" size="sm" onClick={() => deactivateWithReassign(t.id, activeOthers(t.id)[0].id)}>Deaktyvuoti ir perkelti</Button>
                      ) : (
                        <Button variant="outline" size="sm" disabled>Deaktyvuoti</Button>
                      )
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setActive(t.id, true)}>Aktyvuoti</Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => deleteType(t.id)} disabled={(t.content_count ?? 0) > 0}>Ištrinti</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </ProtectedRoute>
  )
}


