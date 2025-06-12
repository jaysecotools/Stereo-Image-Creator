// DOM elements
const uploadLeftBtn = document.getElementById('uploadLeft');
const uploadRightBtn = document.getElementById('uploadRight');
const takePhotoBtn = document.getElementById('takePhoto');
const autoAlignBtn = document.getElementById('autoAlign');
const generateSideBySideBtn = document.getElementById('generateSideBySide');
const generateAnaglyphBtn = document.getElementById('generateAnaglyph');
const generateWiggleBtn = document.getElementById('generateWiggle');

const leftCanvas = document.getElementById('leftCanvas');
const rightCanvas = document.getElementById('rightCanvas');
const resultCanvas = document.getElementById('resultCanvas');

const leftCtx = leftCanvas.getContext('2d');
const rightCtx = rightCanvas.getContext('2d');
const resultCtx = resultCanvas.getContext('2d');

let leftImage, rightImage;

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

// Take photo (mobile)
takePhotoBtn.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();

    // Create a temporary canvas to capture photo
    const photoCanvas = document.createElement('canvas');
    const photoCtx = photoCanvas.getContext('2d');
    photoCanvas.width = 640;
    photoCanvas.height = 480;

    video.onplaying = () => {
      photoCtx.drawImage(video, 0, 0, photoCanvas.width, photoCanvas.height);
      const img = new Image();
      img.src = photoCanvas.toDataURL('image/png');
      img.onload = () => {
        leftCanvas.width = img.width;
        leftCanvas.height = img.height;
        leftCtx.drawImage(img, 0, 0);
        leftImage = img;
        stream.getTracks().forEach(track => track.stop());
      };
    };
  } catch (err) {
    alert('Error accessing camera: ' + err.message);
  }
});

// Auto-align (simplified - manual adjustments would be better)
autoAlignBtn.addEventListener('click', () => {
  if (!leftImage || !rightImage) return alert('Upload both images first!');
  // Placeholder: Just resize the smaller image to match the larger one
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

  // Simplified anaglyph: Red channel from left, Green/Blue from right
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

// Generate wiggle GIF (placeholder - would use a library like GIF.js)
generateWiggleBtn.addEventListener('click', () => {
  alert('Wiggle GIF requires a GIF encoder library. Would you like to add one?');
});
