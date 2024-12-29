// src/components/StatusOverlay/StatusOverlay.tsx
'use client';

interface StatusOverlayProps {
  message?: string | null;
  isVisible: boolean;
}

export default function StatusOverlay({ message, isVisible }: StatusOverlayProps) {
  if (!isVisible || !message) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-black text-white p-6 rounded-lg max-w-md">
        <div dangerouslySetInnerHTML={{ __html: message }} />
      </div>
    </div>
  );
}