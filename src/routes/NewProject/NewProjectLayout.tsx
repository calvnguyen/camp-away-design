'use client';

import { useState } from 'react';
import type { TrailerBrief } from '../../types';
import { AppNav } from '../../components/AppNav';
import { RequirementForm } from '../RequirementForm/RequirementForm';
import { IntakeChat } from '../../components/IntakeChat/IntakeChat';

export function NewProjectLayout() {
  const [briefSuggestion, setBriefSuggestion] = useState<Partial<TrailerBrief> | undefined>(undefined);

  function handleBriefSuggestion(partial: Partial<TrailerBrief>) {
    // New object reference each time so RequirementForm's useEffect fires
    setBriefSuggestion({ ...partial });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f6f3] to-[#ebe9e3]">
      <AppNav />
      <main className="px-8 pb-8 pt-20 sm:pt-24 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-8 items-start">
          <RequirementForm standalone={false} externalSuggestion={briefSuggestion} />
          <div className="xl:sticky xl:top-24">
            <IntakeChat mode="project" onBriefSuggestion={handleBriefSuggestion} />
          </div>
        </div>
      </main>
    </div>
  );
}
