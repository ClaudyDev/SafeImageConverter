/**
 * Safe Image Format Converter — Offscreen Document
 *
 * Receives image data (base64) from the background service worker,
 * draws it onto a canvas, converts to the requested format,
 * and returns base64 blob data with its MIME type.
 */

const MIME_TYPES = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp'
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target !== 'offscreen' || message.action !== 'convert') return;

  handleConversion(message)
    .then(sendResponse)
    .catch(() => sendResponse(null));

  // Return true to indicate async response
  return true;
});

async function handleConversion(message) {
  const { imageBase64, format, quality } = message;

  // Decode base64 to a Blob
  const binary = atob(imageBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes]);

  // Load into an image element
  const img = await loadImage(blob);

  // Draw to canvas
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  // Convert to target format using toBlob (avoids data URL size limits)
  const mimeType = MIME_TYPES[format] || MIME_TYPES.png;
  const qualityParam = (format === 'jpg' || format === 'webp') ? quality : undefined;

  const resultBlob = await canvasToBlob(canvas, mimeType, qualityParam);

  // Convert blob to base64 for message passing
  const resultBase64 = await blobToBase64(resultBlob);

  // Clean up the object URL
  URL.revokeObjectURL(img.src);

  return { base64: resultBase64, mimeType: mimeType };
}

function loadImage(blob) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(blob);
    img.onload = () => resolve(img);
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };
    img.src = objectUrl;
  });
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Canvas toBlob failed'));
      }
    }, mimeType, quality);
  });
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // reader.result is a data URL like "data:mime;base64,XXXX"
      // Extract just the base64 portion
      const dataUrl = reader.result;
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
}
