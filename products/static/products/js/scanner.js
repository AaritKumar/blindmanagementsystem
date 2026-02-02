document.addEventListener('DOMContentLoaded', () => {
    
    /**
     * A sophisticated audio beacon that provides directional, proximity,
     * and centering cues for locating a QR code.
     */
    class DirectionalBeacon {
        constructor() {
            this.audioCtx = null;
            this.panner = null;
            this.gainNode = null;
            this.isInitialized = false;
        }

        _initAudio() {
            if (this.isInitialized) return;
            // Best practice: Create AudioContext after a user gesture.
            // In our case, the 'gesture' is the app detecting a QR code for the first time.
            try {
                this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                this.panner = this.audioCtx.createStereoPanner();
                this.gainNode = this.audioCtx.createGain();
                
                this.gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
                this.panner.connect(this.gainNode);
                this.gainNode.connect(this.audioCtx.destination);
                this.isInitialized = true;
            } catch (e) {
                console.error("Web Audio API is not supported in this browser.", e);
            }
        }

        /**
         * Plays a single "ping" sound with spatial panning and pitch modulation.
         * The sound has a soft attack and decay to be less jarring.
         * @param {number} pan - Stereo pan, from -1 (left) to 1 (right).
         * @param {number} pitch - The frequency of the beep in Hz.
         * @param {number} duration - The duration of the beep in seconds.
         */
        beep(pan, pitch, duration = 0.15) {
            if (!this.isInitialized) this._initAudio();
            if (!this.audioCtx) return; // Exit if AudioContext failed to initialize.
            
            const now = this.audioCtx.currentTime;
            this.panner.pan.setValueAtTime(pan, now);

            // Create a pleasant "ping" sound using a gain envelope.
            this.gainNode.gain.cancelScheduledValues(now);
            this.gainNode.gain.setValueAtTime(0, now);
            this.gainNode.gain.linearRampToValueAtTime(1, now + 0.01); // Quick attack
            this.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration); // Smooth decay

            const oscillator = this.audioCtx.createOscillator();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(pitch, now);
            
            oscillator.connect(this.panner);
            oscillator.start(now);
            oscillator.stop(now + duration);
        }

        /** Plays a clear, distinct sound to indicate a successful scan. */
        playSuccess() {
            if (!this.isInitialized) this._initAudio();
            if (!this.audioCtx) return;

            const now = this.audioCtx.currentTime;
            const oscillator = this.audioCtx.createOscillator();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(1200, now);
            oscillator.connect(this.audioCtx.destination);
            oscillator.start(now);
            oscillator.stop(now + 0.2);
        }
    }
    
    /**
     * Manages the camera feed, QR code detection, and coordinates
     * with the DirectionalBeacon to provide user feedback.
     */
    class QRScanner {
        constructor() {
            this.video = document.getElementById('camera-feed');
            this.canvasElement = document.getElementById('canvas');
            this.canvas = this.canvasElement.getContext('2d');
            this.statusMessage = document.getElementById('status-message');
            this.beacon = new DirectionalBeacon();
            
            this.scanning = false;
            this.stream = null;
            this.lastBeepTime = 0;
            
            this.init();
        }

        init() {
            this.startScanner();
            window.addEventListener('beforeunload', () => this.stopScanner());
        }

        drawLine(begin, end, color) {
            this.canvas.beginPath();
            this.canvas.moveTo(begin.x, begin.y);
            this.canvas.lineTo(end.x, end.y);
            this.canvas.lineWidth = 4;
            this.canvas.strokeStyle = color;
            this.canvas.stroke();
        }

        tick() {
            if (!this.scanning || this.video.readyState !== this.video.HAVE_ENOUGH_DATA) {
                requestAnimationFrame(() => this.tick());
                return;
            }

            this.canvasElement.height = this.video.videoHeight;
            this.canvasElement.width = this.video.videoWidth;
            this.canvas.drawImage(this.video, 0, 0, this.canvasElement.width, this.canvasElement.height);
            const imageData = this.canvas.getImageData(0, 0, this.canvasElement.width, this.canvasElement.height);
            
            const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });

            this.canvas.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height); // Clear previous frame
            if (code) {
                this.handleQRCode(code);
            }
            
            requestAnimationFrame(() => this.tick());
        }

        handleQRCode(code) {
            const loc = code.location;
            this.drawLine(loc.topLeftCorner, loc.topRightCorner, "#FF3B58");
            this.drawLine(loc.topRightCorner, loc.bottomRightCorner, "#FF3B58");
            this.drawLine(loc.bottomRightCorner, loc.bottomLeftCorner, "#FF3B58");
            this.drawLine(loc.bottomLeftCorner, loc.topLeftCorner, "#FF3B58");

            // --- 1. Directional Cue (Panning) ---
            const qrCenterX = (loc.topLeftCorner.x + loc.topRightCorner.x) / 2;
            const pan = (qrCenterX / this.canvasElement.width) * 2 - 1; // -1 (left) to 1 (right)

            // --- 2. Proximity Cue (Beep Speed) ---
            const qrWidth = Math.abs(loc.topRightCorner.x - loc.topLeftCorner.x);
            const percentArea = (qrWidth * qrWidth) / (this.canvasElement.width * this.canvasElement.height);
            const proximity = Math.min(percentArea / 0.1, 1.0); // Normalize to 0-1 based on the 10% cutoff

            if (proximity >= 1.0) {
                this.statusMessage.textContent = "QR Code detected! Redirecting...";
                this.beacon.playSuccess();
                this.stopScanner();
                window.location.href = code.data;
                return;
            }
            
            // Refined exponential curve for beep interval. More intuitive.
            const maxInterval = 1000;
            const minInterval = 150;
            const interval = minInterval + (maxInterval - minInterval) * Math.pow(1 - proximity, 2);

            // --- 3. Centering Cue (Pitch) ---
            const basePitch = 660; // E5
            const peakPitch = 880; // A5
            const centeredness = 1 - Math.abs(pan); // 1 when centered, 0 at edges
            const pitch = basePitch + (peakPitch - basePitch) * centeredness;

            const now = Date.now();
            if (now - this.lastBeepTime > interval) {
                this.beacon.beep(pan, pitch);
                this.lastBeepTime = now;
            }
        }

        startScanner() {
            // Check for browser support first.
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                this.updateStatus("Camera access is not supported by your browser.");
                return;
            }

            navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
                .then(stream => {
                    this.stream = stream;
                    this.video.srcObject = stream;
                    this.video.setAttribute("playsinline", true); // Required for iOS Safari
                    this.video.play();
                    this.scanning = true;
                    this.updateStatus('Scanning for QR code...');
                    requestAnimationFrame(() => this.tick());
                })
                .catch(err => {
                    console.error("Error starting camera: ", err);
                    let message = "Could not start camera.";
                    // Provide more specific, helpful error messages.
                    if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                        message = "Camera permission was denied. Please grant permission in your browser settings.";
                    } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
                        message = "No camera was found on this device.";
                    } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
                        message = "The camera is currently in use by another application.";
                    }
                    this.updateStatus(message);
                });
        }

        stopScanner() {
            this.scanning = false;
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
            }
            this.updateStatus('Scanner deactivated.');
        }

        updateStatus(message) {
            this.statusMessage.textContent = message;
        }
    }

    new QRScanner();
});

