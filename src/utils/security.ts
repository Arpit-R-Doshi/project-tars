import CryptoJS from 'crypto-js';

// 1. Metadata Stripper (The "Washer")
export const stripMetadata = async (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const newFile = new File([blob], "clean_" + file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(newFile);
          }
        }, file.type);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

// 2. Client-Side Encryption (The "Lock")
// FIX: We now encrypt the Base64 string, not the raw binary.
export const encryptFile = async (file: File, secretKey: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    // Read as Data URL (Base64 String) instead of ArrayBuffer
    reader.readAsDataURL(file); 
    
    reader.onload = () => {
      const base64String = reader.result as string;
      
      // Encrypt the string
      const encrypted = CryptoJS.AES.encrypt(base64String, secretKey).toString();
      
      // Save as a text file blob
      const encryptedBlob = new Blob([encrypted], { type: 'text/plain' });
      resolve(encryptedBlob);
    };
    reader.onerror = reject;
  });
};

// 3. Client-Side Decryption (The "Key")
export const decryptFile = async (encryptedUrl: string, secretKey: string): Promise<string> => {
  try {
    const response = await fetch(encryptedUrl);
    
    // Check if the fetch actually worked
    if (!response.ok) throw new Error("Failed to fetch from IPFS");
    
    const encryptedText = await response.text();

    // Debugging: Log what we got
    console.log("Encrypted payload length:", encryptedText.length);

    const bytes = CryptoJS.AES.decrypt(encryptedText, secretKey);
    const originalBase64 = bytes.toString(CryptoJS.enc.Utf8);

    if (!originalBase64.startsWith('data:image')) {
      console.error("Decrypted output does not look like an image:", originalBase64.substring(0, 50));
      throw new Error("Decryption failed: Invalid Key or Corrupted Data");
    }

    return originalBase64;
  } catch (error) {
    console.error(error);
    throw error;
  }
};