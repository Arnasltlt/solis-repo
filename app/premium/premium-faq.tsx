'use client'

import { useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid'

const faqs = [
  {
    question: "What is included in the Premium membership?",
    answer: "Premium membership gives you unlimited access to all premium content, including exclusive videos, downloadable teaching materials, interactive games, and priority customer support."
  },
  {
    question: "How much does Premium membership cost?",
    answer: "Premium membership costs €9.99 per month, or you can save 20% with an annual subscription at €95.88 per year (equivalent to €7.99 per month)."
  },
  {
    question: "Can I cancel my subscription at any time?",
    answer: "Yes, you can cancel your Premium subscription at any time. Your benefits will continue until the end of your current billing period."
  },
  {
    question: "How do I upgrade to Premium?",
    answer: "You can upgrade to Premium from your profile page or by clicking on any 'Upgrade to Premium' button throughout the platform. You'll need to be logged in to complete the upgrade process."
  },
  {
    question: "Is there a free trial for Premium?",
    answer: "Currently, we don't offer a free trial for Premium memberships, but you can access a selection of free content without a subscription to experience our platform."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept major credit cards, including Visa, Mastercard, and American Express. We also support PayPal for your convenience."
  }
]

export function PremiumFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  
  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div 
            key={index}
            className="border rounded-lg overflow-hidden"
          >
            <button
              className="flex justify-between items-center w-full p-4 text-left font-medium focus:outline-none"
              onClick={() => toggleFAQ(index)}
            >
              {faq.question}
              {openIndex === index ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-500" />
              )}
            </button>
            
            {openIndex === index && (
              <div className="px-4 pb-4">
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}