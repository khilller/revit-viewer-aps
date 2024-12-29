// src/components/ModelSelector/ModelSelector.tsx
'use client';

import { useEffect, useState } from 'react';
import { ModelInfo } from '@/types/app';

interface ModelSelectorProps {
  selectedUrn?: string;
  onModelSelect: (urn: string) => void;
  disabled?: boolean;
}

export default function ModelSelector({ selectedUrn, onModelSelect, disabled }: ModelSelectorProps) {
  const [models, setModels] = useState<ModelInfo[]>([]);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('/api/models');
        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        setModels(data);
      } catch (error) {
        console.error('Error fetching models:', error);
      }
    };

    fetchModels();
  }, []);

  return (
    <select
      className="px-4 py-2 border rounded-md bg-black text-white"
      value={selectedUrn || ''}
      onChange={(e) => onModelSelect(e.target.value)}
      disabled={disabled}
    >
      <option value="">Select a model</option>
      {models.map((model) => (
        <option key={model.urn} value={model.urn}>
          {model.name}
        </option>
      ))}
    </select>
  );
}
