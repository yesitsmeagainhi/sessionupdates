// src/services/storageService.ts

import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { app } from '@/lib/firebase'; // Assumes your firebase init is here

const storage = getStorage(app);

/**
 * Uploads a base64 data URL string to Firebase Storage.
 * @param dataUrl The base64 string from the camera
 * @param studentNumber The student's number, used to create the path
 * @returns The public URL of the uploaded image
 */
export async function uploadPhotoAsString(dataUrl: string, studentNumber: string): Promise<string> {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const path = `attendance/${studentNumber}/${date}_${Date.now()}.jpg`;
  const storageRef = ref(storage, path);

  // Upload the base64 string (remove the "data:image/jpeg;base64," part)
  const base64Data = dataUrl.split(',')[1];
  const snapshot = await uploadString(storageRef, base64Data, 'base64', {
    contentType: 'image/jpeg',
  });

  // Get the public URL
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
}