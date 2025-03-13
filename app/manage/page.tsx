import { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Layers, Tag, Users, Edit, List } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Administravimo skydelis | Solis',
  description: 'Solis platformos administravimo skydelis',
}

export default async function AdminDashboardPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Administravimo skydelis</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
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
        
        {/* Content Creation Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Turinio kūrimas
            </CardTitle>
            <CardDescription>
              Kurkite naują turinį platformai
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/manage/content/new">
              <Button className="w-full" variant="default">
                Kurti turinį
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* User Management Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Vartotojų valdymas
            </CardTitle>
            <CardDescription>
              Valdykite vartotojus ir jų prenumeratas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/manage/users">
              <Button className="w-full">
                Valdyti vartotojus
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      
      {/* Content Management Info */}
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mb-6">
        <h2 className="text-xl font-semibold mb-2 flex items-center text-blue-800">
          <Edit className="h-5 w-5 mr-2" />
          Turinio redagavimas
        </h2>
        <p className="text-blue-700 mb-4">
          Norėdami redaguoti turinį, eikite į pagrindinį puslapį. Ten galėsite matyti visus turinio elementus su redagavimo mygtukais.
        </p>
        <div className="flex space-x-4">
          <Link href="/">
            <Button variant="outline" className="bg-white">
              <List className="w-4 h-4 mr-2" />
              Peržiūrėti turinį
            </Button>
          </Link>
          <Link href="/manage/content/new">
            <Button>
              <Edit className="w-4 h-4 mr-2" />
              Kurti naują turinį
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}