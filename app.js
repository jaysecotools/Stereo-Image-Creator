// DOM elements
const uploadLeftBtn = document.getElementById('uploadLeft');
const uploadRightBtn = document.getElementById('uploadRight');
const takePhotoBtn = document.getElementById('takePhoto');
const cameraSwitchBtn = document.getElementById('cameraSwitchBtn');
const photoCaptureBtn = document.getElementById('photoCaptureBtn');
const cameraPreview = document.getElementById('cameraPreview');
const cameraStatus = document.getElementById('cameraStatus');
const autoAlignBtn = document.getElementById('autoAlign');
const generateSideBySideBtn = document.getElementById('generateSideBySide');
const generateAnaglyphBtn = document.getElementById('generateAnaglyph');
const generateWiggleBtn = document.getElementById('generateWiggle');
const saveResultBtn = document.getElementById('saveResult');
const loadingGif = document.getElementById('loadingGif');

const leftCanvas = document.getElementById('leftCanvas');
const rightCanvas = document.getElementById('rightCanvas');
const resultCanvas = document.getElementById('resultCanvas');

const leftCtx = leftCanvas.getContext('2d');
const rightCtx = rightCanvas.getContext('2d');
const resultCtx = resultCanvas.getContext('2d');

// State variables
let leftImage = null;
let rightImage = null;
let currentCameraSide = 'left';
let currentStream = null;
let useFrontCamera = false;
let isGeneratingGif = false;

// Initialize canvas sizes
[leftCanvas, rightCanvas, resultCanvas].forEach(canvas => {
  canvas.width = 300;
  canvas.height = 200;
});

// Upload images
function handleImageUpload(canvas, ctx, e) {
  const file = e.target.files[0];
  if (!file) return;

  const img = new Image();
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    if (canvas.id === 'leftCanvas') {
      leftImage = img;
    } else {
      rightImage = img;
    }
    updateUI();
  };
  img.src = URL.createObjectURL(file);
}

uploadLeftBtn.addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = (e) => handleImageUpload(leftCanvas, leftCtx, e);
  input.click();
});

uploadRightBtn.addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = (e) => handleImageUpload(rightCanvas, rightCtx, e);
  input.click();
});

// Camera functions
async function startCamera(facingMode = 'environment') {
  try {
    // Stop any existing stream
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }

    const constraints = {
      video: { 
        facingMode: facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    cameraPreview.srcObject = stream;
    cameraPreview.style.display = 'block';
    photoCaptureBtn.style.display = 'inline-block';
    cameraSwitchBtn.style.display = 'inline-block';
    takePhotoBtn.style.display = 'none';
    currentStream = stream;
    cameraStatus.textContent = `Camera active (${useFrontCamera ? 'Front' : 'Rear'})`;

    photoCaptureBtn.textContent = `Capture ${currentCameraSide === 'left' ? 'Left' : 'Right'} Image`;
  } catch (err) {
    cameraStatus.textContent = `Camera error: ${err.message}`;
    console.error('Camera error:', err);
  }
}

takePhotoBtn.addEventListener('click', () => {
  startCamera(useFrontCamera ? 'user' : 'environment');
});

cameraSwitchBtn.addEventListener('click', () => {
  useFrontCamera = !useFrontCamera;
  startCamera(useFrontCamera ? 'user' : 'environment');
});

photoCaptureBtn.addEventListener('click', () => {
  if (!currentStream) return;
  
  const canvas = currentCameraSide === 'left' ? leftCanvas : rightCanvas;
  const ctx = currentCameraSide === 'left' ? leftCtx : rightCtx;

  canvas.width = cameraPreview.videoWidth;
  canvas.height = cameraPreview.videoHeight;
  ctx.drawImage(cameraPreview, 0, 0, canvas.width, canvas.height);

  if (currentCameraSide === 'left') {
    leftImage = new Image();
    leftImage.src = canvas.toDataURL('image/png');
    currentCameraSide = 'right';
    photoCaptureBtn.textContent = 'Capture Right Image';
  } else {
    rightImage = new Image();
    rightImage.src = canvas.toDataURL('image/png');
    stopCamera();
    currentCameraSide = 'left';
  }
  
  updateUI();
});

function stopCamera() {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
    currentStream = null;
  }
  cameraPreview.style.display = 'none';
  photoCaptureBtn.style.display = 'none';
  cameraSwitchBtn.style.display = 'none';
  takePhotoBtn.style.display = 'inline-block';
  cameraStatus.textContent = 'Camera not active';
}

// Image processing
autoAlignBtn.addEventListener('click', () => {
  if (!leftImage || !rightImage) {
    alert('Please upload both images first!');
    return;
  }

  const maxWidth = Math.max(leftImage.width, rightImage.width);
  const maxHeight = Math.max(leftImage.height, rightImage.height);

  leftCanvas.width = rightCanvas.width = maxWidth;
  leftCanvas.height = rightCanvas.height = maxHeight;

  leftCtx.drawImage(leftImage, 0, 0, maxWidth, maxHeight);
  rightCtx.drawImage(rightImage, 0, 0, maxWidth, maxHeight);
  
  // Update image references
  leftImage = new Image();
  leftImage.src = leftCanvas.toDataURL();
  rightImage = new Image();
  rightImage.src = rightCanvas.toDataURL();
});

generateSideBySideBtn.addEventListener('click', () => {
  if (!leftImage || !rightImage) {
    alert('Please upload both images first!');
    return;
  }

  resultCanvas.width = leftCanvas.width + rightCanvas.width;
  resultCanvas.height = Math.max(leftCanvas.height, rightCanvas.height);
  resultCtx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
  resultCtx.drawImage(leftImage, 0, 0);
  resultCtx.drawImage(rightImage, leftCanvas.width, 0);
  
  // Clear any previous GIF data
  delete resultCanvas.dataset.gifUrl;
});

generateAnaglyphBtn.addEventListener('click', () => {
  if (!leftImage || !rightImage) {
    alert('Please upload both images first!');
    return;
  }

  const maxWidth = Math.max(leftCanvas.width, rightCanvas.width);
  const maxHeight = Math.max(leftCanvas.height, rightCanvas.height);
  
  resultCanvas.width = maxWidth;
  resultCanvas.height = maxHeight;
  resultCtx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);

  // Create temporary canvases for consistent sizing
  const tempLeftCanvas = document.createElement('canvas');
  tempLeftCanvas.width = maxWidth;
  tempLeftCanvas.height = maxHeight;
  const tempLeftCtx = tempLeftCanvas.getContext('2d');
  tempLeftCtx.drawImage(leftImage, 0, 0, maxWidth, maxHeight);

  const tempRightCanvas = document.createElement('canvas');
  tempRightCanvas.width = maxWidth;
  tempRightCanvas.height = maxHeight;
  const tempRightCtx = tempRightCanvas.getContext('2d');
  tempRightCtx.drawImage(rightImage, 0, 0, maxWidth, maxHeight);

  const leftData = tempLeftCtx.getImageData(0, 0, maxWidth, maxHeight);
  const rightData = tempRightCtx.getImageData(0, 0, maxWidth, maxHeight);
  const resultData = resultCtx.createImageData(maxWidth, maxHeight);

  for (let i = 0; i < leftData.data.length; i += 4) {
    resultData.data[i] = leftData.data[i];         // Red from left
    resultData.data[i + 1] = rightData.data[i + 1]; // Green from right
    resultData.data[i + 2] = rightData.data[i + 2]; // Blue from right
    resultData.data[i + 3] = 255;                  // Alpha
  }

  resultCtx.putImageData(resultData, 0, 0);
  
  // Clear any previous GIF data
  delete resultCanvas.dataset.gifUrl;
});

// Fixed Wiggle GIF Generation
generateWiggleBtn.addEventListener('click', async () => {
  if (!leftImage || !rightImage) {
    alert('Please upload both images first!');
    return;
  }

  if (isGeneratingGif) {
    alert('Please wait - GIF is already being generated');
    return;
  }

  isGeneratingGif = true;
  loadingGif.style.display = 'block';
  generateWiggleBtn.disabled = true;

  try {
    // 1. Prepare images with consistent sizing
    const maxWidth = Math.max(leftImage.width, rightImage.width);
    const maxHeight = Math.max(leftImage.height, rightImage.height);

    // Create temporary canvases
    const tempLeftCanvas = document.createElement('canvas');
    tempLeftCanvas.width = maxWidth;
    tempLeftCanvas.height = maxHeight;
    const tempLeftCtx = tempLeftCanvas.getContext('2d');
    tempLeftCtx.drawImage(leftImage, 0, 0, maxWidth, maxHeight);

    const tempRightCanvas = document.createElement('canvas');
    tempRightCanvas.width = maxWidth;
    tempRightCanvas.height = maxHeight;
    const tempRightCtx = tempRightCanvas.getContext('2d');
    tempRightCtx.drawImage(rightImage, 0, 0, maxWidth, maxHeight);

    // 2. Initialize GIF.js with explicit worker path
    const gif = new GIF({
      workers: 2,
      quality: 15, // Slightly better quality
      width: maxWidth,
      height: maxHeight,
      workerScript: 'https://cdn.jsdelivr.net/npm/gif.js/dist/gif.worker.js'
    });

    // 3. Add frames with slight delay between them
    gif.addFrame(tempLeftCanvas, { delay: 150 });
    gif.addFrame(tempRightCanvas, { delay: 150 });

    // 4. Render the GIF
    const gifBlob = await new Promise((resolve, reject) => {
      gif.on('finished', blob => resolve(blob));
      gif.on('abort', () => reject(new Error('GIF generation aborted')));
      gif.render();
    });

    // 5. Display the result
    const gifUrl = URL.createObjectURL(gifBlob);
    resultCanvas.width = maxWidth;
    resultCanvas.height = maxHeight;
    
    const img = new Image();
    img.onload = () => {
      resultCtx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
      resultCtx.drawImage(img, 0, 0);
      resultCanvas.dataset.gifUrl = gifUrl; // Store for saving
    };
    img.src = gifUrl;

  } catch (error) {
    console.error('GIF generation failed:', error);
    alert(`Failed to generate GIF: ${error.message}`);
  } finally {
    loadingGif.style.display = 'none';
    generateWiggleBtn.disabled = false;
    isGeneratingGif = false;
  }
});

saveResultBtn.addEventListener('click', () => {
  if (resultCanvas.width === 0 || resultCanvas.height === 0) {
    alert('No result to save! Generate an image first.');
    return;
  }

  let url, filename;
  
  if (resultCanvas.dataset.gifUrl) {
    // Save GIF
    url = resultCanvas.dataset.gifUrl;
    filename = 'stereo-image.gif';
  } else {
    // Save PNG
    url = resultCanvas.toDataURL('image/png');
    filename = 'stereo-image.png';
  }

  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// Helper function to update UI state
function updateUI() {
  const hasBothImages = leftImage && rightImage;
  autoAlignBtn.disabled = !hasBothImages;
  generateSideBySideBtn.disabled = !hasBothImages;
  generateAnaglyphBtn.disabled = !hasBothImages;
  generateWiggleBtn.disabled = !hasBothImages || isGeneratingGif;
  saveResultBtn.disabled = resultCanvas.width === 0;
}

// Initialize
updateUI();
