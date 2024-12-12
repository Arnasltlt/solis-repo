import { Play, Music, FileText, Download } from 'lucide-react'
import { ContentItem } from '@/components/content-area'

export const allContentItems: ContentItem[] = [
  {
    id: 1,
    title: "Pavasario šokis vaikams",
    type: "Vaizdo įrašas",
    ageGroup: "4-6 metai",
    description: "Linksma šokių rutina, švenčianti pavasarį mažiems vaikams.",
    icon: Play,
    category: "Šokis-Baletas",
  },
  {
    id: 2,
    title: "Dainuok kartu: Vėjo daina",
    type: "Daina",
    ageGroup: "2-4 metai",
    description: "Interaktyvi daina apie vėją mažyliams.",
    icon: Music,
    category: "Muzika-Dainos",
  },
  {
    id: 3,
    title: "Saulės saugos pamokos planas",
    type: "Pamokos planas",
    ageGroup: "6+ metai",
    description: "Edukacinė medžiaga, mokanti vaikus apie apsaugą nuo saulės.",
    icon: FileText,
    category: "Pamokų planai-Kultūrinės studijos",
  },
  {
    id: 4,
    title: "Šventinis ritmo žaidimas",
    type: "Žaidimas",
    ageGroup: "4-6 metai",
    description: "Linksmas žaidimas, mokantis ritmo naudojant šventines temas.",
    icon: Download,
    category: "Muzika-Ritmo žaidimai",
  },
  {
    id: 5,
    title: "Įvadas į hiphopą",
    type: "Vaizdo įrašas",
    ageGroup: "6+ metai",
    description: "Pradedantiesiems draugiškas hiphopo šokių pamokų vadovas vaikams.",
    icon: Play,
    category: "Šokis-Hiphopas",
  },
  {
    id: 6,
    title: "Muzikos instrumentai iš viso pasaulio",
    type: "Pamokos planas",
    ageGroup: "4-6 metai",
    description: "Tyrinėkite įvairius muzikos instrumentus iš skirtingų kultūrų.",
    icon: FileText,
    category: "Muzika-Instrumentai",
  },
]

