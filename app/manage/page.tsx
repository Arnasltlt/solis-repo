import { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, Layers, Tag } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Administravimo skydelis | Solis',
  description: 'Solis platformos administravimo skydelis',
}

export default function AdminDashboardPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Administravimo skydelis</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Categories Management Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Kategorijų valdymas
            </CardTitle>
            <CardDescription>
              Kurkite, redaguokite ir trinkite turinio kategorijas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/manage/categories">
              <Button className="w-full">
                Valdyti kategorijas
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        {/* Content Management Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Turinio valdymas
            </CardTitle>
            <CardDescription>
              Valdykite platformos turinį
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/manage/content">
              <Button className="w-full">
                Valdyti turinį
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        {/* Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Nustatymai
            </CardTitle>
            <CardDescription>
              Platformos nustatymų konfigūracija
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/manage/settings">
              <Button className="w-full" variant="outline">
                Nustatymai
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 