import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { DiningStyleStep } from './steps/DiningStyleStep';
import { DietaryPreferencesStep } from './steps/DietaryPreferencesStep';
import { GenderStep } from './steps/GenderStep';
import { JobTitleStep } from './steps/JobTitleStep';
import { LocationStep } from './steps/LocationStep';
import { PhotoUploadStep } from './steps/PhotoUploadStep';
import { useNavigate } from 'react-router-dom';
import { useProfile } from "@/hooks/useProfile";

interface OnboardingData {
  dining_style: 'adventurous' | 'foodie_enthusiast' | 'local_lover' | 'comfort_food' | 'health_conscious' | 'social_butterfly';
  dietary_preferences: ('vegetarian' | 'vegan' | 'gluten_free' | 'dairy_free' | 'keto' | 'paleo' | 'halal' | 'kosher' | 'no_restrictions')[];
  gender_identity: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';
  job_title: string;
  location_city: string;
  location_lat?: number;
  location_lng?: number;
  profile_photo_url?: string;
}

const STEPS = [
  { id: 'dining_style', title: 'Dining Style', component: DiningStyleStep },
  { id: 'dietary_preferences', title: 'Dietary Preferences', component: DietaryPreferencesStep },
  { id: 'gender', title: 'Gender Identity', component: GenderStep },
  { id: 'job_title', title: 'Job Title', component: JobTitleStep },
  { id: 'location', title: 'Location', component: LocationStep },
  { id: 'photo', title: 'Profile Photo', component: PhotoUploadStep },
];

const OnboardingFlow = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [onboardingData, setOnboardingData] = useState<Partial<OnboardingData>>({
    dining_style: undefined,
    dietary_preferences: [],
    gender_identity: undefined,
    job_title: '',
    location_city: '',
  });
  const { user } = useAuth();
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useProfile();

  useEffect(() => {
    if (!profileLoading && profile?.approval_status === "pending") {
      navigate("/waiting-approval", { replace: true });
    }
  }, [profile, profileLoading, navigate]);

  const updateOnboardingData = (field: string, value: any) => {
    setOnboardingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error: updateError  } = await supabase
        .from('profiles')
        .update({
          ...onboardingData,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);


    if (updateError) throw updateError;

    type ProfileApproval = { approval_status: string };

    const { data: updatedProfile, error: fetchError } = await supabase
      .from('profiles')
      .select<'approval_status', ProfileApproval>('approval_status')
      .eq('user_id', user.id)
      .single();

    if (fetchError) throw fetchError;

      toast({
        title: "Welcome to Parish!",
        description: "Your profile has been created successfully.",
      }); 
      if (updatedProfile?.approval_status !== "approved") {
        window.location.href = "/waiting-approval";
        return
      }
      window.location.href = '/user/dashboard';
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete onboarding",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const CurrentStepComponent = STEPS[currentStep].component;

  const isStepComplete = () => {
    const step = STEPS[currentStep];
    switch (step.id) {
      case 'dining_style':
        return !!onboardingData.dining_style;
      case 'dietary_preferences':
        return (onboardingData.dietary_preferences?.length || 0) > 0;
      case 'gender':
        return !!onboardingData.gender_identity;
      case 'job_title':
        return !!onboardingData.job_title;
      case 'location':
        return !!onboardingData.location_city;
      case 'photo':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center">
            <img className='max-w-24' src="/Parishus logo.png" alt="Parish Logo" />
          </div>
          <h1 className="text-3xl font-bold text-[#F7C992]">
            Welcome to <span style={{fontFamily: 'Sergio Trendy'}}>Parish</span>!
          </h1>
          <p className="text-[#FEFEFE]">
            Let's set up your profile to find the perfect dining experiences
          </p>
        </div>

        <Card className="bg-[#1E1E1E] text-[#FEFEFE] border border-[#9DC0B3] shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-[#F7C992] mb-3">{STEPS[currentStep].title}</CardTitle>
              <span className="text-sm text-[#9DC0B3]">
                {currentStep + 1} of {STEPS.length}
              </span>
            </div>
            <Progress value={progress} className="w-full bg-[#2D2D2D]" />
          </CardHeader>

          <CardContent className="space-y-6">
            <CurrentStepComponent
              data={onboardingData}
              updateData={updateOnboardingData}
            />

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
                className="border-[#9DC0B3] text-[#9DC0B3] hover:bg-[#2D2D2D] hover:text-[#EFEFEF]"
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!isStepComplete() || loading}
                className="bg-[#9DC0B3] text-black hover:bg-[#9DC0B3]/90"
              >
                {currentStep === STEPS.length - 1 ? 'Complete' : 'Continue'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingFlow;
