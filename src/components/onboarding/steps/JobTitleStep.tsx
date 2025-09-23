import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

interface JobTitleStepProps {
  data: any;
  updateData: (field: string, value: any) => void;
}

const COMMON_JOBS = [
  'Software Engineer',
  'Marketing Manager',
  'Designer',
  'Teacher',
  'Doctor',
  'Lawyer',
  'Consultant',
  'Entrepreneur',
  'Student',
  'Other'
];

export const JobTitleStep: React.FC<JobTitleStepProps> = ({ data, updateData }) => {
  const handleJobSelect = (job: string) => {
    if (job === 'Other') {
      updateData('job_title', '');
    } else {
      updateData('job_title', job);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">What do you do?</h2>
        <p className="text-muted-foreground">
          Share your profession to connect with like-minded people
        </p>
      </div>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="job-title">Job Title or Profession</Label>
          <Input
            id="job-title"
            placeholder="Enter your job title or profession"
            value={data.job_title || ''}
            onChange={(e) => updateData('job_title', e.target.value)}
            className="mt-2"
          />
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-3">Or choose from common options:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {COMMON_JOBS.map((job) => (
              <Card
                key={job}
                className={`cursor-pointer transition-all hover:shadow-card ${
                  data.job_title === job
                    ? 'border-sage-green bg-sage-green/10' 
                    : 'border-border hover:border-sage-green/50'
                }`}
                onClick={() => handleJobSelect(job)}
              >
                <CardContent className="p-3 text-center">
                  <span className="text-sm font-medium">{job}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};