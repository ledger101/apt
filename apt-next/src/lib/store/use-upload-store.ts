import { create } from 'zustand';
import { Report, DischargeTest, ValidationResult } from '@/types';

interface UploadState {
    uploading: boolean;
    progress: number;
    result: any | null;
    error: string | null;
    setUploading: (uploading: boolean) => void;
    setProgress: (progress: number) => void;
    setResult: (result: any) => void;
    setError: (error: string | null) => void;
    reset: () => void;
}

export const useUploadStore = create<UploadState>((set) => ({
    uploading: false,
    progress: 0,
    result: null,
    error: null,
    setUploading: (uploading) => set({ uploading }),
    setProgress: (progress) => set({ progress }),
    setResult: (result) => set({ result, uploading: false }),
    setError: (error) => set({ error, uploading: false }),
    reset: () => set({ uploading: false, progress: 0, result: null, error: null }),
}));
