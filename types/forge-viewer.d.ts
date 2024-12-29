declare namespace Autodesk {
  namespace Viewing {
    class GuiViewer3D {
      constructor(container: HTMLElement, config?: any);
      start(): boolean;
      load(url: string): void;
      finish(): void;
      setTheme(theme: string): void;
      setLightPreset(preset: number): void;
      loadDocumentNode(doc: any, node: any): void;
      loadExtension(extensionId: string): Promise<any>;
    }

    class Initializer {
      static initialize(options: any, callback: () => void): void;
    }

    class Document {
      static load(url: string, onSuccess: (doc: any) => void, onError: (code: number, message: string, args: any) => void): void;
      getRoot(): any;
      getDefaultGeometry(): any;
    }
  }
} 