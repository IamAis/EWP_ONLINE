// Utility functions for image handling

export function convertImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function resizeImage(file: File, maxWidth: number, maxHeight: number, quality: number = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      const base64 = canvas.toDataURL('image/jpeg', quality);
      resolve(base64);
    };
    
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export function validateImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!validTypes.includes(file.type)) {
    throw new Error('Formato file non supportato. Usa JPG, PNG o WebP.');
  }
  
  if (file.size > maxSize) {
    throw new Error('File troppo grande. Massimo 5MB.');
  }
  
  return true;
}

export async function processImageForUpload(file: File, maxWidth: number = 800, maxHeight: number = 600): Promise<string> {
  validateImageFile(file);
  return await resizeImage(file, maxWidth, maxHeight, 0.8);
}