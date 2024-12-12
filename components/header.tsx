import { Search } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  onSearch: (query: string) => void;
}

export function Header({ onSearch }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 py-4 px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-yellow-600">Solio pamoka</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <Input
              type="search"
              placeholder="Ieškoti edukacinių turinių..."
              className="pl-8 w-64"
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
          <Button variant="outline">Prisijungti</Button>
          <Button>Registruotis</Button>
        </div>
      </div>
    </header>
  )
}

