import { Button } from "@/components/ui/button"

interface SidebarProps {
  className?: string;
  selectedAgeGroup: string;
  selectedCategories: string[];
  onAgeGroupChange: (ageGroup: string) => void;
  onCategoryChange: (category: string, isChecked: boolean) => void;
}

const ageGroups = ["2-4 metai", "4-6 metai", "6+ metai"]
const categories = [
  "Šokis-Baletas",
  "Muzika-Dainos",
  "Pamokų planai-Kultūrinės studijos",
  "Muzika-Ritmo žaidimai",
  "Šokis-Hiphopas",
  "Muzika-Instrumentai"
]

export function Sidebar({
  className = "",
  selectedAgeGroup,
  selectedCategories,
  onAgeGroupChange,
  onCategoryChange,
}: SidebarProps) {
  return (
    <aside className={`p-6 ${className}`}>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Amžiaus grupė</h2>
          <div className="space-y-2">
            {ageGroups.map((group) => (
              <Button
                key={group}
                variant={selectedAgeGroup === group ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => onAgeGroupChange(group)}
              >
                {group}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-4">Kategorijos</h2>
          <div className="space-y-2">
            {categories.map((category) => (
              <label
                key={category}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category)}
                  onChange={(e) => onCategoryChange(category, e.target.checked)}
                  className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                />
                <span className="text-sm">{category}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}

