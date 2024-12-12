import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ContentItem } from "@/lib/content-data"

interface ContentAreaProps {
  filteredContent: ContentItem[];
}

export function ContentArea({ filteredContent }: ContentAreaProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredContent.map((item) => (
        <Card key={item.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="secondary">{item.ageGroup}</Badge>
              {item.icon && (
                <item.icon className="h-4 w-4 text-gray-500" />
              )}
            </div>
            <CardTitle className="text-xl">{item.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">{item.description}</p>
            <Badge variant="outline" className="mt-2">
              {item.category}
            </Badge>
          </CardContent>
          <CardFooter>
            <Button className="w-full">Peržiūrėti</Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

