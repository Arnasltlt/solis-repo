import * as React from "react"
import { ChevronDown, ChevronRight } from 'lucide-react'
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
    name: "Music",
    subcategories: ["Songs", "Instruments", "Rhythm Games"],
  },
  {
    name: "Dance",
    subcategories: ["Ballet", "Hip Hop", "Folk Dances"],
  },
  {
    name: "Lesson Plans",
    subcategories: ["Music Theory", "Dance History", "Cultural Studies"],
  },
  {
    name: "Activities",
    subcategories: ["Warm-Ups", "Cool-Downs", "Group Games"],
  },
]

const ageGroups = ["2-4 Years", "4-6 Years", "6+ Years"]

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  onAgeGroupChange: (ageGroup: string) => void;
  onCategoryChange: (category: string, isChecked: boolean) => void;
}

export function Sidebar({ className, onAgeGroupChange, onCategoryChange }: SidebarProps) {
  return (
    <div className={cn("bg-gray-100", className)}>
      <div className="py-4 px-3">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-gray-800">
          Age Group
        </h2>
        <RadioGroup defaultValue="4-6 Years" className="mb-6 px-4" onValueChange={onAgeGroupChange}>
          {ageGroups.map((age) => (
            <div key={age} className="flex items-center space-x-2">
              <RadioGroupItem value={age} id={age} />
              <Label htmlFor={age}>{age}</Label>
            </div>
          ))}
        </RadioGroup>
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-gray-800">
          Categories
        </h2>
        <Accordion>
          {categories.map((category, index) => (
            <AccordionItem key={index}>
              <AccordionTrigger onClick={() => {}}>
                {category.name}
              </AccordionTrigger>
              <AccordionContent>
                <div className="py-2">
                  {category.subcategories.map((subcategory, subIndex) => (
                    <div key={subIndex} className="flex items-center space-x-2 px-4 py-2">
                      <Checkbox
                        id={`${category.name}-${subcategory}`}
                        onChange={(event) => onCategoryChange(`${category.name}-${subcategory}`, event.target.checked)}
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
    </div>
  )
}

