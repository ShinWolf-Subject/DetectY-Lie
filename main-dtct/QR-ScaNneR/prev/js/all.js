    document.addEventListener('DOMContentLoaded', function() {
      // Elements
      const dropdownToggle = document.getElementById('dropdown-toggle');
      const dropdownMenu = document.getElementById('dropdown-menu');
      const uploadSections = document.querySelectorAll('.upload-section');
      const fileUpload = document.getElementById('file-upload');
      const cameraCapture = document.getElementById('camera-capture');
      const dropZone = document.getElementById('drop-zone');
      const video = document.getElementById('video');
      const cameraToggle = document.getElementById('camera-toggle');
      const switchCamera = document.getElementById('switch-camera');
      const resultDiv = document.getElementById('result');
      const cameraPlaceholder = document.getElementById('camera-placeholder');
      const scannerOverlay = document.getElementById('scanner-overlay');
      const permissionInfo = document.getElementById('permission-info');
      
      // Variables
      let cameraActive = false;
      let stream = null;
      let scanningInterval = null;
      let redirectTimer = null;
      let availableCameras = [];
      let currentCameraIndex = 0;
      
      // Dropdown functionality
      dropdownToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
      });
      
      document.addEventListener('click', function() {
        dropdownMenu.classList.remove('show');
      });
      
      // Mode switching
      document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', function() {
          const mode = this.dataset.mode;
          switchMode(mode);
          dropdownMenu.classList.remove('show');
        });
      });
      
      function switchMode(mode) {
        // Hide all upload sections
        uploadSections.forEach(section => section.classList.remove('active'));
        
        // Show selected mode
        document.getElementById(mode + '-mode').classList.add('active');
        
        // Setup mode-specific functionality
        if (mode === 'drag') {
          setupDragAndDrop();
        }
      }
      
      // File upload handlers
      fileUpload.addEventListener('change', handleFileSelect);
      cameraCapture.addEventListener('change', handleFileSelect);
      
      function handleFileSelect(e) {
        const files = e.target.files;
        if (files && files.length > 0) {
          processFile(files[0]);
        }
      }
      
      // Drag and drop setup
      function setupDragAndDrop() {
        dropZone.addEventListener('click', () => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = (e) => {
            if (e.target.files.length > 0) {
              processFile(e.target.files[0]);
            }
          };
          input.click();
        });
        
        dropZone.addEventListener('dragover', function(e) {
          e.preventDefault();
          dropZone.classList.add('drag-over');
        });
        
        dropZone.addEventListener('dragleave', function() {
          dropZone.classList.remove('drag-over');
        });
        
        dropZone.addEventListener('drop', function(e) {
          e.preventDefault();
          dropZone.classList.remove('drag-over');
          
          const files = e.dataTransfer.files;
          if (files.length > 0) {
            processFile(files[0]);
          }
        });
      }
      
      function processFile(file) {
        if (!file.type.startsWith('image/')) {
          showResult('error', 'File harus berupa gambar');
          return;
        }
        
        showResult('pending', 'Memproses gambar...', true);
        
        const img = new Image();
        img.onload = function() {
          processImage(img);
        };
        img.onerror = function() {
          showResult('error', 'Tidak dapat memuat gambar');
        };
        img.src = URL.createObjectURL(file);
      }
      
      // Camera functionality
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showResult('error', 'Kamera tidak didukung di browser ini');
        cameraToggle.disabled = true;
      } else {
        getCameras();
      }
      
      async function getCameras() {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          availableCameras = devices.filter(device => device.kind === 'videoinput');
          
          if (availableCameras.length > 1) {
            switchCamera.style.display = 'inline-block';
          }
        } catch (error) {
          console.log('Could not enumerate devices:', error);
        }
      }
      
      cameraToggle.addEventListener('click', function() {
        if (cameraActive) {
          stopCamera();
        } else {
          startCamera();
        }
      });
      
      switchCamera.addEventListener('click', function() {
        if (availableCameras.length > 1) {
          currentCameraIndex = (currentCameraIndex + 1) % availableCameras.length;
          if (cameraActive) {
            stopCamera();
            setTimeout(() => startCamera(), 100);
          }
        }
      });
      
      async function startCamera() {
        showResult('pending', 'Mengaktifkan kamera...', true);
        permissionInfo.style.display = 'block';
        cameraToggle.disabled = true;
        
        const constraints = [
          { video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } } },
          { video: { width: { ideal: 640 }, height: { ideal: 480 } } },
          { video: true }
        ];
        
        if (availableCameras.length > 0) {
          constraints.unshift({
            video: {
              deviceId: { exact: availableCameras[currentCameraIndex].deviceId },
              width: { ideal: 640 },
              height: { ideal: 480 }
            }
          });
        }
        
        for (let constraint of constraints) {
          try {
            stream = await navigator.mediaDevices.getUserMedia(constraint);
            
            video.srcObject = stream;
            video.style.display = 'block';
            cameraPlaceholder.style.display = 'none';
            scannerOverlay.style.display = 'block';
            
            await new Promise((resolve) => {
              video.addEventListener('loadedmetadata', resolve, { once: true });
            });
            
            cameraActive = true;
            cameraToggle.innerHTML = '<i class="fas fa-stop"></i> Matikan Kamera';
            cameraToggle.disabled = false;
            permissionInfo.style.display = 'none';
            
            showResult('', 'Arahkan kamera ke QR Code');
            getCameras();
            
            scanningInterval = setInterval(scanVideoFrame, 300);
            return;
            
          } catch (error) {
            continue;
          }
        }
        
        handleCameraError();
      }
      
      function handleCameraError() {
        cameraToggle.disabled = false;
        permissionInfo.style.display = 'none';
        showResult('error', 'Tidak dapat mengakses kamera. Coba refresh halaman atau gunakan upload gambar.');
      }
      
      function stopCamera() {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          stream = null;
        }
        
        if (scanningInterval) {
          clearInterval(scanningInterval);
          scanningInterval = null;
        }
        
        cameraActive = false;
        cameraToggle.innerHTML = '<i class="fas fa-play"></i> Aktifkan Kamera';
        cameraToggle.disabled = false;
        
        video.srcObject = null;
        video.style.display = 'none';
        cameraPlaceholder.style.display = 'flex';
        scannerOverlay.style.display = 'none';
        permissionInfo.style.display = 'none';
        
        showResult('', 'Pilih gambar atau aktifkan kamera untuk scan QR Code');
      }
      
      function scanVideoFrame() {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          if (canvas.width > 0 && canvas.height > 0) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code && code.data) {
              handleValidQRCode(code.data);
            }
          }
        }
      }
      
      function processImage(img) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code && code.data) {
          handleValidQRCode(code.data);
        } else {
          showResult('error', 'QR Code tidak ditemukan dalam gambar');
        }
      }
      
      function handleValidQRCode(data) {
        if (redirectTimer) clearTimeout(redirectTimer);
        if (scanningInterval) {
          clearInterval(scanningInterval);
          scanningInterval = null;
        }
        
        let isUrl = false;
        let validUrl = data;
        
        try {
          if (data.startsWith('http://') || data.startsWith('https://')) {
            new URL(data);
            isUrl = true;
            validUrl = data;
          } else if (data.includes('.')) {
            validUrl = 'https://' + data;
            new URL(validUrl);
            isUrl = true;
          }
        } catch (e) {
          isUrl = false;
        }
        
        if (isUrl) {
          showResult('success', `QR Code Valid! URL: ${validUrl}<div class="redirect-countdown">Redirect dalam 2 detik...</div>`);
          
          let countdown = 2;
          redirectTimer = setInterval(() => {
            countdown--;
            const countdownEl = document.querySelector('.redirect-countdown');
            if (countdownEl) {
              countdownEl.textContent = countdown > 0 ? `Redirect dalam ${countdown} detik...` : 'Mengarahkan...';
            }
            
            if (countdown <= 0) {
              clearInterval(redirectTimer);
              window.open(validUrl, '_blank');
            }
          }, 1000);
        } else {
          showResult('success', `QR Code Terdeteksi! Isi: ${data}`);
        }
        
        if (cameraActive) {
          setTimeout(() => stopCamera(), 1000);
        }
      }
      
      function showResult(type, message, showSpinner = false) {
        resultDiv.className = `result ${type}`;
        
        if (showSpinner) {
          resultDiv.innerHTML = '<div class="spinner"></div><p>' + message + '</p>';
        } else {
          resultDiv.innerHTML = '<p>' + message + '</p>';
        }
      }
      
      // Initialize drag and drop
      setupDragAndDrop();
      
      // Page visibility handling
      document.addEventListener('visibilitychange', function() {
        if (document.hidden && scanningInterval) {
          clearInterval(scanningInterval);
          scanningInterval = null;
        } else if (!document.hidden && cameraActive && !scanningInterval) {
          scanningInterval = setInterval(scanVideoFrame, 300);
        }
      });
      
      // Cleanup
      window.addEventListener('beforeunload', function() {
        stopCamera();
      });
    });
