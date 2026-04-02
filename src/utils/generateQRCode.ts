import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";

/**
 * Generates a QR code PNG, uploads it to Supabase Storage (qr-code bucket),
 * and returns the public URL.
 */
export const generateQRCodeAndUpload = async (
  trackCode: string,
): Promise<string> => {
  const trackingUrl = `${window.location.origin}/track/${trackCode}`;

  // Generate QR code as a Buffer/Blob
  const dataUrl = await QRCode.toDataURL(trackingUrl, {
    width: 300,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
    errorCorrectionLevel: "H",
  });

  // Convert base64 data URL to a Blob
  const base64Data = dataUrl.split(",")[1];
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: "image/png" });

  // Upload to Supabase Storage
  const fileName = `${trackCode}.png`;
  const { error: uploadError } = await supabase.storage
    .from("qr-code")
    .upload(fileName, blob, {
      contentType: "image/png",
      upsert: true,
    });

  if (uploadError) {
    console.error("QR upload error:", uploadError);
    throw new Error(`Failed to upload QR code: ${uploadError.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("qr-code")
    .getPublicUrl(fileName);

  return urlData.publicUrl;
};

// Keep legacy export name for backward compatibility during migration
export const generateQRCodeDataURL = generateQRCodeAndUpload;
