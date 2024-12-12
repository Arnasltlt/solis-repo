import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

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
          <div className="mb-6 px-4">
            {ageGroups.map((age) => (
              <div key={age} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="ageGroup"
                  value={age}
                  id={age}
                  onChange={(e) => onAgeGroupChange(e.target.value)}
                  checked={selectedAgeGroup === age}
                />
                <label htmlFor={age} className="text-sm text-gray-700">{age}</label>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-4">Kategorijos</h2>
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category} className="flex items-center space-x-2 px-4">
                <input
                  type="checkbox"
                  id={category}
                  checked={selectedCategories.includes(category)}
                  onChange={(e) => onCategoryChange(category, e.target.checked)}
                />
                <label htmlFor={category} className="text-sm text-gray-700">
                  {category}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}

