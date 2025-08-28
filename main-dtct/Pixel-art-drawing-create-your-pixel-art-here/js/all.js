    document.addEventListener('DOMContentLoaded', function() {
      // Elemen-elemen
      const canvas = document.getElementById('pixelCanvas');
      const ctx = canvas.getContext('2d');
      const colorPalette = document.getElementById('colorPalette');
      const colorPicker = document.getElementById('colorPicker');
      const currentColorDisplay = document.getElementById('currentColorDisplay');
      const clearBtn = document.getElementById('clearBtn');
      const exportBtn = document.getElementById('exportBtn');
      const gridSizeSlider = document.getElementById('gridSizeSlider');
      const pixelSizeSlider = document.getElementById('pixelSizeSlider');
      const gridSizeValue = document.getElementById('gridSizeValue');
      const pixelSizeValue = document.getElementById('pixelSizeValue');
      
      // Variabel untuk ukuran grid dan pixel
      let gridSize = parseInt(gridSizeSlider.value);
      let pixelSize = parseInt(pixelSizeSlider.value);
      
      // Array untuk menyimpan state pixel
      let pixelData = [];
      
      // Warna default dan mode
      let currentColor = '#ff0000';
      let isEraseMode = false;
      currentColorDisplay.style.backgroundColor = currentColor;
      
      // Palet warna yang diperbesar (16 warna + eraser)
      const colors = [
        'eraser', // Eraser tool
        '#f85149', // Red
        '#7c3aed', // Purple  
        '#1f6feb', // Blue
        '#238636', // Green
        '#da8b00', // Orange
        '#e3b341', // Yellow
        '#db61a2', // Pink
        '#39d353', // Light Green
        '#00d4ff', // Cyan
        '#8b5cf6', // Violet
        '#f97316', // Orange Red
        '#06b6d4', // Sky Blue
        '#ffffff', // White
        '#8b949e', // Gray
        '#000000' // Black
      ];
      
      // Inisialisasi palet warna
      function initColorPalette() {
        colorPalette.innerHTML = '';
        colors.forEach((color, index) => {
          const colorBox = document.createElement('div');
          colorBox.classList.add('color-box');
          
          if (color === 'eraser') {
            colorBox.classList.add('eraser');
            colorBox.innerHTML = '';
            colorBox.title = 'Penghapus - Klik untuk menghapus pixel';
          } else {
            colorBox.style.backgroundColor = color;
            colorBox.title = color;
          }
          
          colorBox.addEventListener('click', () => {
            if (color === 'eraser') {
              selectEraser(colorBox);
            } else {
              selectColor(color, colorBox);
            }
          });
          colorPalette.appendChild(colorBox);
        });
        
        // Pilih warna pertama (red) secara default
        const firstColorBox = document.querySelectorAll('.color-box')[1]; // Skip eraser
        if (firstColorBox) {
          firstColorBox.classList.add('selected');
        }
      }
      
      // Inisialisasi array pixel data
      function initPixelData() {
        pixelData = [];
        for (let x = 0; x < gridSize; x++) {
          pixelData[x] = [];
          for (let y = 0; y < gridSize; y++) {
            pixelData[x][y] = null; // null berarti transparan/kosong
          }
        }
      }
      
      // Update slider values
      gridSizeSlider.addEventListener('input', function() {
        gridSize = parseInt(this.value);
        gridSizeValue.textContent = `${gridSize} x ${gridSize}`;
        initPixelData();
        resizeCanvas();
      });
      
      pixelSizeSlider.addEventListener('input', function() {
        pixelSize = parseInt(this.value);
        pixelSizeValue.textContent = `${pixelSize}px`;
        resizeCanvas();
      });
      
      // Inisialisasi
      initColorPalette();
      initPixelData();
      resizeCanvas();
      
      // Event listeners
      colorPicker.addEventListener('input', function() {
        selectColor(this.value);
      });
      
      clearBtn.addEventListener('click', clearCanvas);
      exportBtn.addEventListener('click', exportToPNG);
      
      // Mouse events
      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', stopDrawing);
      canvas.addEventListener('mouseleave', stopDrawing);
      
      // Touch events untuk mobile
      canvas.addEventListener('touchstart', handleTouch);
      canvas.addEventListener('touchmove', handleTouch);
      canvas.addEventListener('touchend', stopDrawing);
      
      // Fungsi untuk mengubah ukuran kanvas
      function resizeCanvas() {
        canvas.width = gridSize * pixelSize;
        canvas.height = gridSize * pixelSize;
        redrawCanvas();
      }
      
      // Fungsi untuk menggambar ulang seluruh kanvas
      function redrawCanvas() {
        // Bersihkan kanvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Gambar latar belakang gelap
        ctx.fillStyle = '#161b22';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Gambar pixel yang sudah ada
        for (let x = 0; x < gridSize; x++) {
          for (let y = 0; y < gridSize; y++) {
            if (pixelData[x] && pixelData[x][y]) {
              ctx.fillStyle = pixelData[x][y];
              ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
            }
          }
        }
        
        // Gambar grid
        drawGrid();
      }
      
      // Fungsi untuk memilih warna
      function selectColor(color, colorBoxElement = null) {
        currentColor = color;
        isEraseMode = false;
        currentColorDisplay.style.backgroundColor = currentColor;
        currentColorDisplay.style.background = currentColor;
        colorPicker.value = color;
        canvas.style.cursor = 'crosshair';
        
        // Update tampilan palet yang terpilih
        document.querySelectorAll('.color-box').forEach(box => {
          box.classList.remove('selected');
        });
        
        if (colorBoxElement) {
          colorBoxElement.classList.add('selected');
        } else {
          // Cari jika warna ada di palet
          const colorBoxes = document.querySelectorAll('.color-box');
          for (let box of colorBoxes) {
            if (box.style.backgroundColor && rgbToHex(box.style.backgroundColor) === rgbToHex(currentColor)) {
              box.classList.add('selected');
              break;
            }
          }
        }
      }
      
      // Fungsi untuk memilih eraser
      function selectEraser(eraserBox) {
        isEraseMode = true;
        canvas.style.cursor = 'not-allowed';
        
        // Update tampilan eraser
        currentColorDisplay.style.background = 'linear-gradient(45deg, #ff4444 25%, transparent 25%), linear-gradient(-45deg, #ff4444 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ff4444 75%), linear-gradient(-45deg, transparent 75%, #ff4444 75%)';
        currentColorDisplay.style.backgroundSize = '8px 8px';
        currentColorDisplay.style.backgroundPosition = '0 0, 0 4px, 4px -4px, -4px 0px';
        
        // Update selection
        document.querySelectorAll('.color-box').forEach(box => {
          box.classList.remove('selected');
        });
        eraserBox.classList.add('selected');
      }
      
      // Konversi format warna
      function rgbToHex(color) {
        if (!color) return '#000000';
        
        // Jika sudah format hex, langsung return
        if (color.startsWith('#')) return color.toLowerCase();
        
        // Jika format rgb(r, g, b), konversi ke hex
        if (color.startsWith('rgb')) {
          const rgbValues = color.match(/\d+/g);
          if (rgbValues && rgbValues.length >= 3) {
            return '#' +
              parseInt(rgbValues[0]).toString(16).padStart(2, '0') +
              parseInt(rgbValues[1]).toString(16).padStart(2, '0') +
              parseInt(rgbValues[2]).toString(16).padStart(2, '0');
          }
        }
        
        return color;
      }
      
      // Variabel untuk melacak status drawing
      let isDrawing = false;
      
      function startDrawing(e) {
        isDrawing = true;
        draw(e);
      }
      
      // Fungsi draw
      function draw(e) {
        if (!isDrawing) return;
        
        const coords = getCanvasCoordinates(e);
        if (coords) {
          if (isEraseMode) {
            erasePixel(coords.x, coords.y);
          } else {
            drawPixel(coords.x, coords.y);
          }
        }
      }
      
      // Fungsi untuk mendapatkan koordinat kanvas yang akurat
      function getCanvasCoordinates(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        if (clientX === undefined || clientY === undefined) return null;
        
        const canvasX = (clientX - rect.left) * scaleX;
        const canvasY = (clientY - rect.top) * scaleY;
        
        const gridX = Math.floor(canvasX / pixelSize);
        const gridY = Math.floor(canvasY / pixelSize);
        
        // Pastikan koordinat berada dalam batas grid
        if (gridX >= 0 && gridX < gridSize && gridY >= 0 && gridY < gridSize) {
          return { x: gridX, y: gridY };
        }
        
        return null;
      }
      
      // Fungsi untuk menggambar pixel tunggal
      function drawPixel(gridX, gridY) {
        // Update data pixel
        if (!pixelData[gridX]) pixelData[gridX] = [];
        pixelData[gridX][gridY] = currentColor;
        
        // Gambar pixel pada kanvas
        ctx.fillStyle = currentColor;
        ctx.fillRect(gridX * pixelSize, gridY * pixelSize, pixelSize, pixelSize);
        
        // Gambar border grid untuk pixel ini
        ctx.strokeStyle = '#30363d';
        ctx.lineWidth = 1;
        ctx.strokeRect(gridX * pixelSize, gridY * pixelSize, pixelSize, pixelSize);
      }
      
      // Fungsi untuk menghapus pixel
      function erasePixel(gridX, gridY) {
        // Update data pixel
        if (!pixelData[gridX]) pixelData[gridX] = [];
        pixelData[gridX][gridY] = null;
        
        // Hapus pixel (gambar dengan warna background)
        ctx.fillStyle = '#161b22';
        ctx.fillRect(gridX * pixelSize, gridY * pixelSize, pixelSize, pixelSize);
        
        // Gambar border grid untuk pixel ini
        ctx.strokeStyle = '#30363d';
        ctx.lineWidth = 1;
        ctx.strokeRect(gridX * pixelSize, gridY * pixelSize, pixelSize, pixelSize);
      }
      
      function stopDrawing() {
        isDrawing = false;
      }
      
      // Handle touch events
      function handleTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' :
          e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
            clientX: touch.clientX,
            clientY: touch.clientY
          });
        
        if (e.type === 'touchstart') startDrawing(mouseEvent);
        else if (e.type === 'touchmove') draw(mouseEvent);
      }
      
      function clearCanvas() {
        initPixelData();
        redrawCanvas();
      }
      
      function drawGrid() {
        ctx.strokeStyle = '#30363d';
        ctx.lineWidth = 1;
        
        // Gambar garis vertikal
        for (let x = 0; x <= gridSize; x++) {
          ctx.beginPath();
          ctx.moveTo(x * pixelSize, 0);
          ctx.lineTo(x * pixelSize, canvas.height);
          ctx.stroke();
        }
        
        // Gambar garis horizontal
        for (let y = 0; y <= gridSize; y++) {
          ctx.beginPath();
          ctx.moveTo(0, y * pixelSize);
          ctx.lineTo(canvas.width, y * pixelSize);
          ctx.stroke();
        }
      }
      
      function exportToPNG() {
        // Buat kanvas sementara tanpa grid
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        // Set ukuran kanvas export (bisa lebih besar untuk kualitas lebih baik)
        const exportScale = 1;
        tempCanvas.width = gridSize * pixelSize * exportScale;
        tempCanvas.height = gridSize * pixelSize * exportScale;
        
        // Nonaktifkan antialiasing untuk pixel art yang tajam
        tempCtx.imageSmoothingEnabled = false;
        
        // Tambahkan latar belakang gelap
        tempCtx.fillStyle = '#161b22';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Gambar pixel-pixel
        for (let x = 0; x < gridSize; x++) {
          for (let y = 0; y < gridSize; y++) {
            if (pixelData[x] && pixelData[x][y]) {
              tempCtx.fillStyle = pixelData[x][y];
              tempCtx.fillRect(
                x * pixelSize * exportScale,
                y * pixelSize * exportScale,
                pixelSize * exportScale,
                pixelSize * exportScale
              );
            }
          }
        }
        
        // Generate filename dengan timestamp
        const now = new Date();
        const timestamp = now.getFullYear() +
          String(now.getMonth() + 1).padStart(2, '0') +
          String(now.getDate()).padStart(2, '0') + '_' +
          String(now.getHours()).padStart(2, '0') +
          String(now.getMinutes()).padStart(2, '0');
        
        // Buat link download
        const link = document.createElement('a');
        link.download = `pixel-art-${gridSize}x${gridSize}-${timestamp}.png`;
        link.href = tempCanvas.toDataURL('image/png');
        link.click();
      }
    });
