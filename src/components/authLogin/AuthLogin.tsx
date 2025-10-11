import React from 'react';
import { Login } from '@/components/login/Login';

const AuthLogin = () => {

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
          <Login />
      </div>
    </div>
  );
};

export default AuthLogin;