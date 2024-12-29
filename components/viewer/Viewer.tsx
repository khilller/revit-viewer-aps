'use client';

import { useEffect, useRef, useState } from 'react';
import { ViewerContext } from './ViewerContext';
import { ViewerProps } from '@/types/app';

interface ViewerInitializerOptions {
  env: string;
  api: string;
  getAccessToken: (callback: (token: string, expires: number) => void) => void;
}

interface ViewerConfig {
  extensions: string[];
}

async function getAccessToken(callback: (token: string, expires: number) => void) {
  try {
    const resp = await fetch('/api/auth/token');
    if (!resp.ok) {
      throw new Error(await resp.text());
    }
    const { access_token, expires_in } = await resp.json();
    callback(access_token, expires_in);
  } catch (err) {
    console.error('Failed to get access token:', err);
  }
}

async function initViewer(container: HTMLElement): Promise<Autodesk.Viewing.GuiViewer3D> {
  return new Promise((resolve, reject) => {
    if (!window.Autodesk) {
      reject(new Error('Autodesk Viewer library not loaded'));
      return;
    }

    try {
      const options: ViewerInitializerOptions = {
        env: 'AutodeskProduction', 
        api: 'derivativeV2',
        getAccessToken: getAccessToken 
      };

      Autodesk.Viewing.Initializer(options, () => {
        try {
          const config: ViewerConfig = {
            extensions: ['Autodesk.DocumentBrowser', 'Autodesk.FullScreen']
          };
          const viewer = new Autodesk.Viewing.GuiViewer3D(container, config);
          viewer.start();
          viewer.setTheme('light-theme');
          viewer.setLightPreset(0);
          
          viewer.loadExtension('Autodesk.DocumentBrowser').then(() => {
            resolve(viewer);
          }).catch(() => {
            resolve(viewer);
          });
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

async function loadModel(viewer: Autodesk.Viewing.GuiViewer3D, urn: string): Promise<void> {
  return new Promise((resolve, reject) => {
    function onDocumentLoadSuccess(doc: Autodesk.Viewing.Document) {
      viewer.loadDocumentNode(doc, doc.getRoot().getDefaultGeometry());
      resolve();
    }
    function onDocumentLoadFailure(code: number, message: string, errors: unknown[]) {
      reject({ code, message, errors });
    }
    viewer.setLightPreset(0);
    Autodesk.Viewing.Document.load('urn:' + urn, onDocumentLoadSuccess, onDocumentLoadFailure);
  });
}

export default function Viewer({ urn, className }: ViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewer, setViewer] = useState<Autodesk.Viewing.GuiViewer3D | null>(null);
  const [translationStatus, setTranslationStatus] = useState<string>('');

  async function checkTranslationStatus(urn: string) {
    const resp = await fetch(`/api/models/${urn}/status`);
    if (!resp.ok) throw new Error(await resp.text());
    const status = await resp.json();
    setTranslationStatus(status.status);
    return status;
  }

  useEffect(() => {
    if (!containerRef.current) return;

    let mounted = true;

    const initializeViewer = async () => {
      try {
        const newViewer = await initViewer(containerRef.current!);
        if (mounted) setViewer(newViewer);
      } catch (error) {
        console.error('Error initializing viewer:', error);
      }
    };

    initializeViewer();

    return () => {
      mounted = false;
      if (viewer) {
        viewer.finish();
        setViewer(null);
      }
    };
  }, []);

  useEffect(() => {
    if (!viewer || !urn) return;

    let isModelLoaded = false;

    const loadModelInViewer = async () => {
      if (isModelLoaded) return; // Skip if model is already loaded

      try {
        const status = await checkTranslationStatus(urn);
        
        if (status.status === 'success' || status.status === 'complete') {
          await loadModel(viewer, urn);
          isModelLoaded = true; // Set flag after successful load
        } else if (status.status === 'inprogress') {
          setTimeout(() => loadModelInViewer(), 5000);
        }
      } catch (error) {
        console.error('Error loading model:', error);
      }
    };

    loadModelInViewer();
  }, [viewer, urn]);

  return (
    <ViewerContext.Provider value={{ viewer, setViewer }}>
      <div 
        ref={containerRef} 
        className={className}
        style={{
          width: '100%',
          height: 'calc(100vh - 64px)',
          position: 'relative',
          border: '1px solid #ccc',
          overflow: 'hidden'
        }}
      >
        {translationStatus === 'inprogress' && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            Translation in progress...
          </div>
        )}
      </div>
    </ViewerContext.Provider>
  );
}