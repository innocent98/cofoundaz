"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/dashboard");
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="font-serif text-3xl lg:text-4xl text-[#1a2e22]">
          Create your workspace
        </h2>
        <p className="text-sm text-gray-500">
          Free to start. Set up in under 10 minutes.
        </p>
      </div>

      {/* Social Logins */}
      <div className="space-y-3 pt-2">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="w-full py-3 px-4 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 shadow-sm transition"
        >
          <span className="font-bold text-emerald-700">G</span>
          <span>Continue with Google</span>
        </button>

        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="w-full py-3 px-4 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 shadow-sm transition"
        >
          <span>Continue with Apple</span>
        </button>
      </div>

      {/* Divider */}
      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-gray-200"></div>
        <span className="flex-shrink mx-4 text-xs text-gray-400">or</span>
        <div className="flex-grow border-t border-gray-200"></div>
      </div>

      {/* Form */}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold text-gray-700 mb-1.5"
          >
            Work email
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@startup.com"
            required
            className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0e2a1f]/20 focus:border-[#0e2a1f]"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold text-gray-700 mb-1.5"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            required
            className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0e2a1f]/20 focus:border-[#0e2a1f]"
          />
        </div>

        {/* Terms Checkbox */}
        <div className="flex items-start gap-2.5 pt-2">
          <input
            id="terms"
            type="checkbox"
            required
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#0e2a1f] focus:ring-[#0e2a1f]"
          />
          <label htmlFor="terms" className="text-xs text-gray-600 leading-normal">
            I agree to the{" "}
            <Link href="#" className="underline text-[#0e2a1f] font-medium">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="#" className="underline text-[#0e2a1f] font-medium">
              Privacy Policy
            </Link>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-3 px-4 bg-[#a48648] hover:bg-[#93763c] text-white text-sm font-semibold rounded-lg shadow-sm transition duration-150 mt-4"
        >
          Create account
        </button>
      </form>

      {/* Login Link */}
      <div className="text-center text-xs text-gray-500 pt-2">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-gray-900 hover:underline"
        >
          Log in
        </Link>
      </div>
    </div>
  );
}