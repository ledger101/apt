import { Injectable, inject } from '@angular/core';
import { Storage, ref, uploadBytesResumable, getDownloadURL, UploadTaskSnapshot } from '@angular/fire/storage';
import { Observable, Subject } from 'rxjs';

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
  downloadURL?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseStorageService {
  private storage: Storage = inject(Storage);

  /**
   * Upload a file to Firebase Storage with progress tracking
   * @param file The file to upload
   * @param path The storage path (e.g., 'uploads/myfile.xlsx')
   * @returns Observable that emits upload progress and completes with download URL
   */
  uploadFile(file: File, path: string): Observable<UploadProgress> {
    const storageRef = ref(this.storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);
    const progress$ = new Subject<UploadProgress>();

    uploadTask.on(
      'state_changed',
      (snapshot: UploadTaskSnapshot) => {
        const percentage = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        progress$.next({
          bytesTransferred: snapshot.bytesTransferred,
          totalBytes: snapshot.totalBytes,
          percentage: percentage
        });
      },
      (error) => {
        console.error(`Upload error for ${path}:`, error);
        progress$.error(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          progress$.next({
            bytesTransferred: uploadTask.snapshot.totalBytes,
            totalBytes: uploadTask.snapshot.totalBytes,
            percentage: 100,
            downloadURL: downloadURL
          });
          progress$.complete();
        } catch (error) {
          console.error(`Failed to get download URL for ${path}:`, error);
          progress$.error(error);
        }
      }
    );

    return progress$.asObservable();
  }

  /**
   * Get the download URL for a file
   * @param path The storage path
   * @returns Promise that resolves to the download URL
   */
  async getDownloadURL(path: string): Promise<string> {
    const storageRef = ref(this.storage, path);
    return await getDownloadURL(storageRef);
  }
}
