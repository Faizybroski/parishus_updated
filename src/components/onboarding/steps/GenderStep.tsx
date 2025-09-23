import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface GenderStepProps {
  data: any;
  updateData: (field: string, value: any) => void;
}

const GENDER_OPTIONS = [
  { id: 'female', name: 'Female' },
  { id: 'male', name: 'Male' },
  { id: 'non_binary', name: 'Non-binary' },
  { id: 'prefer_not_to_say', name: 'Prefer not to say' }
];

export const GenderStep: React.FC<GenderStepProps> = ({ data, updateData }) => {
  const handleGenderSelect = (genderId: string) => {
    updateData('gender_identity', genderId);
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">Gender Identity</h2>
        <p className="text-muted-foreground">
          This helps us create a comfortable environment for everyone
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {GENDER_OPTIONS.map((option) => {
          const isSelected = data.gender_identity === option.id;
          
          return (
            <Card
              key={option.id}
              className={`cursor-pointer transition-all hover:shadow-card ${
                isSelected 
                  ? 'border-peach-gold bg-peach-gold/10' 
                  : 'border-border hover:border-peach-gold/50'
              }`}
              onClick={() => handleGenderSelect(option.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`h-4 w-4 rounded-full border-2 ${
                    isSelected 
                      ? 'border-peach-gold bg-peach-gold' 
                      : 'border-muted-foreground'
                  }`} />
                  <span className="font-medium">{option.name}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

    </div>
  );
};