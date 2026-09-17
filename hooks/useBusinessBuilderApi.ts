import { useState } from 'react';

export type CanvasType = 'bmc' | 'lean' | 'value_prop' | 'swot';

export interface CanvasBlockItem {
  id: string;
  text: string;
  createdAt: string;
  isAiGenerated?: boolean;
}

export interface Persona {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  demographics: string;
  goals: string[];
  frustrations: string[];
  wateringHoles: string[];
  quote: string;
}

export interface Competitor {
  id: string;
  name: string;
  positioning: string;
  price: string;
  strengths: string;
  weaknesses: string;
  threatLevel: 'Low' | 'Medium' | 'High';
  xPos: number; // 0-100 for 2x2 map
  yPos: number; // 0-100 for 2x2 map
}

export interface ArtifactMeta {
  id: string;
  slug: string;
  title: string;
  completionPercentage: number;
  lastEdited: string;
  description: string;
}

export type UserRole = 'F' | 'BC';

const mockArtifacts: ArtifactMeta[] = [
  { id: 'a1', slug: 'business-model-canvas', title: 'Business Model Canvas', completionPercentage: 100, lastEdited: '2 days ago', description: 'The 9 building blocks of how you create and capture value.' },
  { id: 'a2', slug: 'lean-canvas', title: 'Lean Canvas', completionPercentage: 0, lastEdited: 'Never', description: 'Actionable and entrepreneur-focused business plan.' },
  { id: 'a3', slug: 'mission-vision', title: 'Mission & Vision', completionPercentage: 100, lastEdited: '3 days ago', description: 'Why you exist and the world if you win.' },
  { id: 'a4', slug: 'value-proposition', title: 'Value Proposition', completionPercentage: 50, lastEdited: 'Yesterday', description: 'Map customer pains to your exact solutions.' },
  { id: 'a5', slug: 'personas', title: 'Customer Personas', completionPercentage: 100, lastEdited: '1 week ago', description: 'Who you are selling to.' },
  { id: 'a6', slug: 'pricing', title: 'Pricing Strategy', completionPercentage: 25, lastEdited: '2 hours ago', description: 'How much you charge and on what terms.' },
  { id: 'a7', slug: 'revenue-model', title: 'Revenue Model', completionPercentage: 0, lastEdited: 'Never', description: 'How your business makes money over time.' },
  { id: 'a8', slug: 'competitive-analysis', title: 'Competitive Analysis', completionPercentage: 0, lastEdited: 'Never', description: 'Who else is doing this and why you are better.' },
  { id: 'a9', slug: 'swot', title: 'SWOT Analysis', completionPercentage: 0, lastEdited: 'Never', description: 'Strengths, Weaknesses, Opportunities, Threats.' },
  { id: 'a10', slug: 'plan', title: 'Business Plan', completionPercentage: 0, lastEdited: 'Never', description: 'Generate a full narrative plan from your artifacts.' }
];

export function useBusinessBuilderApi() {
  const [userRole, setUserRole] = useState<UserRole>('F'); // Change to 'BC' to test Suggest Mode
  const [artifacts, setArtifacts] = useState<ArtifactMeta[]>(mockArtifacts);

  // Mock auto-save
  const updateLastEdited = (slug: string) => {
    setArtifacts(prev => prev.map(a => 
      a.slug === slug ? { ...a, lastEdited: 'Just now' } : a
    ));
  };

  return {
    userRole,
    setUserRole,
    artifacts,
    updateLastEdited
  };
}
