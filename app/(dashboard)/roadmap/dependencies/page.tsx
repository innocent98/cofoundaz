'use client';

import React, { useState } from 'react';
import { useRoadmapApi } from '@/hooks/useRoadmapApi';
import { Link2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export default function DependenciesPage() {
  const { getAllTasks, addDependency } = useRoadmapApi();
  const tasks = getAllTasks();

  const [fromTask, setFromTask] = useState('');
  const [toTask, setToTask] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAddDependency = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fromTask || !toTask) {
      setErrorMsg('Please select both tasks.');
      return;
    }

    const result = addDependency(fromTask, toTask);
    
    if (!result.success) {
      setErrorMsg(result.error || 'Failed to add dependency.');
    } else {
      setSuccessMsg('Dependency added successfully.');
      setFromTask('');
      setToTask('');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  // Build graph lines (just a simple list mapping for this implementation)
  const dependentTasks = tasks.filter(t => t.dependsOn && t.dependsOn.length > 0);

  return (
    <div className="flex flex-col gap-8 h-full">
      <div>
        <h2 className="text-3xl font-display font-medium text-[#1E2923] tracking-tight">
          Dependencies
        </h2>
        <p className="text-xs text-[#617065] mt-1.5">
          Map out what blocks what. We&apos;ll automatically prevent circular loops.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Form Column */}
        <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card p-6 flex flex-col gap-6">
          <div className="flex items-center gap-2 text-[#183B28] font-bold pb-2 border-b border-[#EBEBE6]">
            <Link2 className="w-5 h-5" />
            <h3>Create Link</h3>
          </div>

          <form onSubmit={handleAddDependency} className="flex flex-col gap-4">
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#617065]">This task...</label>
              <select 
                className="bg-[#F7F7F5] border border-[#EBEBE6] rounded-input px-3 py-2 text-sm font-semibold outline-none focus:border-[#2D5A3F] transition-colors"
                value={fromTask}
                onChange={(e) => setFromTask(e.target.value)}
              >
                <option value="">Select prerequisite task</option>
                {tasks.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-center -my-2 z-10 relative">
              <div className="bg-white p-1 rounded-full border border-[#EBEBE6]">
                <ArrowRight className="w-4 h-4 text-[#C5CFC7] transform rotate-90 md:rotate-0" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#617065]">...must finish before</label>
              <select 
                className="bg-[#F7F7F5] border border-[#EBEBE6] rounded-input px-3 py-2 text-sm font-semibold outline-none focus:border-[#2D5A3F] transition-colors"
                value={toTask}
                onChange={(e) => setToTask(e.target.value)}
              >
                <option value="">Select dependent task</option>
                {tasks.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>

            <button 
              type="submit"
              className="mt-2 w-full bg-[#183B28] hover:bg-[#11291C] text-white font-bold py-2.5 rounded-card transition-colors shadow-card text-sm"
            >
              Add Dependency
            </button>

            {errorMsg && (
              <div className="bg-[#FDF2F2] border border-[#FAD7D7] rounded-input p-3 flex items-start gap-2 mt-2">
                <AlertCircle className="w-4 h-4 text-[#B0483B] shrink-0 mt-0.5" />
                <span className="text-xs font-semibold text-[#B0483B] leading-snug">{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="bg-[#EAF2ED] border border-[#CDE1D3] rounded-input p-3 flex items-start gap-2 mt-2">
                <CheckCircle2 className="w-4 h-4 text-[#2D5A3F] shrink-0 mt-0.5" />
                <span className="text-xs font-semibold text-[#2D5A3F] leading-snug">{successMsg}</span>
              </div>
            )}
          </form>
        </div>

        {/* Graph/List Column */}
        <div className="md:col-span-2 bg-white rounded-modal border border-[#EBEBE6] shadow-card p-6 flex flex-col gap-6 min-h-[400px]">
          <h3 className="font-bold text-[#1E2923] pb-2 border-b border-[#EBEBE6]">
            Active Links
          </h3>

          <div className="flex flex-col gap-4">
            {dependentTasks.length === 0 && (
              <p className="text-sm text-[#768478] italic">No dependencies mapped yet.</p>
            )}

            {dependentTasks.map(t => (
              <div key={t.id} className="flex flex-col gap-2">
                <span className="text-sm font-bold text-[#1E2923]">{t.title} <span className="font-medium text-[#768478]">(blocked by)</span></span>
                <div className="flex flex-col gap-2 pl-4 border-l-2 border-[#EBEBE6] ml-2">
                  {t.dependsOn?.map(depId => {
                    const depTask = tasks.find(x => x.id === depId);
                    return (
                      <div key={depId} className="flex items-center gap-2 bg-[#F7F7F5] rounded px-3 py-2 border border-[#EBEBE6] w-fit">
                        <span className="w-2 h-2 rounded-full bg-copper-600"></span>
                        <span className="text-xs font-semibold text-[#617065]">{depTask?.title || depId}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
