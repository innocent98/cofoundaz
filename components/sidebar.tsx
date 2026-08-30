'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  Sparkles,
  Target,
  Activity,
  ArrowRight,
  FileText,
  CheckSquare,
  Globe,
  PieChart,
  TrendingUp,
  Coins,
  Gem,
  Star,
  Scale,
  ShoppingBag,
  GraduationCap,
  Folder,
  Calendar,
  Users,
  BarChart2,
  Lock,
  Bell,
  Settings,
  ChevronDown,
  X,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  locked?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  isOpen?: boolean;
  setIsOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}

const navSections: NavSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
      { label: 'AI Co-Founder', href: '/ai-co-founder', icon: Sparkles },
      { label: "Today's Mission", href: '/todays-mission', icon: Target },
      { label: 'Health Score', href: '/health-score', icon: Activity },
      { label: 'Roadmap', href: '/roadmap', icon: ArrowRight },
    ],
  },
  {
    title: 'BUILD',
    items: [
      { label: 'Business Builder', href: '/business-builder', icon: FileText },
      { label: 'Validation Hub', href: '/validation-hub', icon: CheckSquare },
      { label: 'Assessment', href: '/assessment', icon: Globe },
    ],
  },
  {
    title: 'GROW',
    items: [
      { label: 'Marketing Hub', href: '/marketing-hub', icon: PieChart },
      { label: 'Sales Hub', href: '/sales-hub', icon: TrendingUp },
      { label: 'Finance Hub', href: '/finance-hub', icon: Coins },
    ],
  },
  {
    title: 'FUND & PROTECT',
    items: [
      { label: 'Funding Hub', href: '/funding-hub', icon: Gem },
      { label: 'Investor Readiness', href: '/investor-readiness', icon: Star },
      { label: 'Legal & Compliance', href: '/legal-compliance', icon: Scale },
    ],
  },
  {
    title: 'RESOURCES',
    items: [
      { label: 'Marketplace', href: '/marketplace', icon: ShoppingBag },
      { label: 'Learning Academy', href: '/learning-academy', icon: GraduationCap },
      { label: 'Documents', href: '/documents', icon: Folder },
    ],
  },
  {
    title: 'WORKSPACE',
    items: [
      { label: 'Calendar', href: '/calendar', icon: Calendar },
      { label: 'Team', href: '/team', icon: Users },
      { label: 'Analytics & Reports', href: '/analytics-reports', icon: BarChart2 },
      { label: 'Journal', href: '/journal', icon: EditIcon, locked: true },
    ],
  },
];

function EditIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

export default function Sidebar({ isOpen = false, setIsOpen }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Sidebar Container */}
      <aside
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 bg-[#061A12] text-[#A3B899] flex flex-col justify-between p-4 overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden text-sm font-medium will-change-transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-raised' : '-translate-x-full'
        }`}
      >
        <div className="w-full">
          {/* Brand Header & Mobile Close Button */}
          <div className="flex w-full items-center justify-between gap-2 mb-6 px-2 pt-1">
            <div className="flex min-w-0 items-center gap-3">
              <div className="bg-[#122E21] text-[#D89A6E] font-bold h-9 w-9 shrink-0 flex items-center justify-center rounded-card text-lg">
                C
              </div>
              <span className="truncate text-xl font-semibold text-white tracking-tight">Cofoundaz</span>
            </div>
            {/* Close button for mobile */}
            <button
              type="button"
              onClick={() => setIsOpen && setIsOpen(false)}
              className="lg:hidden shrink-0 p-1.5 rounded-input text-[#7B9382] hover:text-white hover:bg-[#0E281C] transition-colors cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Project Selector */}
          <div className="w-full bg-[#0C2419] border border-[#183B2B] rounded-card p-3 mb-6 flex items-center justify-between gap-2 cursor-pointer hover:border-[#26533D] transition-colors">
            <div className="flex min-w-0 items-center gap-3">
              <div className="bg-[#122E21] text-[#D89A6E] font-bold h-8 w-8 shrink-0 flex items-center justify-center rounded-input text-sm">
                K
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-white text-sm">Kolo</p>
                <p className="truncate text-xs text-[#7B9382]">Validation stage</p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 shrink-0 text-[#7B9382]" />
          </div>

          {/* Navigation Groups */}
          <div className="flex w-full flex-col space-y-6">
            {navSections.map((section) => (
              <div key={section.title} className="w-full">
                <p className="block w-full text-[11px] font-bold uppercase tracking-wider text-[#4D6D58] mb-2 px-2">
                  {section.title}
                </p>
                <ul className="flex w-full flex-col space-y-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <li key={item.href} className="w-full">
                        <Link
                          href={item.href}
                          onClick={() => setIsOpen && setIsOpen(false)}
                          className={`relative flex w-full items-center justify-between gap-2 px-3 py-2.5 rounded-modal transition-all ${
                            isActive
                              ? 'bg-[#0E2C1E] text-white font-bold border-l-2 border-[#D89A6E] shadow-card'
                              : 'text-[#A3B899] hover:text-white hover:bg-[#0A2217]'
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <Icon
                              className={`w-4 h-4 shrink-0 ${
                                isActive ? 'text-[#D89A6E]' : 'text-[#7B9382]'
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.locked && <Lock className="w-3.5 h-3.5 shrink-0 text-[#D89A6E]" />}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Navigation & Profile */}
        <div className="flex w-full flex-col pt-6 border-t border-[#122E21] mt-6 space-y-1">
          <Link
            href="/notifications"
            onClick={() => setIsOpen && setIsOpen(false)}
            className="flex w-full items-center justify-between gap-2 px-3 py-2 rounded-card hover:text-white hover:bg-[#0A2217] transition-colors"
          >
            <div className="flex min-w-0 items-center gap-3">
              <Bell className="w-4 h-4 shrink-0 text-[#7B9382]" />
              <span className="truncate">Notifications</span>
            </div>
            <span className="shrink-0 bg-[#D89A6E] text-[#061A12] text-xs font-bold px-1.5 py-0.5 rounded-full">
              5
            </span>
          </Link>

          <Link
            href="/settings"
            onClick={() => setIsOpen && setIsOpen(false)}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-card hover:text-white hover:bg-[#0A2217] transition-colors"
          >
            <Settings className="w-4 h-4 shrink-0 text-[#7B9382]" />
            <span className="truncate">Settings & Billing</span>
          </Link>

          {/* User Profile */}
          <div className="pt-4 mt-2 flex w-full items-center justify-between gap-2 px-2 cursor-pointer">
            <div className="flex min-w-0 items-center gap-3">
              <div className="bg-[#122E21] text-white font-bold h-9 w-9 shrink-0 flex items-center justify-center rounded-full text-xs">
                AO
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-white text-sm">Amara Okafor</p>
                <p className="truncate text-xs text-[#7B9382]">Founder</p>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 shrink-0 text-[#7B9382]" />
          </div>
        </div>
      </aside>
    </>
  );
}