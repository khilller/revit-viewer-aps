export interface APSConfig {
    clientId: string;
    clientSecret: string;
    bucket: string;
  }
  
  export interface ViewerToken {
    access_token: string;
    expires_in: number;
  }
  
  export interface ModelInfo {
    name: string;
    urn: string;
  }
  
  export interface TranslationStatus {
    status: 'n/a' | 'inprogress' | 'success' | 'failed';
    progress?: string;
    messages?: Array<{ type: string; message: string; code?: string }>;
  }

  export interface ViewerProps {
    urn?: string;
    className?: string;
  }
  