import { useState } from "react";

export type ExpertCategory = 'Legal' | 'Accounting' | 'Design' | 'Development' | 'Marketing';
export type BookingStatus = 'upcoming' | 'in_progress' | 'delivered' | 'closed';

export interface Provider {
  id: string;
  name: string;
  specialty: string;
  category: ExpertCategory;
  avatarUrl: string;
  rating: number;
  reviewCount: number;
  startingPriceMinor: number;
  isVetted: boolean;
}

export interface ServiceListing {
  id: string;
  providerId: string;
  title: string;
  deliverables: string[];
  priceMinor: number;
  deliveryDays: number;
}

export interface PartnerTool {
  id: string;
  name: string;
  logo: string;
  oneLiner: string;
  category: string;
  discountTag: string;
  url: string;
}

export interface Booking {
  id: string;
  serviceTitle: string;
  providerName: string;
  date: string;
  status: BookingStatus;
  amountMinor: number;
}

export function useMarketplaceApi() {
  const [providers] = useState<Provider[]>([
    {
      id: "p-1",
      name: "Alex Okafor",
      specialty: "IP & Tech Law",
      category: "Legal",
      avatarUrl: "AO",
      rating: 4.9,
      reviewCount: 34,
      startingPriceMinor: 15000000, // ₦150,000
      isVetted: true,
    },
    {
      id: "p-2",
      name: "Tunde & Partners",
      specialty: "Fractional CFO & Tax",
      category: "Accounting",
      avatarUrl: "TP",
      rating: 4.8,
      reviewCount: 12,
      startingPriceMinor: 20000000, // ₦200,000
      isVetted: true,
    },
    {
      id: "p-3",
      name: "Sarah Jenkins",
      specialty: "SaaS Product Design (UX/UI)",
      category: "Design",
      avatarUrl: "SJ",
      rating: 5.0,
      reviewCount: 41,
      startingPriceMinor: 30000000,
      isVetted: true,
    }
  ]);

  const [services] = useState<ServiceListing[]>([
    {
      id: "s-1",
      providerId: "p-1",
      title: "Seed Round Due Diligence Prep",
      deliverables: ["Cap table review", "IP assignment checks", "Corporate structure audit"],
      priceMinor: 25000000,
      deliveryDays: 5,
    },
    {
      id: "s-2",
      providerId: "p-3",
      title: "Landing Page Redesign (Figma)",
      deliverables: ["Wireframes", "High-fidelity UI", "Responsive layouts"],
      priceMinor: 40000000,
      deliveryDays: 7,
    }
  ]);

  const [tools] = useState<PartnerTool[]>([
    {
      id: "t-1",
      name: "Stripe",
      logo: "ST",
      oneLiner: "Global payment processing for internet businesses.",
      category: "Payments",
      discountTag: "₦20M fee-free processing",
      url: "#"
    },
    {
      id: "t-2",
      name: "AWS Activate",
      logo: "AW",
      oneLiner: "Cloud infrastructure for startups.",
      category: "Hosting",
      discountTag: "Up to $10k in credits",
      url: "#"
    }
  ]);

  const [bookings, setBookings] = useState<Booking[]>([
    { id: "b-1", serviceTitle: "Terms of Service Drafting", providerName: "Alex Okafor", date: "Sep 15, 2026", status: "upcoming", amountMinor: 15000000 },
    { id: "b-2", serviceTitle: "Landing Page Redesign", providerName: "Sarah Jenkins", date: "Sep 01, 2026", status: "delivered", amountMinor: 40000000 }
  ]);

  const updateBookingStatus = (id: string, status: BookingStatus) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  return {
    providers,
    services,
    tools,
    bookings,
    updateBookingStatus
  };
}
