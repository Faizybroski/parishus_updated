import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { UtensilsCrossed, Coffee, Wine, Users } from 'lucide-react';

interface DiningStyleStepProps {
  data: any;
  updateData: (field: string, value: any) => void;
}

const DINING_STYLES = [
  {
    id: 'adventurous',
    name: 'Adventurous',
    description: 'Love trying new and exotic cuisines',
    icon: UtensilsCrossed
  },
  {
    id: 'foodie_enthusiast',
    name: 'Foodie Enthusiast',
    description: 'Passionate about fine food and cooking',
    icon: Coffee
  },
  {
    id: 'local_lover',
    name: 'Local Lover',
    description: 'Prefer neighborhood spots and local gems',
    icon: Users
  },
  {
    id: 'comfort_food',
    name: 'Comfort Food',
    description: 'Enjoy hearty, familiar dishes',
    icon: Wine
  },
  {
    id: 'health_conscious',
    name: 'Health Conscious',
    description: 'Focus on nutritious and organic options',
    icon: Coffee
  },
  {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Dining is all about the company',
    icon: Users
  }
];

export const DiningStyleStep: React.FC<DiningStyleStepProps> = ({ data, updateData }) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-semibold text-[#F7C992]">What's your dining style?</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {DINING_STYLES.map((style) => {
          const Icon = style.icon;
          const isSelected = data.dining_style === style.id;

          return (
            <Card
              key={style.id}
              onClick={() => updateData('dining_style', style.id)}
              className={`cursor-pointer hover:shadow-secondary shadow transition-all duration-200 rounded-xl border
                ${isSelected
                  ? 'border-[#9DC0B3] bg-[#9DC0B3]/10'
                  : 'border-[#333] hover:border-[#9DC0B3]/60 hover:bg-[#1e1e1e]'}
              `}
            >
              <CardContent className="p-4 text-center space-y-3">
                <div
                  className={`h-12 w-12 rounded-full flex items-center justify-center mx-auto 
                    ${isSelected ? 'bg-[#9DC0B3]/30' : 'bg-[#2a2a2a]'}`}
                >
                  <Icon
                    className={`h-6 w-6 
                      ${isSelected ? 'text-[#9DC0B3]' : 'text-[#F7C992]'}`}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-[#FEFEFE]">{style.name}</h3>
                  <p className={`text-sm  ${isSelected ? 'text-[#9DC0B3]' : 'text-[#EFEFEF]/50'} opacity-80`}>{style.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
