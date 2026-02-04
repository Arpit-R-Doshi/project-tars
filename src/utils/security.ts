import CryptoJS from 'crypto-js';
import exifr from 'exifr';

export const scrubEvidence = async (file: File): Promise<{ cleanFile: File; audit: any }> => {
  const originalTags = await exifr.parse(file).catch(() => null);
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          const cleanFile = new File([blob!], `sanitized.webp`, { type: "image/webp" });
          resolve({ cleanFile, audit: { foundMetadata: !!originalTags, tagsRemoved: originalTags ? Object.keys(originalTags) : [] } });
        }, "image/webp");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const encryptText = (text: string, key: string) => CryptoJS.AES.encrypt(text, key).toString();

export const encryptFile = async (file: File, key: string): Promise<Blob> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const encrypted = CryptoJS.AES.encrypt(reader.result as string, key).toString();
      resolve(new Blob([encrypted], { type: 'text/plain' }));
    };
  });
};

export const decryptData = (enc: string, key: string) => {
    const bytes = CryptoJS.AES.decrypt(enc, key);
    return bytes.toString(CryptoJS.enc.Utf8);
};

// 5 Shards to unlock Super Log
export const verifyShards = (shards: string[]) => {
    const master = ["TARS", "ALPHA", "SECURITY", "OMEGA", "PROTOCOL"];
    return shards.every((s, i) => s.toUpperCase() === master[i]);
};