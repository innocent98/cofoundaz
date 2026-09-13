"use client";

import React, { useState } from "react";
import { useAssessmentApi } from "@/hooks/useAssessmentApi";

const getPoint = (score: number, idx: number) => {
  const pointsData = [
    { dx: 0, dy: -80 },    // Product (Top)
    { dx: 80, dy: -25 },   // Market (Top-Right)
    { dx: 50, dy: 65 },    // Money (Bottom-Right)
    { dx: -50, dy: 65 },   // Legal (Bottom-Left)
    { dx: -80, dy: -25 },  // Team (Top-Left)
  ];
  
  const target = pointsData[idx];
  const ratio = score / 100;
  
  return `${100 + target.dx * ratio},${100 + target.dy * ratio}`;
};

const getPolygonString = (scores: number[]) => {
  return scores.map((s, i) => getPoint(s, i)).join(" ");
};

const COLORS = [
  { fill: "#84a98c", stroke: "#84a98c" }, // Oldest
  { fill: "#354f52", stroke: "#354f52" }, // Middle
  { fill: "#9C5B34", stroke: "#9C5B34" }, // Newest
];

export default function AssessmentComparePage() {
  const { getAssessmentHistory } = useAssessmentApi();
  const history = getAssessmentHistory().slice(0, 3).reverse(); // Oldest to newest
  
  // By default, select all available
  const [selectedIds, setSelectedIds] = useState<string[]>(history.map(h => h.id));

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(i => i !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-display font-semibold text-sage-900 tracking-tight">
          How your fundamentals have matured
        </h1>
        <p className="text-sage-500 text-sm md:text-base">
          Your latest assessments across every dimension.
        </p>
      </div>

      {history.length < 2 && (
        <div className="bg-sage-50 p-4 rounded-card border border-sage-200 text-sm text-sage-600 mb-4">
          Complete at least two assessments to see a comparative growth chart.
        </div>
      )}

      {/* RADAR CHART DISPLAY CARD */}
      <div className="bg-white rounded-modal p-8 md:p-12 border border-sage-200/80 shadow-card flex flex-col md:flex-row items-center justify-center gap-12">
        {/* SVG RADAR CHART */}
        <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center shrink-0">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 200 200">
            {/* Background concentric pentagons */}
            <polygon points="100,20 180,75 150,165 50,165 20,75" fill="none" stroke="#e5e7eb" strokeWidth="1" />
            <polygon points="100,40 160,85 135,145 65,145 40,85" fill="none" stroke="#e5e7eb" strokeWidth="1" />
            <polygon points="100,60 140,95 120,125 80,125 60,95" fill="none" stroke="#e5e7eb" strokeWidth="1" />

            {/* Axis lines */}
            <line x1="100" y1="100" x2="100" y2="20" stroke="#e5e7eb" strokeWidth="1" />
            <line x1="100" y1="100" x2="180" y2="75" stroke="#e5e7eb" strokeWidth="1" />
            <line x1="100" y1="100" x2="150" y2="165" stroke="#e5e7eb" strokeWidth="1" />
            <line x1="100" y1="100" x2="50" y2="165" stroke="#e5e7eb" strokeWidth="1" />
            <line x1="100" y1="100" x2="20" y2="75" stroke="#e5e7eb" strokeWidth="1" />

            {/* Labels */}
            <text x="100" y="10" fontSize="8" fill="#6b7280" textAnchor="middle">Product</text>
            <text x="190" y="75" fontSize="8" fill="#6b7280" textAnchor="start">Market</text>
            <text x="155" y="175" fontSize="8" fill="#6b7280" textAnchor="start">Money</text>
            <text x="45" y="175" fontSize="8" fill="#6b7280" textAnchor="end">Legal</text>
            <text x="10" y="75" fontSize="8" fill="#6b7280" textAnchor="end">Team</text>

            {/* History Polygons */}
            {history.map((h, i) => {
              if (!selectedIds.includes(h.id)) return null;
              const scores = [
                h.dimensionScores.Product,
                h.dimensionScores.Market,
                h.dimensionScores.Money,
                h.dimensionScores.Legal,
                h.dimensionScores.Team
              ];
              const color = COLORS[i % COLORS.length];
              return (
                <polygon 
                  key={h.id}
                  points={getPolygonString(scores)} 
                  fill={color.fill} 
                  fillOpacity="0.2" 
                  stroke={color.stroke} 
                  strokeWidth="2" 
                  className="transition-all duration-500 ease-in-out"
                />
              );
            })}
          </svg>
        </div>

        {/* LEGEND & CONTROLS */}
        <div className="space-y-4 min-w-[200px] w-full md:w-auto">
          <h3 className="text-sm font-semibold text-sage-900 mb-2">Compare versions</h3>
          
          <div className="flex flex-col gap-3">
            {history.map((h, i) => {
              const color = COLORS[i % COLORS.length];
              const isSelected = selectedIds.includes(h.id);
              
              return (
                <button
                  key={h.id}
                  onClick={() => toggleSelection(h.id)}
                  className={`flex items-center gap-3 text-sm font-medium p-3 rounded-card border transition-all text-left ${
                    isSelected ? 'border-sage-300 bg-sage-50/50' : 'border-transparent hover:bg-sage-50/30 opacity-60'
                  }`}
                >
                  <span 
                    className="w-4 h-4 rounded-[3px] shrink-0 border"
                    style={{ backgroundColor: isSelected ? color.fill : 'transparent', borderColor: color.stroke }}
                  />
                  <div className="flex flex-col">
                    <span className="text-sage-900">{h.completedAt}</span>
                    <span className="text-xs text-sage-500">Score: {h.resultingScore}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {history.length >= 2 && (
          <>
            <div className="bg-white p-6 rounded-modal border border-sage-200/80 shadow-card space-y-2">
              <h4 className="text-sm font-semibold text-sage-600">Biggest Improvement</h4>
              <p className="text-2xl font-bold text-[#1e4836]">+30% Legal</p>
              <p className="text-xs text-sage-500">Driven by successful incorporation.</p>
            </div>
            <div className="bg-white p-6 rounded-modal border border-sage-200/80 shadow-card space-y-2">
              <h4 className="text-sm font-semibold text-sage-600">Core Strength</h4>
              <p className="text-2xl font-bold text-sage-900">Product</p>
              <p className="text-xs text-sage-500">Consistently scoring above 80%.</p>
            </div>
            <div className="bg-white p-6 rounded-modal border border-sage-200/80 shadow-card space-y-2">
              <h4 className="text-sm font-semibold text-[#9C5B34]">Focus Area</h4>
              <p className="text-2xl font-bold text-sage-900">Money</p>
              <p className="text-xs text-sage-500">Currently lowest at 60%.</p>
            </div>
          </>
        )}
      </div>

    </div>
  );
}
