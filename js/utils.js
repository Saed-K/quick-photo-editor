// utils.js

/**
 * Applies a convolution kernel to the provided ImageData.
 * @param {ImageData} imageData - The source image data.
 * @param {number[]} kernel - The convolution kernel (1D array).
 * @param {number} kernelSize - The size (width/height) of the kernel.
 * @returns {ImageData} - The processed image data.
 */
function applyConvolution(imageData, kernel, kernelSize) {
  const width = imageData.width,
    height = imageData.height;
  const src = imageData.data;
  const output = new Uint8ClampedArray(src.length);
  const half = Math.floor(kernelSize / 2);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0;
      for (let ky = -half; ky <= half; ky++) {
        for (let kx = -half; kx <= half; kx++) {
          const posX = x + kx;
          const posY = y + ky;
          if (posX >= 0 && posX < width && posY >= 0 && posY < height) {
            const idx = (posY * width + posX) * 4;
            const kVal = kernel[(ky + half) * kernelSize + (kx + half)];
            r += src[idx] * kVal;
            g += src[idx + 1] * kVal;
            b += src[idx + 2] * kVal;
          }
        }
      }
      const idx = (y * width + x) * 4;
      output[idx] = Math.min(Math.max(r, 0), 255);
      output[idx + 1] = Math.min(Math.max(g, 0), 255);
      output[idx + 2] = Math.min(Math.max(b, 0), 255);
      output[idx + 3] = src[idx + 3];
    }
  }
  return new ImageData(output, width, height);
}

/**
 * Clamps a value between min and max.
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
