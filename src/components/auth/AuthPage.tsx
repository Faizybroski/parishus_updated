import React from 'react';
import { OnboardingCarousel } from '../OnboardingCarousel/OnboardingCarousel';

const AuthPage = () => {

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
          <OnboardingCarousel />
      </div>
    </div>
  );
};

export default AuthPage;