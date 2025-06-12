// DOM elements
const uploadLeftBtn = document.getElementById('uploadLeft');
const uploadRightBtn = document.getElementById('uploadRight');
const takePhotoBtn = document.getElementById('takePhoto');
const cameraPreview = document.getElementById('cameraPreview');
const photoCaptureBtn = document.getElementById('photoCaptureBtn');
const autoAlignBtn = document.getElementById('autoAlign');
const generateSideBySideBtn = document.getElementById('generateSideBySide');
const generateAnaglyphBtn = document.getElementById('generateAnaglyph');
const generateWiggleBtn = document.getElementById('generateWiggle');
const saveResultBtn = document.getElementById('saveResult');

const leftCanvas = document.getElementById('leftCanvas');
const rightCanvas = document.getElementById('rightCanvas');
const resultCanvas = document.getElementById('resultCanvas');

const leftCtx = leftCanvas.getContext('2d');
const rightCtx = rightCanvas.getContext('2d');
const resultCtx = resultCanvas.getContext('2d');

let leftImage, rightImage;
let currentCameraSide = 'left'; // Track which side we're capturing

// Upload images
function handleImageUpload(canvas, ctx, e) {
  const file = e.target.files[0];
  if (!file) return;

  const img = new Image();
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    if (canvas.id === 'leftCanvas') leftImage = img;
    else rightImage = img;
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

// Camera capture
takePhotoBtn.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    cameraPreview.srcObject = stream;
    cameraPreview.style.display = 'block';
    photoCaptureBtn.style.display = 'block';
    takePhotoBtn.style.display = 'none';

    photoCaptureBtn.textContent = `Capture ${currentCameraSide} Image`;
  } catch (err) {
    alert('Error accessing camera: ' + err.message);
  }
});

photoCaptureBtn.addEventListener('click', () => {
  const canvas = currentCameraSide === 'left' ? leftCanvas : rightCanvas;
  const ctx = currentCameraSide === 'left' ? leftCtx : rightCtx;
  const img = new Image();

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
    cameraPreview.style.display = 'none';
    photoCaptureBtn.style.display = 'none';
    takePhotoBtn.style.display = 'block';
    currentCameraSide = 'left';

    // Stop camera stream
    const stream = cameraPreview.srcObject;
    stream.getTracks().forEach(track => track.stop());
  }
});

// Auto-align (simplified)
autoAlignBtn.addEventListener('click', () => {
  if (!leftImage || !rightImage) return alert('Upload both images first!');
  const maxWidth = Math.max(leftImage.width, rightImage.width);
  const maxHeight = Math.max(leftImage.height, rightImage.height);

  leftCanvas.width = rightCanvas.width = maxWidth;
  leftCanvas.height = rightCanvas.height = maxHeight;

  leftCtx.drawImage(leftImage, 0, 0, maxWidth, maxHeight);
  rightCtx.drawImage(rightImage, 0, 0, maxWidth, maxHeight);
});

// Generate side-by-side stereo
generateSideBySideBtn.addEventListener('click', () => {
  if (!leftImage || !rightImage) return alert('Upload both images first!');
  resultCanvas.width = leftCanvas.width * 2;
  resultCanvas.height = leftCanvas.height;
  resultCtx.drawImage(leftImage, 0, 0);
  resultCtx.drawImage(rightImage, leftCanvas.width, 0);
});

// Generate anaglyph (red/cyan)
generateAnaglyphBtn.addEventListener('click', () => {
  if (!leftImage || !rightImage) return alert('Upload both images first!');
  resultCanvas.width = leftCanvas.width;
  resultCanvas.height = leftCanvas.height;

  const leftData = leftCtx.getImageData(0, 0, leftCanvas.width, leftCanvas.height);
  const rightData = rightCtx.getImageData(0, 0, rightCanvas.width, rightCanvas.height);
  const resultData = resultCtx.createImageData(resultCanvas.width, resultCanvas.height);

  for (let i = 0; i < leftData.data.length; i += 4) {
    resultData.data[i] = leftData.data[i];       // Red from left
    resultData.data[i + 1] = rightData.data[i + 1]; // Green from right
    resultData.data[i + 2] = rightData.data[i + 2]; // Blue from right
    resultData.data[i + 3] = 255; // Alpha
  }

  resultCtx.putImageData(resultData, 0, 0);
});

// Generate wiggle GIF (using GIF.js)
generateWiggleBtn.addEventListener('click', () => {
  if (!leftImage || !rightImage) return alert('Upload both images first!');

  const gif = new GIF({
    workers: 2,
    quality: 10,
    width: leftCanvas.width,
    height: leftCanvas.height
  });

  // Add left and right frames
  gif.addFrame(leftCanvas, { delay: 200, copy: true });
  gif.addFrame(rightCanvas, { delay: 200, copy: true });

  gif.on('finished', (blob) => {
    const gifUrl = URL.createObjectURL(blob);
    resultCanvas.width = leftCanvas.width;
    resultCanvas.height = leftCanvas.height;
    const img = new Image();
    img.onload = () => resultCtx.drawImage(img, 0, 0);
    img.src = gifUrl;
    alert('Wiggle GIF generated! Click "Save Result" to download.');
  });

  gif.render();
});

// Save result
saveResultBtn.addEventListener('click', () => {
  if (!resultCanvas.width) return alert('Generate a result first!');
  const link = document.createElement('a');
  link.download = 'stereo-image.png';
  link.href = resultCanvas.toDataURL('image/png');
  link.click();
});
