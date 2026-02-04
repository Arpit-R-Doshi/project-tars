import axios from 'axios';

export const uploadToIPFS = async (file: File | Blob) => {
  const jwt = process.env.NEXT_PUBLIC_PINATA_JWT;
  
  if (!jwt) {
    throw new Error("Pinata JWT is missing. Did you restart your server after adding it to .env.local?");
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      }
    );
    
    if (!res.data.IpfsHash) throw new Error("IPFS Response did not contain a CID");
    
    console.log("🔥 IPFS Success! CID:", res.data.IpfsHash);
    return res.data.IpfsHash;
  } catch (error: any) {
    console.error("IPFS Upload Error Details:", error.response?.data || error.message);
    throw new Error(`IPFS Upload Failed: ${error.message}`);
  }
};