'use client';

import React, { useState } from 'react';
import { useValidationApi, Assumption } from '@/hooks/useValidationApi';
import { useToast } from '../layout';

export default function AssumptionsPage() {
  const { assumptions, updateAssumptionStatus } = useValidationApi();
  const { triggerToast } = useToast();
  
  const [localAssumptions, setLocalAssumptions] = useState<Assumption[]>(assumptions);
  const [newAssumptionTitle, setNewAssumptionTitle] = useState("");

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: Assumption['status']) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;
    
    // Optimistic update
    setLocalAssumptions(prev => prev.map(a => 
      a.id === id ? { ...a, status: newStatus } : a
    ));
    
    updateAssumptionStatus(id, newStatus);
    triggerToast(`Moved assumption to ${newStatus}`);
  };

  const handleQuickAdd = () => {
    if (!newAssumptionTitle.trim()) return;
    const newAssump: Assumption = {
      id: Date.now().toString(),
      statement: newAssumptionTitle,
      status: 'untested',
      risk: 'High',
      evidenceCount: 0
    };
    setLocalAssumptions([newAssump, ...localAssumptions]);
    setNewAssumptionTitle("");
    triggerToast("Assumption added");
  };

  const untested = localAssumptions.filter(a => a.status === 'untested');
  const testing = localAssumptions.filter(a => a.status === 'testing');
  const validated = localAssumptions.filter(a => a.status === 'validated');
  const invalidated = localAssumptions.filter(a => a.status === 'invalidated');

  const triggerExperimentToast = () => {
    triggerToast("Drafting an experiment for that assumption.");
  };

  const getRiskBadge = (risk: string) => {
    if (risk === 'high') {
      return <span className="bg-red-100 text-red-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">High risk</span>;
    }
    if (risk === 'medium') {
      return <span className="bg-copper-100 text-copper-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">Med risk</span>;
    }
    return <span className="bg-green-100 text-green-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">Low risk</span>;
  };

  const renderCard = (a: Assumption) => (
    <div 
      key={a.id} 
      draggable
      onDragStart={(e) => handleDragStart(e, a.id)}
      className="bg-[#f9faf8] rounded-card p-3.5 border border-sage-100 space-y-3 shadow-card cursor-grab active:cursor-grabbing"
    >
      <p className="text-xs md:text-sm font-medium text-sage-800">
        {a.statement}
      </p>
      <div className="flex items-center justify-between pt-1">
        {getRiskBadge(a.risk)}
        <span className="text-[11px] text-sage-400">{a.evidenceCount} evidence</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-[#0e271f] text-white rounded-modal p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-card">
        <div className="flex items-start md:items-center gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-card bg-[#9C5B34] text-white flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
            </svg>
          </div>
          <div>
            <p className="text-white text-xs md:text-sm font-medium">
              Your riskiest untested assumption:{" "}
              <span className="italic font-normal">
                “Gig workers will pay ₦500/month.”
              </span>{" "}
              Want an experiment for it?
            </p>
          </div>
        </div>

        <button
          onClick={triggerExperimentToast}
          className="bg-[#9C5B34] hover:bg-[#8A5330] text-white font-semibold px-4 py-2 md:px-5 md:py-2.5 rounded-card text-xs md:text-sm transition-all shrink-0 self-start md:self-auto cursor-pointer"
        >
          Design experiment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {/* Untested */}
        <div 
          className="bg-white rounded-modal p-4 md:p-5 border border-sage-200/80 space-y-4 shadow-card"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'untested')}
        >
          <div className="flex items-center justify-between border-b border-sage-100 pb-3">
            <h3 className="font-bold text-sage-900 text-xs md:text-sm tracking-wide">
              Untested
            </h3>
            <span className="w-6 h-6 rounded-full bg-sage-100 text-sage-600 text-xs font-semibold flex items-center justify-center">
              {untested.length}
            </span>
          </div>
          <div className="space-y-3 min-h-[50px]">
            {untested.map(renderCard)}
          </div>
          <div className="pt-2 border-t border-sage-100">
            <div className="flex items-center gap-2">
              <input 
                type="text"
                placeholder="Quick add..."
                value={newAssumptionTitle}
                onChange={(e) => setNewAssumptionTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
                className="flex-1 bg-[#F7F7F5] border border-sage-200 rounded-input px-3 py-2 text-xs outline-none focus:border-[#183B28]"
              />
              <button 
                onClick={handleQuickAdd}
                className="bg-[#183B28] text-white p-2 rounded-card shadow-card hover:bg-[#11291C]"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Testing */}
        <div 
          className="bg-white rounded-modal p-4 md:p-5 border border-sage-200/80 space-y-4 shadow-card"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'testing')}
        >
          <div className="flex items-center justify-between border-b border-sage-100 pb-3">
            <h3 className="font-bold text-sage-900 text-xs md:text-sm tracking-wide">
              Testing
            </h3>
            <span className="w-6 h-6 rounded-full bg-sage-100 text-sage-600 text-xs font-semibold flex items-center justify-center">
              {testing.length}
            </span>
          </div>
          <div className="space-y-3 min-h-[50px]">
            {testing.map(renderCard)}
          </div>
        </div>

        {/* Validated */}
        <div 
          className="bg-white rounded-modal p-4 md:p-5 border border-sage-200/80 space-y-4 shadow-card"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'validated')}
        >
          <div className="flex items-center justify-between border-b border-sage-100 pb-3">
            <h3 className="font-bold text-green-800 text-xs md:text-sm tracking-wide">
              Validated
            </h3>
            <span className="w-6 h-6 rounded-full bg-sage-100 text-sage-600 text-xs font-semibold flex items-center justify-center">
              {validated.length}
            </span>
          </div>
          <div className="space-y-3 min-h-[50px]">
            {validated.map(renderCard)}
          </div>
        </div>

        {/* Invalidated */}
        <div 
          className="bg-white rounded-modal p-4 md:p-5 border border-sage-200/80 space-y-4 shadow-card"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'invalidated')}
        >
          <div className="flex items-center justify-between border-b border-sage-100 pb-3">
            <h3 className="font-bold text-red-800 text-xs md:text-sm tracking-wide">
              Invalidated
            </h3>
            <span className="w-6 h-6 rounded-full bg-sage-100 text-sage-600 text-xs font-semibold flex items-center justify-center">
              {invalidated.length}
            </span>
          </div>
          <div className="space-y-3 min-h-[50px]">
            {invalidated.map(renderCard)}
          </div>
        </div>
      </div>
    </div>
  );
}
