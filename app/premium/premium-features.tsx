'use client'

import { 
  VideoCameraIcon, 
  MusicalNoteIcon, 
  DocumentTextIcon, 
  PuzzlePieceIcon, 
  ClockIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'

const features = [
  {
    icon: VideoCameraIcon,
    title: 'Exclusive Video Content',
    description: 'Access our complete library of high-quality educational videos created by professional educators.'
  },
  {
    icon: MusicalNoteIcon,
    title: 'Music Lessons',
    description: 'Comprehensive music lessons with professional instructors covering various instruments and skill levels.'
  },
  {
    icon: DocumentTextIcon,
    title: 'Downloadable Resources',
    description: 'Get access to printable worksheets, lesson plans, and educational materials to use in your classroom.'
  },
  {
    icon: PuzzlePieceIcon,
    title: 'Interactive Games',
    description: 'Engage students with our collection of educational games designed to make learning fun and effective.'
  },
  {
    icon: ClockIcon,
    title: 'Early Access',
    description: 'Get early access to new content before it\'s available to standard users.'
  },
  {
    icon: UserGroupIcon,
    title: 'Priority Support',
    description: 'Receive priority customer support to help you get the most out of our platform.'
  }
]

export function PremiumFeatures() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {features.map((feature, index) => (
        <div key={index} className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <div className="bg-amber-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
            <feature.icon className="h-6 w-6 text-amber-600" />
          </div>
          <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
          <p className="text-gray-600">{feature.description}</p>
        </div>
      ))}
    </div>
  )
}