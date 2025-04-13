/**
 * Data Augmentation Utility for Face Recognition
 *
 * This utility provides functions to create augmented versions of face images
 * to improve face recognition accuracy with limited reference images.
 */

/**
 * Creates an augmented version of an image with rotation
 * @param img The original image element
 * @param angle The rotation angle in degrees
 * @returns A new canvas with the rotated image
 */
export const rotateImage = (img: HTMLImageElement, angle: number): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Set canvas dimensions to accommodate rotation
  const maxSize = Math.sqrt(img.width * img.width + img.height * img.height);
  canvas.width = maxSize;
  canvas.height = maxSize;

  if (ctx) {
    // Move to center of canvas
    ctx.translate(maxSize / 2, maxSize / 2);

    // Rotate canvas
    ctx.rotate((angle * Math.PI) / 180);

    // Draw image centered
    ctx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height);

    // Reset transformation
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  return canvas;
};

/**
 * Creates an augmented version of an image with brightness adjustment
 * @param img The original image element
 * @param factor Brightness adjustment factor (0.7 = darker, 1.3 = brighter)
 * @returns A new canvas with the brightness-adjusted image
 */
export const adjustBrightness = (img: HTMLImageElement, factor: number): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Draw original image
    ctx.drawImage(img, 0, 0);

    // Apply brightness filter
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgba(${factor * 255}, ${factor * 255}, ${factor * 255}, 1)`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
  }

  return canvas;
};

/**
 * Creates an augmented version of an image with contrast adjustment
 * @param img The original image element
 * @param factor Contrast adjustment factor (0.7 = less contrast, 1.3 = more contrast)
 * @returns A new canvas with the contrast-adjusted image
 */
export const adjustContrast = (img: HTMLImageElement, factor: number): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Draw original image
    ctx.drawImage(img, 0, 0);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Apply contrast adjustment
    const factor2 = (259 * (factor * 255 + 255)) / (255 * (259 - factor * 255));

    for (let i = 0; i < data.length; i += 4) {
      data[i] = factor2 * (data[i] - 128) + 128;     // R
      data[i + 1] = factor2 * (data[i + 1] - 128) + 128; // G
      data[i + 2] = factor2 * (data[i + 2] - 128) + 128; // B
    }

    // Put image data back
    ctx.putImageData(imageData, 0, 0);
  }

  return canvas;
};

/**
 * Creates a horizontally flipped version of an image
 * @param img The original image element
 * @returns A new canvas with the flipped image
 */
export const flipImage = (img: HTMLImageElement): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Flip horizontally
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0);

    // Reset transformation
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  return canvas;
};

/**
 * Creates multiple augmented versions of an image
 * @param img The original image element
 * @returns An array of canvases with the original and augmented images
 */
export const createAugmentedImages = (img: HTMLImageElement): HTMLCanvasElement[] => {
  const augmentedImages: HTMLCanvasElement[] = [];

  // Add original image as canvas
  const originalCanvas = document.createElement('canvas');
  originalCanvas.width = img.width;
  originalCanvas.height = img.height;
  const ctx = originalCanvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(img, 0, 0);
  }
  augmentedImages.push(originalCanvas);

  // Add rotated images (multiple angles for better coverage)
  augmentedImages.push(rotateImage(img, -20)); // Rotate left 20 degrees
  augmentedImages.push(rotateImage(img, -10)); // Rotate left 10 degrees
  augmentedImages.push(rotateImage(img, 10));  // Rotate right 10 degrees
  augmentedImages.push(rotateImage(img, 20));  // Rotate right 20 degrees

  // Add brightness variations
  augmentedImages.push(adjustBrightness(img, 0.7)); // Darker
  augmentedImages.push(adjustBrightness(img, 0.85)); // Slightly darker
  augmentedImages.push(adjustBrightness(img, 1.15)); // Slightly brighter
  augmentedImages.push(adjustBrightness(img, 1.3)); // Brighter

  // Add contrast variations
  augmentedImages.push(adjustContrast(img, 0.7)); // Less contrast
  augmentedImages.push(adjustContrast(img, 1.3)); // More contrast

  // Add flipped image - can be useful despite face asymmetry
  // Many face recognition systems benefit from horizontal flips
  const flippedImg = flipImage(img);
  augmentedImages.push(flippedImg);

  // Add combined augmentations for even better coverage
  // Rotated + brightness adjusted
  augmentedImages.push(adjustBrightness(rotateImage(img, -15), 0.8)); // Rotated left + darker
  augmentedImages.push(adjustBrightness(rotateImage(img, 15), 1.2));  // Rotated right + brighter

  // Rotated + contrast adjusted
  augmentedImages.push(adjustContrast(rotateImage(img, -15), 1.2)); // Rotated left + more contrast
  augmentedImages.push(adjustContrast(rotateImage(img, 15), 0.8));  // Rotated right + less contrast

  // Flipped + rotated
  augmentedImages.push(rotateImage(flippedImg, -10)); // Flipped + rotated left
  augmentedImages.push(rotateImage(flippedImg, 10));  // Flipped + rotated right

  return augmentedImages;
};
