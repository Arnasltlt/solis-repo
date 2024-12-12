import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Play, Music, FileText, Download } from 'lucide-react'

export interface ContentItem {
  id: number;
  title: string;
  type: string;
  ageGroup: string;
  description: string;
  icon: React.ElementType;
  category: string;
}

interface ContentAreaProps {
  filteredContent: ContentItem[];
}

export function ContentArea({ filteredContent }: ContentAreaProps) {
  return (
    <div className="mt-6">
      <h2 className="text-2xl font-semibold mb-6 text-yellow-900">Rekomenduojamas turinys</h2>
      {filteredContent.length === 0 ? (
        <p className="text-gray-600">Nėra turinio, atitinkančio dabartinius filtrus.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContent.map((item) => (
            <Card key={item.id} className="overflow-hidden border-yellow-200">
              <div className="h-48 bg-yellow-100 flex items-center justify-center">
                <item.icon className="h-12 w-12 text-yellow-400" />
              </div>
              <CardHeader>
                <div className="flex justify-between items-center mb-2">
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    {item.ageGroup}
                  </Badge>
                  <Badge variant="outline">{item.type}</Badge>
                </div>
                <CardTitle className="text-lg">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{item.description}</p>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-yellow-900">Žiūrėti detaliau</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

