import CryptoJS from 'crypto-js';
import exifr from 'exifr';

export interface PrivacyAudit {
  foundMetadata: boolean;
  tagsRemoved: string[];
}

// 1. THE SCRUBBER (The "Washer") - Re-renders image to destroy all metadata headers
export const scrubEvidence = async (file: File): Promise<{ cleanFile: File; audit: PrivacyAudit }> => {
  const originalTags = await exifr.parse(file).catch(() => null);
  const foundMetadata = !!originalTags;
  const tagsRemoved = originalTags ? Object.keys(originalTags) : [];

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error("Canvas context failed"));

        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const cleanFile = new File([blob], `tars_sanitized_${Date.now()}.webp`, {
              type: "image/webp",
            });
            resolve({ cleanFile, audit: { foundMetadata, tagsRemoved } });
          }
        }, "image/webp", 0.8);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

// 2. ENCRYPTION HELPERS
export const encryptText = (text: string, secretKey: string): string => {
  return CryptoJS.AES.encrypt(text, secretKey).toString();
};

export const encryptFile = async (file: File, secretKey: string): Promise<Blob> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file); 
    reader.onload = () => {
      const encrypted = CryptoJS.AES.encrypt(reader.result as string, secretKey).toString();
      resolve(new Blob([encrypted], { type: 'text/plain' }));
    };
  });
};

// 3. DECRYPTION HELPER
export const decryptData = (encryptedText: string, secretKey: string): string => {
    const bytes = CryptoJS.AES.decrypt(encryptedText, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
};