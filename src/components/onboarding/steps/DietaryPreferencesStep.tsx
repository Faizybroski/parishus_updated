import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Check } from 'lucide-react';

interface DietaryPreferencesStepProps {
  data: any;
  updateData: (field: string, value: any) => void;
}

const DIETARY_OPTIONS = [
  { id: 'vegetarian', name: 'Vegetarian', description: 'No meat or fish' },
  { id: 'vegan', name: 'Vegan', description: 'No animal products' },
  { id: 'gluten_free', name: 'Gluten-Free', description: 'No gluten-containing foods' },
  { id: 'dairy_free', name: 'Dairy-Free', description: 'No dairy products' },
  { id: 'keto', name: 'Keto', description: 'Low-carb, high-fat diet' },
  { id: 'paleo', name: 'Paleo', description: 'Whole foods, no processed items' },
  { id: 'halal', name: 'Halal', description: 'Islamic dietary laws' },
  { id: 'kosher', name: 'Kosher', description: 'Jewish dietary laws' },
  { id: 'no_restrictions', name: 'No Restrictions', description: 'I eat everything!' }
];

export const DietaryPreferencesStep: React.FC<DietaryPreferencesStepProps> = ({ data, updateData }) => {
  const togglePreference = (preference: string) => {
    const currentPreferences = data.dietary_preferences || [];

    if (preference === 'no_restrictions') {
      updateData('dietary_preferences', ['no_restrictions']);
      return;
    }

    let newPreferences;
    if (currentPreferences.includes(preference)) {
      newPreferences = currentPreferences.filter((p: string) => p !== preference);
    } else {
      newPreferences = [
        ...currentPreferences.filter((p: string) => p !== 'no_restrictions'),
        preference
      ];
    }

    updateData('dietary_preferences', newPreferences);
  };

  const isSelected = (preference: string) => {
    return (data.dietary_preferences || []).includes(preference);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-[#F7C992]">Dietary Preferences</h2>
        <p className="text-[#FEFEFE] opacity-70">
          Select any dietary restrictions or preferences you have
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {DIETARY_OPTIONS.map((option) => {
          const selected = isSelected(option.id);

          return (
            <Card
              key={option.id}
              onClick={() => togglePreference(option.id)}
              className={`cursor-pointer transition-all rounded-lg border 
                ${selected
                  ? 'border-[#9DC0B3] bg-[#9DC0B3]/10'
                  : 'border-[#333] hover:border-[#9DC0B3]/50 hover:bg-[#1f1f1f]'}
              `}
            >
              <CardContent className="p-3 flex items-center space-x-4">
                <div
                  className={`h-6 w-6 flex items-center justify-center rounded-full border-2 
                    ${selected
                      ? 'border-[#9DC0B3] bg-[#9DC0B3] text-[#121212]'
                      : 'border-[#666]'}
                  `}
                >
                  {selected && <Check className="h-4 w-4 text-[#121212]" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-[#FEFEFE]">{option.name}</h3>
                  <p className="text-sm text-[#9DC0B3] opacity-80">{option.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
