import { create } from 'zustand';

export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

interface UploadState {
  status: UploadStatus;
  progress: number; // 0 to 100
  error: string | null;
  projectId: string | null;
  
  setStatus: (status: UploadStatus) => void;
  setProgress: (progress: number) => void;
  setError: (error: string | null) => void;
  setProjectId: (id: string | null) => void;
  reset: () => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  status: 'idle',
  progress: 0,
  error: null,
  projectId: null,
  
  setStatus: (status) => set({ status }),
  setProgress: (progress) => set({ progress }),
  setError: (error) => set({ error, status: error ? 'error' : 'idle' }),
  setProjectId: (projectId) => set({ projectId }),
  reset: () => set({ status: 'idle', progress: 0, error: null, projectId: null }),
}));
