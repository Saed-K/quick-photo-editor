// editor.js

document.addEventListener("DOMContentLoaded", () => {
  // Helper: Safely get value from an element or return a default
  function getValue(id, defaultVal) {
    const el = document.getElementById(id);
    return el ? el.value : defaultVal;
  }

  // Convolution function used by several effects
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

  // Basic custom effects
  function applyExposure(imageData, exposure) {
    const factor = exposure / 100;
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(Math.max(data[i] * factor, 0), 255);
      data[i + 1] = Math.min(Math.max(data[i + 1] * factor, 0), 255);
      data[i + 2] = Math.min(Math.max(data[i + 2] * factor, 0), 255);
    }
    return imageData;
  }

  function applyGamma(imageData, gammaValue) {
    const gamma = gammaValue / 100;
    const invGamma = 1 / (gamma || 1);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(
        Math.max(255 * Math.pow(data[i] / 255, invGamma), 0),
        255
      );
      data[i + 1] = Math.min(
        Math.max(255 * Math.pow(data[i + 1] / 255, invGamma), 0),
        255
      );
      data[i + 2] = Math.min(
        Math.max(255 * Math.pow(data[i + 2] / 255, invGamma), 0),
        255
      );
    }
    return imageData;
  }

  function applyTemperature(imageData, temp) {
    const adjustment = ((temp - 100) / 100) * 50;
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(Math.max(data[i] + adjustment, 0), 255);
      data[i + 2] = Math.min(Math.max(data[i + 2] - adjustment, 0), 255);
    }
    return imageData;
  }

  function applyClarity(imageData, clarity) {
    const factor = clarity / 100;
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      for (let j = 0; j < 3; j++) {
        data[i + j] = Math.min(
          Math.max(128 + (data[i + j] - 128) * (1 + factor), 0),
          255
        );
      }
    }
    return imageData;
  }

  function applyNoiseReduction(imageData, nr) {
    if (nr <= 0) return imageData;
    const kernel = [
      1 / 9,
      1 / 9,
      1 / 9,
      1 / 9,
      1 / 9,
      1 / 9,
      1 / 9,
      1 / 9,
      1 / 9,
    ];
    return applyConvolution(imageData, kernel, 3);
  }

  function applyHighlights(imageData, hl) {
    const threshold = 220;
    const adjust = (hl / 100) * 50;
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > threshold)
        data[i] = Math.min(Math.max(data[i] - adjust, 0), 255);
      if (data[i + 1] > threshold)
        data[i + 1] = Math.min(Math.max(data[i + 1] - adjust, 0), 255);
      if (data[i + 2] > threshold)
        data[i + 2] = Math.min(Math.max(data[i + 2] - adjust, 0), 255);
    }
    return imageData;
  }

  function applyShadows(imageData, sh) {
    const threshold = 35;
    const adjust = (sh / 100) * 50;
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] < threshold)
        data[i] = Math.min(Math.max(data[i] + adjust, 0), 255);
      if (data[i + 1] < threshold)
        data[i + 1] = Math.min(Math.max(data[i + 1] + adjust, 0), 255);
      if (data[i + 2] < threshold)
        data[i + 2] = Math.min(Math.max(data[i + 2] + adjust, 0), 255);
    }
    return imageData;
  }

  function applyPosterize(imageData, levels) {
    const data = imageData.data;
    const step = 255 / (levels - 1);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.round(data[i] / step) * step;
      data[i + 1] = Math.round(data[i + 1] / step) * step;
      data[i + 2] = Math.round(data[i + 2] / step) * step;
    }
    return imageData;
  }

  function applyEmboss(imageData, embossVal) {
    if (embossVal <= 0) return imageData;
    const factor = embossVal / 100;
    const kernel = [
      -2 * factor,
      -factor,
      0,
      -factor,
      1 + 4 * factor,
      -factor,
      0,
      -factor,
      2 * factor,
    ];
    return applyConvolution(imageData, kernel, 3);
  }

  function applyDuotone(imageData, duotoneVal) {
    if (duotoneVal <= 0) return imageData;
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = avg * (1 - duotoneVal / 100);
      data[i + 1] = avg * (1 - duotoneVal / 100);
      data[i + 2] = avg + (255 - avg) * (duotoneVal / 100);
    }
    return imageData;
  }

  function applySharpness(imageData, sharpnessVal) {
    if (sharpnessVal <= 0) return imageData;
    const factor = sharpnessVal / 100;
    const kernel = [
      0,
      -factor,
      0,
      -factor,
      1 + 4 * factor,
      -factor,
      0,
      -factor,
      0,
    ];
    return applyConvolution(imageData, kernel, 3);
  }

  // Extra effects:
  function applyColorBalance(imageData) {
    const redAdjust = parseInt(getValue("colorBalanceRed", 0), 10);
    const greenAdjust = parseInt(getValue("colorBalanceGreen", 0), 10);
    const blueAdjust = parseInt(getValue("colorBalanceBlue", 0), 10);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(Math.max(data[i] + redAdjust, 0), 255);
      data[i + 1] = Math.min(Math.max(data[i + 1] + greenAdjust, 0), 255);
      data[i + 2] = Math.min(Math.max(data[i + 2] + blueAdjust, 0), 255);
    }
    return imageData;
  }

  function applySplitToning(imageData) {
    const shadowR = parseInt(getValue("splitToningShadowR", 0), 10);
    const shadowG = parseInt(getValue("splitToningShadowG", 0), 10);
    const shadowB = parseInt(getValue("splitToningShadowB", 0), 10);
    const highlightR = parseInt(getValue("splitToningHighlightR", 0), 10);
    const highlightG = parseInt(getValue("splitToningHighlightG", 0), 10);
    const highlightB = parseInt(getValue("splitToningHighlightB", 0), 10);
    const threshold = 128;
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (avg < threshold) {
        data[i] = Math.min(Math.max(data[i] + shadowR, 0), 255);
        data[i + 1] = Math.min(Math.max(data[i + 1] + shadowG, 0), 255);
        data[i + 2] = Math.min(Math.max(data[i + 2] + shadowB, 0), 255);
      } else {
        data[i] = Math.min(Math.max(data[i] + highlightR, 0), 255);
        data[i + 1] = Math.min(Math.max(data[i + 1] + highlightG, 0), 255);
        data[i + 2] = Math.min(Math.max(data[i + 2] + highlightB, 0), 255);
      }
    }
    return imageData;
  }

  function applyChannelMixer(imageData) {
    const mixer = {
      r: [
        parseFloat(getValue("channelMixerR0", 1)),
        parseFloat(getValue("channelMixerR1", 0)),
        parseFloat(getValue("channelMixerR2", 0)),
      ],
      g: [
        parseFloat(getValue("channelMixerG0", 0)),
        parseFloat(getValue("channelMixerG1", 1)),
        parseFloat(getValue("channelMixerG2", 0)),
      ],
      b: [
        parseFloat(getValue("channelMixerB0", 0)),
        parseFloat(getValue("channelMixerB1", 0)),
        parseFloat(getValue("channelMixerB2", 1)),
      ],
    };
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i],
        g = data[i + 1],
        b = data[i + 2];
      data[i] = Math.min(
        Math.max(r * mixer.r[0] + g * mixer.r[1] + b * mixer.r[2], 0),
        255
      );
      data[i + 1] = Math.min(
        Math.max(r * mixer.g[0] + g * mixer.g[1] + b * mixer.g[2], 0),
        255
      );
      data[i + 2] = Math.min(
        Math.max(r * mixer.b[0] + g * mixer.b[1] + b * mixer.b[2], 0),
        255
      );
    }
    return imageData;
  }

  function applyToneCurve(imageData) {
    const toneValue = parseInt(getValue("toneCurve", 100), 10);
    const exponent = toneValue / 100;
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(
        Math.max(255 * Math.pow(data[i] / 255, exponent), 0),
        255
      );
      data[i + 1] = Math.min(
        Math.max(255 * Math.pow(data[i + 1] / 255, exponent), 0),
        255
      );
      data[i + 2] = Math.min(
        Math.max(255 * Math.pow(data[i + 2] / 255, exponent), 0),
        255
      );
    }
    return imageData;
  }

  function applyFisheye(imageData) {
    const strength = parseInt(getValue("fisheye", 0), 10);
    if (strength === 0) return imageData;
    const width = imageData.width,
      height = imageData.height;
    const src = imageData.data;
    const output = new Uint8ClampedArray(src.length);
    const cx = width / 2,
      cy = height / 2;
    const maxDist = Math.sqrt(cx * cx + cy * cy);
    const k = strength / 100;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - cx,
          dy = y - cy;
        const r = Math.sqrt(dx * dx + dy * dy);
        const theta = Math.atan2(dy, dx);
        const rDistorted = r + (k * r * r) / maxDist;
        const srcX = Math.round(cx + rDistorted * Math.cos(theta));
        const srcY = Math.round(cy + rDistorted * Math.sin(theta));
        const destIndex = (y * width + x) * 4;
        if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
          const srcIndex = (srcY * width + srcX) * 4;
          output[destIndex] = src[srcIndex];
          output[destIndex + 1] = src[srcIndex + 1];
          output[destIndex + 2] = src[srcIndex + 2];
          output[destIndex + 3] = src[srcIndex + 3];
        } else {
          output[destIndex] = src[destIndex];
          output[destIndex + 1] = src[destIndex + 1];
          output[destIndex + 2] = src[destIndex + 2];
          output[destIndex + 3] = src[destIndex + 3];
        }
      }
    }
    return new ImageData(output, width, height);
  }

  function applyOilPainting(imageData) {
    const radius = parseInt(getValue("oilPainting", 0), 10);
    if (radius < 1) return imageData;
    const width = imageData.width,
      height = imageData.height;
    const src = imageData.data;
    const output = new Uint8ClampedArray(src.length);
    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        const hist = new Array(256).fill(0);
        const sumR = new Array(256).fill(0);
        const sumG = new Array(256).fill(0);
        const sumB = new Array(256).fill(0);
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const idx = ((y + dy) * width + (x + dx)) * 4;
            const intensity = Math.floor(
              (src[idx] + src[idx + 1] + src[idx + 2]) / 3
            );
            hist[intensity]++;
            sumR[intensity] += src[idx];
            sumG[intensity] += src[idx + 1];
            sumB[intensity] += src[idx + 2];
          }
        }
        let maxCount = 0,
          maxIndex = 0;
        for (let i = 0; i < 256; i++) {
          if (hist[i] > maxCount) {
            maxCount = hist[i];
            maxIndex = i;
          }
        }
        const destIdx = (y * width + x) * 4;
        output[destIdx] = Math.floor(sumR[maxIndex] / maxCount);
        output[destIdx + 1] = Math.floor(sumG[maxIndex] / maxCount);
        output[destIdx + 2] = Math.floor(sumB[maxIndex] / maxCount);
        output[destIdx + 3] = src[destIdx + 3];
      }
    }
    // Copy border pixels unchanged
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (
          x < radius ||
          x >= width - radius ||
          y < radius ||
          y >= height - radius
        ) {
          const idx = (y * width + x) * 4;
          output[idx] = src[idx];
          output[idx + 1] = src[idx + 1];
          output[idx + 2] = src[idx + 2];
          output[idx + 3] = src[idx + 3];
        }
      }
    }
    return new ImageData(output, width, height);
  }

  // Debounce updates using requestAnimationFrame
  let updatePending = false;
  function requestCanvasUpdate() {
    if (!updatePending) {
      updatePending = true;
      requestAnimationFrame(() => {
        updatePending = false;
        updateCanvas();
      });
    }
  }

  //Draw image with CSS filters, then remove them to work on pixel data
  function updateCanvas() {
    if (!currentImage) return;

    // Retrieve native filter values
    const brightness = getValue("brightness", 100);
    const contrast = getValue("contrast", 100);
    const saturation = getValue("saturation", 100);
    const hue = getValue("hue", 0);
    const grayscale = getValue("grayscale", 0);
    const sepia = getValue("sepia", 0);
    const invert = getValue("invert", 0);
    const blur = getValue("blur", 0);
    const rotate = parseInt(getValue("rotate", 0), 10);

    ctx.filter = `
        brightness(${brightness}%)
        contrast(${contrast}%)
        saturate(${saturation}%)
        hue-rotate(${hue}deg)
        grayscale(${grayscale}%)
        sepia(${sepia}%)
        invert(${invert}%)
        blur(${blur}px)
      `;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (rotate !== 0) {
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotate * Math.PI) / 180);
      ctx.drawImage(
        currentImage,
        -canvas.width / 2,
        -canvas.height / 2,
        canvas.width,
        canvas.height
      );
      ctx.restore();
    } else {
      ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);
    }

    // Remove CSS filters so getImageData gets raw pixel data
    ctx.filter = "none";
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Apply custom effects sequentially using safe getValue
    imageData = applyExposure(imageData, getValue("exposure", 100));
    imageData = applyGamma(imageData, getValue("gamma", 100));
    imageData = applyTemperature(imageData, getValue("temperature", 100));
    imageData = applyClarity(imageData, getValue("clarity", 0));
    imageData = applyNoiseReduction(imageData, getValue("noiseReduction", 0));
    imageData = applyHighlights(imageData, getValue("highlights", 0));
    imageData = applyShadows(imageData, getValue("shadows", 0));
    imageData = applyPosterize(imageData, getValue("posterize", 256));
    imageData = applyEmboss(imageData, getValue("emboss", 0));
    imageData = applyDuotone(imageData, getValue("duotone", 0));

    // Extra effects
    imageData = applyColorBalance(imageData);
    imageData = applySplitToning(imageData);
    imageData = applyChannelMixer(imageData);
    imageData = applyToneCurve(imageData);
    imageData = applyFisheye(imageData);
    imageData = applyOilPainting(imageData);

    // Vignette effect
    const vignette = getValue("vignette", 0);
    if (vignette > 0) {
      let grad = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 4,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 1.2
      );
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(1, `rgba(0,0,0,${vignette / 100})`);
      ctx.putImageData(imageData, 0, 0);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    imageData = applySharpness(imageData, getValue("sharpness", 0));

    // FUN EFFECTS
    let funPixelate = parseInt(getValue("pixelate", 0), 10);
    if (funPixelate > 0) {
      imageData = applyPixelate(imageData, funPixelate);
    }

    let funComic = parseInt(getValue("comic", 0), 10);
    if (funComic > 0) {
      imageData = applyComic(imageData, funComic);
    }

    let funSketch = parseInt(getValue("sketch", 0), 10);
    if (funSketch > 0) {
      imageData = applySketch(imageData, funSketch);
    }

    let funWatercolor = parseInt(getValue("watercolor", 0), 10);
    if (funWatercolor > 0) {
      imageData = applyWatercolor(imageData, funWatercolor);
    }

    let funGlow = parseInt(getValue("glow", 0), 10);
    if (funGlow > 0) {
      imageData = applyGlow(imageData, funGlow);
    }

    let funMirror = document.getElementById("mirror")
      ? document.getElementById("mirror").checked
      : false;
    imageData = applyMirror(imageData, funMirror);

    let funSwirl = parseInt(getValue("swirl", 0), 10);
    if (funSwirl > 0) {
      imageData = applySwirl(imageData, funSwirl);
    }

    let funKaleidoscope = parseInt(getValue("kaleidoscope", 0), 10);
    if (funKaleidoscope > 0) {
      imageData = applyKaleidoscope(imageData, funKaleidoscope);
    }

    let funMosaic = parseInt(getValue("mosaic", 0), 10);
    if (funMosaic > 0) {
      imageData = applyMosaic(imageData, funMosaic);
    }

    let funSolarize = parseInt(getValue("solarize", 0), 10);
    if (funSolarize > 0) {
      imageData = applySolarize(imageData, funSolarize);
    }

    let funRetro = parseInt(getValue("retro", 0), 10);
    if (funRetro > 0) {
      imageData = applyRetro(imageData, funRetro);
    }

    let funCartoon = parseInt(getValue("cartoon", 0), 10);
    if (funCartoon > 0) {
      imageData = applyCartoon(imageData, funCartoon);
    }

    let funCrystallize = parseInt(getValue("crystallize", 0), 10);
    if (funCrystallize > 0) {
      imageData = applyCrystallize(imageData, funCrystallize);
    }

    let funFreeze = parseInt(getValue("freezeFrame", 0), 10);
    if (funFreeze > 0) {
      imageData = applyFreezeFrame(imageData, funFreeze);
    }

    // Write processed image data back to the canvas
    ctx.putImageData(imageData, 0, 0);
  }

  // State management for undo/redo
  let undoStack = [];
  let redoStack = [];
  function saveState() {
    try {
      undoStack.push(canvas.toDataURL());
      redoStack = [];
    } catch (e) {
      console.error("State save error:", e);
    }
  }

  function loadState(dataURL) {
    const img = new Image();
    img.onload = () => {
      currentImage = img;
      canvas.width = img.width;
      canvas.height = img.height;
      updateCanvas();
    };
    img.src = dataURL;
  }

  // Get DOM elements
  const fileInput = document.getElementById("uploadImage");
  const canvas = document.getElementById("photoCanvas");
  const ctx = canvas.getContext("2d");
  let currentImage = null;
  let originalImage = null;

  // File upload
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        originalImage = img;
        currentImage = img;
        canvas.width = img.width;
        canvas.height = img.height;
        saveState();
        updateCanvas();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });

  // Attach input event listeners for all controls with debouncing
  document.querySelectorAll("input").forEach((control) => {
    control.addEventListener("input", requestCanvasUpdate);
    control.addEventListener("change", () => {
      saveState();
      requestCanvasUpdate();
    });
  });

  // Undo, Redo, Reset, and Download buttons
  document.getElementById("undo").addEventListener("click", () => {
    if (undoStack.length > 1) {
      redoStack.push(undoStack.pop());
      loadState(undoStack[undoStack.length - 1]);
    }
  });

  document.getElementById("redo").addEventListener("click", () => {
    if (redoStack.length > 0) {
      const state = redoStack.pop();
      undoStack.push(state);
      loadState(state);
    }
  });

  document.getElementById("reset").addEventListener("click", () => {
    if (!originalImage) return;
    // Reset all controls to default values
    const controls = [
      { id: "brightness", value: 100 },
      { id: "contrast", value: 100 },
      { id: "saturation", value: 100 },
      { id: "exposure", value: 100 },
      { id: "gamma", value: 100 },
      { id: "temperature", value: 100 },
      { id: "hue", value: 0 },
      { id: "grayscale", value: 0 },
      { id: "sepia", value: 0 },
      { id: "invert", value: 0 },
      { id: "blur", value: 0 },
      { id: "rotate", value: 0 },
      { id: "crop", value: "" },
      { id: "vignette", value: 0 },
      { id: "sharpness", value: 0 },
      { id: "clarity", value: 0 },
      { id: "noiseReduction", value: 0 },
      { id: "highlights", value: 0 },
      { id: "shadows", value: 0 },
      { id: "posterize", value: 256 },
      { id: "emboss", value: 0 },
      { id: "duotone", value: 0 },
      // Extra effects
      { id: "colorBalanceRed", value: 0 },
      { id: "colorBalanceGreen", value: 0 },
      { id: "colorBalanceBlue", value: 0 },
      { id: "splitToningShadowR", value: 0 },
      { id: "splitToningShadowG", value: 0 },
      { id: "splitToningShadowB", value: 0 },
      { id: "splitToningHighlightR", value: 0 },
      { id: "splitToningHighlightG", value: 0 },
      { id: "splitToningHighlightB", value: 0 },
      { id: "channelMixerR0", value: 1 },
      { id: "channelMixerR1", value: 0 },
      { id: "channelMixerR2", value: 0 },
      { id: "channelMixerG0", value: 0 },
      { id: "channelMixerG1", value: 1 },
      { id: "channelMixerG2", value: 0 },
      { id: "channelMixerB0", value: 0 },
      { id: "channelMixerB1", value: 0 },
      { id: "channelMixerB2", value: 1 },
      { id: "toneCurve", value: 100 },
      { id: "fisheye", value: 0 },
      { id: "oilPainting", value: 0 },
    ];
    controls.forEach((ctrl) => {
      const el = document.getElementById(ctrl.id);
      if (el) el.value = ctrl.value;
    });
    // Clear state and pending updates
    undoStack = [];
    redoStack = [];
    updatePending = false;
    currentImage = originalImage;
    saveState();
    updateCanvas();
  });

  document.getElementById("download").addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = "edited_image.png";
    link.href = canvas.toDataURL();
    link.click();
  });
});

// FUN EFFECTS

// Helper to convert ImageData to a temporary canvas
function imageDataToCanvas(imageData) {
  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  canvas.getContext("2d").putImageData(imageData, 0, 0);
  return canvas;
}

// 1. Pixelate Effect
function applyPixelate(imageData, pixelation) {
  if (pixelation <= 0) return imageData;
  const width = imageData.width,
    height = imageData.height;
  const ctxTemp = document.createElement("canvas").getContext("2d");
  ctxTemp.canvas.width = width;
  ctxTemp.canvas.height = height;
  const scaledW = Math.max(1, Math.floor(width / pixelation));
  const scaledH = Math.max(1, Math.floor(height / pixelation));
  ctxTemp.drawImage(imageDataToCanvas(imageData), 0, 0, scaledW, scaledH);
  ctxTemp.imageSmoothingEnabled = false;
  ctxTemp.drawImage(
    ctxTemp.canvas,
    0,
    0,
    scaledW,
    scaledH,
    0,
    0,
    width,
    height
  );
  return ctxTemp.getImageData(0, 0, width, height);
}

// 2. Comic Effect (using posterization)
function applyComic(imageData, intensity) {
  if (intensity <= 0) return imageData;
  return applyPosterize(imageData, 8);
}

// 3. Sketch Effect (edge detection and inversion)
function applySketch(imageData, intensity) {
  if (intensity <= 0) return imageData;
  const kernel = [-1, -1, -1, -1, 8, -1, -1, -1, -1];
  let edges = applyConvolution(imageData, kernel, 3);
  const data = edges.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];
    data[i + 1] = 255 - data[i + 1];
    data[i + 2] = 255 - data[i + 2];
  }
  return edges;
}

// 4. Watercolor Effect (blur and posterize)
function applyWatercolor(imageData, intensity) {
  if (intensity <= 0) return imageData;
  let result = applyNoiseReduction(imageData, 50);
  result = applyPosterize(result, 12);
  return result;
}

// 5. Glow Effect (using a blurred overlay)
function applyGlow(imageData, intensity) {
  if (intensity <= 0) return imageData;
  const canvasTemp = imageDataToCanvas(imageData);
  const ctxTemp = canvasTemp.getContext("2d");
  ctxTemp.globalAlpha = intensity / 100;
  ctxTemp.filter = `blur(${intensity}px)`;
  ctxTemp.drawImage(canvasTemp, 0, 0);
  return ctxTemp.getImageData(0, 0, imageData.width, imageData.height);
}

// 6. Mirror Effect (flip horizontally)
function applyMirror(imageData, mirrorEnabled) {
  if (!mirrorEnabled) return imageData;
  const canvasTemp = document.createElement("canvas");
  canvasTemp.width = imageData.width;
  canvasTemp.height = imageData.height;
  const ctxTemp = canvasTemp.getContext("2d");
  ctxTemp.translate(imageData.width, 0);
  ctxTemp.scale(-1, 1);
  ctxTemp.putImageData(imageData, 0, 0);
  return ctxTemp.getImageData(0, 0, imageData.width, imageData.height);
}

// 7. Swirl Effect (basic polar transform)
function applySwirl(imageData, intensity) {
  if (intensity <= 0) return imageData;
  const width = imageData.width,
    height = imageData.height;
  const src = imageData.data;
  const output = new Uint8ClampedArray(src.length);
  const cx = width / 2,
    cy = height / 2;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - cx,
        dy = y - cy;
      const r = Math.sqrt(dx * dx + dy * dy);
      const theta = Math.atan2(dy, dx) + (intensity / 100) * (r / width);
      const srcX = Math.round(cx + r * Math.cos(theta));
      const srcY = Math.round(cy + r * Math.sin(theta));
      const destIndex = (y * width + x) * 4;
      if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
        const srcIndex = (srcY * width + srcX) * 4;
        output[destIndex] = src[srcIndex];
        output[destIndex + 1] = src[srcIndex + 1];
        output[destIndex + 2] = src[srcIndex + 2];
        output[destIndex + 3] = src[srcIndex + 3];
      } else {
        output[destIndex] = src[destIndex];
        output[destIndex + 1] = src[destIndex + 1];
        output[destIndex + 2] = src[destIndex + 2];
        output[destIndex + 3] = src[destIndex + 3];
      }
    }
  }
  return new ImageData(output, width, height);
}

// 8. Kaleidoscope Effect (mirror halves)
function applyKaleidoscope(imageData, intensity) {
  if (intensity <= 0) return imageData;
  const width = imageData.width,
    height = imageData.height;
  const canvasTemp = document.createElement("canvas");
  canvasTemp.width = width;
  canvasTemp.height = height;
  const ctxTemp = canvasTemp.getContext("2d");
  ctxTemp.drawImage(
    imageDataToCanvas(imageData),
    0,
    0,
    width / 2,
    height,
    0,
    0,
    width / 2,
    height
  );
  ctxTemp.save();
  ctxTemp.scale(-1, 1);
  ctxTemp.drawImage(
    imageDataToCanvas(imageData),
    0,
    0,
    width / 2,
    height,
    -width,
    0,
    width / 2,
    height
  );
  ctxTemp.restore();
  return ctxTemp.getImageData(0, 0, width, height);
}

// 9. Mosaic Effect (group pixels into blocks)
function applyMosaic(imageData, blockSize) {
  if (blockSize <= 0) return imageData;
  const width = imageData.width,
    height = imageData.height;
  const src = imageData.data;
  const output = new Uint8ClampedArray(src.length);
  for (let y = 0; y < height; y += blockSize) {
    for (let x = 0; x < width; x += blockSize) {
      let r = 0,
        g = 0,
        b = 0,
        count = 0;
      for (let dy = 0; dy < blockSize; dy++) {
        for (let dx = 0; dx < blockSize; dx++) {
          const posX = x + dx,
            posY = y + dy;
          if (posX < width && posY < height) {
            const idx = (posY * width + posX) * 4;
            r += src[idx];
            g += src[idx + 1];
            b += src[idx + 2];
            count++;
          }
        }
      }
      r = Math.floor(r / count);
      g = Math.floor(g / count);
      b = Math.floor(b / count);
      for (let dy = 0; dy < blockSize; dy++) {
        for (let dx = 0; dx < blockSize; dx++) {
          const posX = x + dx,
            posY = y + dy;
          if (posX < width && posY < height) {
            const idx = (posY * width + posX) * 4;
            output[idx] = r;
            output[idx + 1] = g;
            output[idx + 2] = b;
            output[idx + 3] = src[idx + 3];
          }
        }
      }
    }
  }
  return new ImageData(output, width, height);
}

// 10. Solarize Effect (invert above threshold)
function applySolarize(imageData, threshold) {
  if (threshold <= 0) return imageData;
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > threshold) data[i] = 255 - data[i];
    if (data[i + 1] > threshold) data[i + 1] = 255 - data[i + 1];
    if (data[i + 2] > threshold) data[i + 2] = 255 - data[i + 2];
  }
  return imageData;
}

// 11. Retro Effect (apply sepia and desaturate)
function applyRetro(imageData, intensity) {
  if (intensity <= 0) return imageData;
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
    data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
    data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
  }
  return imageData;
}

// 12. Cartoon Effect (edge detection with posterization)
function applyCartoon(imageData, intensity) {
  if (intensity <= 0) return imageData;
  let quantized = applyPosterize(imageData, 8);
  const edgeKernel = [-1, -1, -1, -1, 8, -1, -1, -1, -1];
  let edges = applyConvolution(imageData, edgeKernel, 3);
  const data = edges.data;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > 50) {
      quantized.data[i] = 0;
      quantized.data[i + 1] = 0;
      quantized.data[i + 2] = 0;
    }
  }
  return quantized;
}

// 13. Crystallize Effect (using mosaic as approximation)
function applyCrystallize(imageData, intensity) {
  if (intensity <= 0) return imageData;
  return applyMosaic(imageData, Math.floor(intensity / 5) || 1);
}

// 14. Freeze Frame Effect (desaturate and boost contrast)
function applyFreezeFrame(imageData, intensity) {
  if (intensity <= 0) return imageData;
  let result = applyGrayscale(imageData);
  result = applyContrast(result, 120);
  return result;
}

// Basic grayscale for Freeze Frame
function applyGrayscale(imageData) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = data[i + 1] = data[i + 2] = avg;
  }
  return imageData;
}

// Basic contrast for Freeze Frame
function applyContrast(imageData, percent) {
  const data = imageData.data;
  const factor = (259 * (percent + 255)) / (255 * (259 - percent));
  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp(factor * (data[i] - 128) + 128, 0, 255);
    data[i + 1] = clamp(factor * (data[i + 1] - 128) + 128, 0, 255);
    data[i + 2] = clamp(factor * (data[i + 2] - 128) + 128, 0, 255);
  }
  return imageData;
}
