import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQItemProps {
  question: string;
  answer: string;
  defaultOpen?: boolean;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border py-6">
      <button
        className="w-full text-left flex items-center justify-between group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors pr-4">
          {question}
        </h3>
        <ChevronDown 
          className={cn(
            "w-5 h-5 text-muted-foreground transition-all duration-200 flex-shrink-0",
            isOpen && "rotate-180 text-primary"
          )} 
        />
      </button>
      <div 
        className={cn(
          "overflow-hidden transition-all duration-200 ease-smooth",
          isOpen ? "max-h-96 opacity-100 mt-3" : "max-h-0 opacity-0"
        )}
      >
        <p className="text-muted-foreground leading-relaxed">
          {answer}
        </p>
      </div>
    </div>
  );
};

export const FAQ: React.FC = () => {
  const faqs = [
    {
      question: "How does Parish work?",
      answer: "We match small groups of five to six people for dinners, coffee, or tea based on shared interests and conversation preferences. You'll receive the time and location after you RSVP or check out.",
      defaultOpen: true
    },
    {
      question: "What is included with Parish?",
      answer: "Your RSVP gives you access to our platform, a reserved seat at a partner venue, and our matching. Food and drinks are not included — each guest pays their own bill at the venue."
    },
    {
      question: "Who will I be matched with?",
      answer: "We pair guests by shared interests, conversation style, and availability to create balanced, welcoming tables. We focus on common ground and fresh perspectives rather than labels."
    },
    {
      question: "Where do the meetups take place?",
      answer: "At curated partner cafés and restaurants in your city. When booking, you'll see nearby options and choose the most convenient location."
    },
    {
      question: "What if I can't make it after booking?",
      answer: "Plans change! Cancel at least 24 hours before your event so we can re-balance tables. Paid RSVPs receive a full refund when cancelled within the window."
    },
    {
      question: "How long do the meetups last?",
      answer: "Most last 1–2 hours — the sweet spot for easy conversation without overload. If your table is vibing, feel free to stay longer."
    },
    {
      question: "Do I pay for my own food and drinks?",
      answer: "Yes. Parish organizes the meetup and the match; each attendee pays their individual check directly to the venue."
    }
  ];

  return (
    <div className="space-y-0">
      {faqs.map((faq, index) => (
        <FAQItem
          key={index}
          question={faq.question}
          answer={faq.answer}
          defaultOpen={faq.defaultOpen}
        />
      ))}
    </div>
  );
};