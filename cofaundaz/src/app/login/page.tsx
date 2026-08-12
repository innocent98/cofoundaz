'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Connect authentication logic here
    console.log({ email, password, rememberMe });

    // Redirect directly to the dashboard
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F2F6F3]">
      
      {/* LEFT SIDEBAR (Dark Green Section) */}
      <div className="lg:w-[42%] bg-[#0D221A] text-white p-8 lg:p-16 flex flex-col justify-between min-h-[320px] lg:min-h-screen">
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#1B4B38] flex items-center justify-center font-serif text-[#C4A35A] font-bold text-sm">
            C
          </div>
          <span className="font-serif text-xl font-semibold text-white tracking-tight">
            Cofoundaz
          </span>
        </div>

        {/* Hero Content */}
        <div className="my-auto py-12 lg:py-0 space-y-8">
          <h1 className="font-serif italic text-3xl sm:text-4xl lg:text-[42px] font-normal leading-tight text-white">
            The co-founder<br />who never sleeps.
          </h1>

          <ul className="space-y-4">
            <li className="flex items-center gap-3 text-sm text-[#D8E5DF]">
              <div className="w-6 h-6 rounded bg-[#1B4B38] text-[#A88746] flex items-center justify-center text-xs font-bold shrink-0">
                ✓
              </div>
              <span>Set up in under 10 minutes</span>
            </li>
            <li className="flex items-center gap-3 text-sm text-[#D8E5DF]">
              <div className="w-6 h-6 rounded bg-[#1B4B38] text-[#A88746] flex items-center justify-center text-xs font-bold shrink-0">
                ✓
              </div>
              <span>No credit card required</span>
            </li>
            <li className="flex items-center gap-3 text-sm text-[#D8E5DF]">
              <div className="w-6 h-6 rounded bg-[#1B4B38] text-[#A88746] flex items-center justify-center text-xs font-bold shrink-0">
                ✓
              </div>
              <span>Your data is never used to train AI</span>
            </li>
          </ul>
        </div>

        {/* Footer Copyright */}
        <div className="text-xs text-[#527365]">
          © 2026 Cofoundaz
        </div>
      </div>

      {/* RIGHT CONTENT (Form Section) */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-20">
        <div className="w-full max-w-[420px] space-y-8">
          
          {/* Header */}
          <div className="space-y-1.5">
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#12291F] tracking-tight">
              Log in
            </h2>
            <p className="text-sm text-[#526E63]">
              Welcome back! Please enter your details to sign in to your workspace.
            </p>
          </div>

          {/* Social OAuth Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              className="w-full h-12 bg-white border border-[#D5E0DA] rounded-xl text-sm font-medium text-[#12291F] hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 shadow-2xs"
            >
              <span className="font-bold text-[#2C4A3E]">G</span>
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              className="w-full h-12 bg-white border border-[#D5E0DA] rounded-xl text-sm font-medium text-[#12291F] hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 shadow-2xs"
            >
              <span>Continue with Apple</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#D5E0DA] w-full" />
            <span className="bg-[#F2F6F3] px-3 text-xs text-[#7A9C90] absolute">
              or
            </span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-medium text-[#2C4A3E]">
                Work email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@startup.com"
                className="w-full h-12 px-4 rounded-xl border border-[#D5E0DA] bg-white text-sm text-[#12291F] placeholder-[#8BA89B] focus:outline-none focus:ring-2 focus:ring-[#A88746] focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-medium text-[#2C4A3E]">
                  Password
                </label>
                <a href="#" className="text-xs text-[#526E63] hover:underline">
                  Forgot password?
                </a>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-12 px-4 rounded-xl border border-[#D5E0DA] bg-white text-sm text-[#12291F] placeholder-[#8BA89B] focus:outline-none focus:ring-2 focus:ring-[#A88746] focus:border-transparent transition-all"
              />
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center gap-2.5 pt-1">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-[#D5E0DA] text-[#A88746] focus:ring-[#A88746]"
              />
              <label htmlFor="remember" className="text-xs text-[#4A6357]">
                Remember me for 30 days
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full h-12 bg-[#A88746] hover:bg-[#96773B] text-[#12291F] font-semibold text-sm rounded-xl transition-all shadow-xs mt-2"
            >
              Log in
            </button>
          </form>

          {/* Create Account Link */}
          <p className="text-center text-xs text-[#526E63]">
            Don't have an account?{' '}
            <Link href="/signup" className="font-semibold text-[#12291F] hover:underline">
              Create account
            </Link>
          </p>

        </div>
      </div>

    </div>
  );
}