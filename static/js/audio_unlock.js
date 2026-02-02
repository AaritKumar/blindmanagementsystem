// static/js/audio_unlock.js
// This script is designed to solve the audio autoplay restrictions on mobile browsers, especially iOS Safari.
// The browser will not allow any audio to be played until the user interacts with the page (e.g., a tap).
// This script captures the very first tap anywhere on the site and uses it to silently create and resume
// a global AudioContext. This "unlocks" the ability for other scripts on other pages to play audio automatically.

(() => {
    // A global flag to ensure this setup runs only once per page load.
    if (window.audioContextUnlocked) {
        return;
    }

    const unlockAudioContext = () => {
        // Check if the context is already created and unlocked.
        if (window.audioContextUnlocked) {
            return;
        }

        // Create a new, silent AudioContext. This is the key to the solution.
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // A minimal sound buffer is required to "play" something to activate the context.
        const buffer = audioCtx.createBuffer(1, 1, 22050);
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.start(0);

        // On many mobile browsers, the AudioContext starts in a "suspended" state.
        // We must explicitly resume it to allow sound to play.
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        console.log('Audio context unlocked by user gesture.');
        window.audioContextUnlocked = true;

        // The job is done. Clean up the event listeners to avoid running this again.
        document.body.removeEventListener('click', unlockAudioContext);
        document.body.removeEventListener('touchend', unlockAudioContext);
        document.body.removeEventListener('keydown', unlockAudioContext);
    };

    // Listen for the first user interaction event.
    // We listen for multiple event types to be robust across devices.
    document.body.addEventListener('click', unlockAudioContext);
    document.body.addEventListener('touchend', unlockAudioContext);
    document.body.addEventListener('keydown', unlockAudioContext);
})();
