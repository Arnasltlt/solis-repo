import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

const categories = [
  {
    name: "Muzika",
    subcategories: ["Dainos", "Instrumentai", "Ritmo žaidimai"],
  },
  {
    name: "Šokis",
    subcategories: ["Baletas", "Hiphopas", "Liaudies šokiai"],
  },
  {
    name: "Pamokų planai",
    subcategories: ["Muzikos teorija", "Šokių istorija", "Kultūrinės studijos"],
  },
  {
    name: "Veiklos",
    subcategories: ["Apšilimas", "Atvėsimas", "Grupiniai žaidimai"],
  },
]

const ageGroups = ["2-4 metai", "4-6 metai", "6+ metai"]

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  selectedAgeGroup: string;
  selectedCategories: string[];
  onAgeGroupChange: (ageGroup: string) => void;
  onCategoryChange: (category: string, isChecked: boolean) => void;
}

export function Sidebar({
  className,
  selectedAgeGroup,
  selectedCategories,
  onAgeGroupChange,
  onCategoryChange,
}: SidebarProps) {
  return (
    <div className={cn("py-4 px-3 overflow-auto bg-yellow-50", className)}>
      <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-yellow-900">
        Amžiaus grupė
      </h2>
      <RadioGroup value={selectedAgeGroup} onValueChange={onAgeGroupChange} className="mb-6 px-4">
        {ageGroups.map((age) => (
          <div key={age} className="flex items-center space-x-2">
            <RadioGroupItem value={age} id={age} />
            <Label htmlFor={age} className="text-sm text-gray-700">{age}</Label>
          </div>
        ))}
      </RadioGroup>
      <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-yellow-900">
        Kategorijos
      </h2>
      <Accordion type="multiple" className="w-full">
        {categories.map((category, index) => (
          <AccordionItem value={`item-${index}`} key={index}>
            <AccordionTrigger className="py-2 px-4 text-sm hover:bg-yellow-100 hover:no-underline text-yellow-800">
              {category.name}
            </AccordionTrigger>
            <AccordionContent>
              <div className="py-2">
                {category.subcategories.map((subcategory, subIndex) => (
                  <div key={subIndex} className="flex items-center space-x-2 px-4 py-2">
                    <Checkbox
                      id={`${category.name}-${subcategory}`}
                      checked={selectedCategories.includes(`${category.name}-${subcategory}`)}
                      onCheckedChange={(checked) => onCategoryChange(`${category.name}-${subcategory}`, checked as boolean)}
                    />
                    <label
                      htmlFor={`${category.name}-${subcategory}`}
                      className="text-sm cursor-pointer text-gray-600"
                    >
                      {subcategory}
                    </label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}

