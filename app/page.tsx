'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    // Automatically redirect to the marketing homepage after 2 seconds
    const timer = setTimeout(() => {
      router.push('/home');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen w-full bg-[#0D221A] flex items-center justify-center relative overflow-hidden select-none">
      <div className="relative flex items-center justify-center">
        
        {/* Animated Gold Circular Spinner */}
        <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-full border-4 border-transparent border-t-[#C4A35A] border-r-[#C4A35A] border-b-[#C4A35A] animate-spin duration-1000 ease-in-out" />

        {/* Brand Logo "C" centered in the ring */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-serif text-5xl sm:text-6xl font-bold text-white tracking-tight">
            C
          </span>
        </div>

      </div>
    </div>
  );
}