'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Viewer from '@/components/viewer/Viewer';
import ModelSelector from '@/components/ModelSelector/ModelSelector';
import ModelUploader from '@/components/ModalUploader/ModelUploader';
import StatusOverlay from '@/components/StatusOverlay/StatusOverlay';
import { ModelInfo, TranslationStatus } from '@/types/app';

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedUrn, setSelectedUrn] = useState<string>('');
  const [status, setStatus] = useState<TranslationStatus | null>(null);
  const [statusCheckInterval, setStatusCheckInterval] = useState<NodeJS.Timeout>();

  useEffect(() => {
    const urn = searchParams.get('urn');
    if (urn) setSelectedUrn(urn);
  }, [searchParams]);

  useEffect(() => {
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
    }

    if (!selectedUrn) {
      setStatus(null);
      return;
    }

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/models/${selectedUrn}/status`);
        if (!response.ok) throw new Error(await response.text());
        const newStatus: TranslationStatus = await response.json();
        setStatus(newStatus);

        if (newStatus.status === 'success' || newStatus.status === 'failed') {
          clearInterval(statusCheckInterval);
          setStatusCheckInterval(undefined);
        }
      } catch (error) {
        console.error('Error checking status:', error);
        clearInterval(statusCheckInterval);
        setStatusCheckInterval(undefined);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    setStatusCheckInterval(interval);

    return () => {
      clearInterval(interval);
    };
  }, [selectedUrn]);

  const handleModelSelect = (urn: string) => {
    router.push(`/?urn=${urn}`);
    setSelectedUrn(urn);
  };

  const handleModelUploaded = (model: ModelInfo) => {
    handleModelSelect(model.urn);
  };

  const getStatusMessage = () => {
    if (!status) return null;
    switch (status.status) {
      case 'n/a':
        return 'Model has not been translated.';
      case 'inprogress':
        return `Model is being translated (${status.progress})...`;
      case 'failed':
        return `Translation failed. <ul>${status.messages?.map(msg => `<li>${JSON.stringify(msg)}</li>`).join('')}</ul>`;
      default:
        return null;
    }
  };

  return (
    <main className="h-screen flex flex-col">
      <header className="h-16 flex items-center justify-between px-4 border-b z-50 relative">
        <h1 className="text-xl font-bold">Revit Viewer</h1>
        <div className="flex items-center gap-4">
          <ModelSelector
            selectedUrn={selectedUrn}
            onModelSelect={handleModelSelect}
            disabled={!!statusCheckInterval}
          />
          <ModelUploader
            onModelUploaded={handleModelUploaded}
            disabled={!!statusCheckInterval}
          />
        </div>
      </header>
      
      <div className="flex-1 relative">
        <Viewer
          urn={status?.status === 'success' ? selectedUrn : undefined}
          className="w-full h-full"
        />
      </div>

      <StatusOverlay
        message={getStatusMessage()}
        isVisible={!!status && status.status !== 'success'}
      />
    </main>
  );
}