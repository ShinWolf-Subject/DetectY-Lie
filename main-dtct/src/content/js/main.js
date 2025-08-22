    let currentPlayer = null;
    
    function createApp() {
      document.body.innerHTML = `
                <div class="modal-overlay" id="nameModal">
                    <div class="modal">
                        <h2>Lie Detector</h2>
                        <p>Enter your name to start:</p>
                        <input type="text" id="playerNameInput" placeholder="Name..." maxlength="20">
                        <div class="modal-buttons">
                            <button class="modal-btn secondary" onclick="skipName()">Skip</button>
                            <button class="modal-btn primary" onclick="confirmName()">Start</button>
                        </div>
                    </div>
                </div>

                <div class="container">
                    <div class="player-name" id="playerDisplay" style="display: none;"></div>
                    
                    <div class="header">
                        <h1>Lie Detector</h1>
                        <p>Hold to scan fingerprint | <a href="https://shinwolf-subject.github.io/LT-Download/lie-dtct" target="_blank">Source Code</a></p>
                    </div>

                    <div class="question-area" id="questionArea">
                        <h3>State your claim</h3>
                        <textarea 
                            class="question-input" 
                            id="questionInput" 
                            placeholder="Type your statement here... (e.g., 'I am good at playing football')"
                            maxlength="100"
                        ></textarea>
                    </div>

                    <p class="scan-instruction" id="scanInstruction">Enter your statement, then hold to scan</p>

                    <div class="scanner-area" id="scannerArea">
                        <div class="fingerprint-container">
                            <img src="https://shinwolf-subject.github.io/DetectY-Lie/main-dtct/src/content/img/sample0.png" alt="fingerprint" class="fingerprint-image" />
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" id="progressFill"></div>
                        </div>
                        <div class="progress-text" id="progressText">0%</div>
                    </div>

                    <div class="result-area">
                        <div class="result" id="result"></div>
                        <div class="confidence" id="confidence"></div>
                        <button class="replay-button" id="replayButton" style="display: none;" onclick="replay()">Play Again</button>
                    </div>

                    <div class="info-box">
                        <h3>System Status</h3>
                        <p id="statusText">Ready to scan. Hold the fingerprint sensor to analyze.</p>
                    </div>
                </div>
            `;
    }
    
    function confirmName() {
      const nameInput = document.getElementById('playerNameInput');
      const playerName = nameInput.value.trim();
      
      if (playerName) {
        currentPlayer = playerName;
        document.getElementById('playerDisplay').textContent = playerName;
        document.getElementById('playerDisplay').style.display = 'block';
        console.log(`${playerName} joined the game`);
        closeModal();
      }
    }
    
    function skipName() {
      currentPlayer = "Anonymous";
      console.log(`Anonymous joined the game`);
      closeModal();
    }
    
    function closeModal() {
      document.getElementById('nameModal').style.display = 'none';
    }
    
    function replay() {
      // Reset all states without page refresh
      const detector = window.lieDetectorInstance;
      
      // Reset detector properties
      detector.isScanning = false;
      detector.hasScanned = false;
      
      // Reset UI elements
      detector.scannerArea.classList.remove('scanning', 'disabled');
      detector.questionArea.classList.remove('disabled');
      detector.questionInput.disabled = false;
      detector.questionInput.value = '';
      detector.scanInstruction.textContent = 'Enter your statement, then hold to scan';
      detector.progressFill.style.width = '0%';
      detector.progressText.textContent = '0%';
      detector.statusText.textContent = 'Ready to scan. Enter your statement above.';
      
      // Hide results and replay button
      detector.resultDiv.classList.remove('show', 'true', 'lie');
      detector.confidenceDiv.classList.remove('show');
      detector.resultDiv.textContent = '';
      detector.confidenceDiv.textContent = '';
      detector.replayButton.style.display = 'none';
      
      // Clear any running timers
      if (detector.holdTimer) {
        clearTimeout(detector.holdTimer);
        detector.holdTimer = null;
      }
      
      if (detector.progressTimer) {
        clearInterval(detector.progressTimer);
        detector.progressTimer = null;
      }
      
      console.log(`${currentPlayer || 'Anonymous'} started new game`);
    }
    
    class LieDetector {
      constructor() {
        this.scannerArea = document.getElementById('scannerArea');
        this.questionArea = document.getElementById('questionArea');
        this.questionInput = document.getElementById('questionInput');
        this.resultDiv = document.getElementById('result');
        this.confidenceDiv = document.getElementById('confidence');
        this.scanInstruction = document.getElementById('scanInstruction');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.replayButton = document.getElementById('replayButton');
        this.statusText = document.getElementById('statusText');
        
        this.isScanning = false;
        this.hasScanned = false;
        this.holdTimer = null;
        this.progressTimer = null;
        this.scanDuration = 3000;
        this.bindEvents();
      }
      
      bindEvents() {
        this.scannerArea.addEventListener('mousedown', (e) => {
          e.preventDefault();
          if (!this.hasScanned) {
            this.startHold();
          }
        });
        
        this.scannerArea.addEventListener('mouseup', () => {
          this.cancelHold();
        });
        
        this.scannerArea.addEventListener('mouseleave', () => {
          this.cancelHold();
        });
        
        this.scannerArea.addEventListener('touchstart', (e) => {
          e.preventDefault();
          if (!this.hasScanned) {
            this.startHold();
          }
        });
        
        this.scannerArea.addEventListener('touchend', () => {
          this.cancelHold();
        });
        
        document.getElementById('playerNameInput').addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            confirmName();
          }
        });
      }
      
      startHold() {
        if (this.isScanning || this.hasScanned) return;
        
        // Check if question is filled
        const question = this.questionInput.value.trim();
        if (!question) {
          this.statusText.textContent = 'Please enter a statement first.';
          return;
        }
        
        this.isScanning = true;
        this.scannerArea.classList.add('scanning');
        this.questionInput.disabled = true;
        this.questionArea.classList.add('disabled');
        this.scanInstruction.textContent = 'Scanning...';
        this.progressFill.style.width = '0%';
        this.progressText.textContent = '0%';
        this.statusText.textContent = 'Analyzing statement validity...';
        
        console.log(`${currentPlayer || 'Anonymous'} started scanning`);
        console.log(`Statement: "${question}"`);
        
        this.startProgress();
        
        this.holdTimer = setTimeout(() => {
          this.completeScan(question);
        }, this.scanDuration);
      }
      
      startProgress() {
        let progress = 0;
        this.progressTimer = setInterval(() => {
          if (this.isScanning) {
            progress += 2;
            this.progressFill.style.width = progress + '%';
            this.progressText.textContent = progress + '%';
            
            if (progress >= 100) {
              clearInterval(this.progressTimer);
            }
          }
        }, 60);
      }
      
      cancelHold() {
        if (!this.isScanning || this.hasScanned) return;
        
        if (this.holdTimer) {
          clearTimeout(this.holdTimer);
          this.holdTimer = null;
        }
        
        if (this.progressTimer) {
          clearInterval(this.progressTimer);
          this.progressTimer = null;
        }
        
        this.scannerArea.classList.remove('scanning');
        this.scanInstruction.textContent = 'Enter your statement, then hold to scan';
        this.progressFill.style.width = '0%';
        this.progressText.textContent = '0%';
        this.statusText.textContent = 'Scan cancelled. Ready to try again.';
        this.isScanning = false;
        
        console.log(`${currentPlayer || 'Anonymous'} cancelled scan`);
      }
      
      completeScan(question) {
        if (!this.isScanning) return;
        
        // Fixed random generation for more balanced results
        const randomValue = Math.random();
        const isTrue = randomValue > 0.4; // 60% chance for True, 40% for Lie
        const confidence = Math.floor(Math.random() * 20) + 80; // 80-99%
        
        this.scannerArea.classList.remove('scanning');
        this.hasScanned = true;
        this.scannerArea.classList.add('disabled');
        
        const resultText = isTrue ? 'True!' : 'Lie!';
        const playerName = currentPlayer || 'Anonymous';
        
        console.log(`${playerName} claimed: "${question}"`);
        console.log(`Result: ${resultText}`);
        
        this.statusText.textContent = `Analysis complete. "${question}" - Result: ${confidence}% confidence.`;
        
        setTimeout(() => {
          this.displayResult(isTrue, confidence);
        }, 300);
        
        setTimeout(() => {
          this.showReplay();
        }, 2000);
      }
      
      displayResult(isTrue, confidence) {
        const resultText = isTrue ? 'TRUE' : 'LIE';
        const resultClass = isTrue ? 'true' : 'lie';
        
        this.resultDiv.textContent = resultText;
        this.resultDiv.classList.add('show', resultClass);
        
        this.confidenceDiv.textContent = `${confidence}%`;
        this.confidenceDiv.classList.add('show');
        
        this.scanInstruction.textContent = 'Scan complete';
      }
      
      showReplay() {
        this.replayButton.style.display = 'inline-block';
        this.statusText.textContent = 'Analysis finished. Click "Play Again" to test a new statement.';
      }
    }
    
    document.addEventListener('DOMContentLoaded', () => {
      createApp();
      const detector = new LieDetector();
      window.lieDetectorInstance = detector; // Store globally for replay function
      console.log('Lie Detector ready');
    });
    
    window.confirmName = confirmName;
    window.skipName = skipName;
    window.replay = replay;
