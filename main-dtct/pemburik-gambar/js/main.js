    document.addEventListener('DOMContentLoaded', function() {
      // Elemen DOM
      const fileInput = document.getElementById('file-input');
      const uploadArea = document.getElementById('upload-area');
      const controls = document.getElementById('controls');
      const previewContainer = document.getElementById('preview-container');
      const originalCanvas = document.getElementById('original-canvas');
      const resultCanvas = document.getElementById('result-canvas');
      const downloadBtn = document.getElementById('download-btn');
      
      // Sliders dan nilai
      const blurSlider = document.getElementById('blur-slider');
      const blurValue = document.getElementById('blur-value');
      const noiseSlider = document.getElementById('noise-slider');
      const noiseValue = document.getElementById('noise-value');
      const pixelateSlider = document.getElementById('pixelate-slider');
      const pixelateValue = document.getElementById('pixelate-value');
      const brightnessSlider = document.getElementById('brightness-slider');
      const brightnessValue = document.getElementById('brightness-value');
      
      // Konteks canvas
      const originalCtx = originalCanvas.getContext('2d');
      const resultCtx = resultCanvas.getContext('2d');
      
      // Variabel untuk gambar
      let originalImage = null;
      
      // Event listener untuk upload area
      uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.style.backgroundColor = '#e8f4ff';
        uploadArea.style.borderColor = '#2980b9';
      });
      
      uploadArea.addEventListener('dragleave', function() {
        uploadArea.style.backgroundColor = '#f8fafc';
        uploadArea.style.borderColor = '#3498db';
      });
      
      uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.style.backgroundColor = '#f8fafc';
        uploadArea.style.borderColor = '#3498db';
        
        if (e.dataTransfer.files.length) {
          fileInput.files = e.dataTransfer.files;
          handleImageUpload();
        }
      });
      
      fileInput.addEventListener('change', handleImageUpload);
      
      // Fungsi untuk menangani upload gambar
      function handleImageUpload() {
        if (!fileInput.files || !fileInput.files[0]) return;
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
          originalImage = new Image();
          originalImage.onload = function() {
            // Atur ukuran canvas
            const maxWidth = 500;
            const scale = maxWidth / originalImage.width;
            
            originalCanvas.width = maxWidth;
            originalCanvas.height = originalImage.height * scale;
            
            resultCanvas.width = maxWidth;
            resultCanvas.height = originalImage.height * scale;
            
            // Gambar gambar asli
            originalCtx.drawImage(originalImage, 0, 0, originalCanvas.width, originalCanvas.height);
            
            // Salin ke canvas hasil
            resultCtx.drawImage(originalImage, 0, 0, resultCanvas.width, resultCanvas.height);
            
            // Tampilkan kontrol dan preview
            controls.classList.remove('hidden');
            previewContainer.classList.remove('hidden');
            downloadBtn.classList.remove('hidden');
            
            // Terapkan efek default
            applyEffects();
          };
          originalImage.src = e.target.result;
        };
        
        reader.readAsDataURL(fileInput.files[0]);
      }
      
      // Event listener untuk slider
      blurSlider.addEventListener('input', function() {
        blurValue.textContent = blurSlider.value;
        applyEffects();
      });
      
      noiseSlider.addEventListener('input', function() {
        noiseValue.textContent = noiseSlider.value;
        applyEffects();
      });
      
      pixelateSlider.addEventListener('input', function() {
        pixelateValue.textContent = pixelateSlider.value;
        applyEffects();
      });
      
      brightnessSlider.addEventListener('input', function() {
        brightnessValue.textContent = brightnessSlider.value + '%';
        applyEffects();
      });
      
      // Fungsi untuk menerapkan efek
      function applyEffects() {
        if (!originalImage) return;
        
        // Reset canvas hasil
        resultCtx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
        resultCtx.drawImage(originalImage, 0, 0, resultCanvas.width, resultCanvas.height);
        
        // Ambil nilai slider
        const blurAmount = parseFloat(blurSlider.value);
        const noiseAmount = parseInt(noiseSlider.value);
        const pixelateAmount = parseInt(pixelateSlider.value);
        const brightnessAmount = parseInt(brightnessSlider.value) / 100;
        
        // Terapkan efek blur
        if (blurAmount > 0) {
          resultCtx.filter = `blur(${blurAmount}px)`;
          resultCtx.drawImage(resultCanvas, 0, 0);
          resultCtx.filter = 'none';
        }
        
        // Terapkan efek noise (debu)
        if (noiseAmount > 0) {
          addNoise(resultCtx, resultCanvas.width, resultCanvas.height, noiseAmount);
        }
        
        // Terapkan efek pixelate
        if (pixelateAmount > 1) {
          pixelate(resultCtx, resultCanvas.width, resultCanvas.height, pixelateAmount);
        }
        
        // Terapkan efek brightness
        if (brightnessAmount !== 1) {
          adjustBrightness(resultCtx, resultCanvas.width, resultCanvas.height, brightnessAmount);
        }
        
        // Perbarui tombol download
        updateDownloadLink();
      }
      
      // Fungsi untuk menambahkan noise
      function addNoise(ctx, width, height, amount) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const length = data.length;
        
        for (let i = 0; i < length; i += 4) {
          if (Math.random() < amount / 100) {
            // Tambahkan noise acak
            const noise = Math.random() > 0.5 ? 255 : 0;
            data[i] = noise; // R
            data[i + 1] = noise; // G
            data[i + 2] = noise; // B
          }
        }
        
        ctx.putImageData(imageData, 0, 0);
      }
      
      // Fungsi untuk membuat efek pixelate
      function pixelate(ctx, width, height, blockSize) {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCanvas.width = width;
        tempCanvas.height = height;
        
        // Gambar gambar asli ke canvas sementara
        tempCtx.drawImage(resultCanvas, 0, 0);
        
        // Bersihkan canvas hasil
        ctx.clearRect(0, 0, width, height);
        
        // Gambar dengan efek pixelate
        for (let y = 0; y < height; y += blockSize) {
          for (let x = 0; x < width; x += blockSize) {
            // Ambil warna dari pixel tengah blok
            const pixelData = tempCtx.getImageData(x + blockSize / 2, y + blockSize / 2, 1, 1).data;
            
            // Gambar blok dengan warna yang sama
            ctx.fillStyle = `rgba(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]}, ${pixelData[3] / 255})`;
            ctx.fillRect(x, y, blockSize, blockSize);
          }
        }
      }
      
      // Fungsi untuk menyesuaikan kecerahan
      function adjustBrightness(ctx, width, height, amount) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, Math.max(0, data[i] * amount)); // R
          data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * amount)); // G
          data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * amount)); // B
        }
        
        ctx.putImageData(imageData, 0, 0);
      }
      
      // Fungsi untuk memperbarui link download
      function updateDownloadLink() {
        downloadBtn.href = resultCanvas.toDataURL('image/jpeg', 0.8);
        downloadBtn.download = 'gambar-burik.jpg';
      }
    });
