(() => {
    if (window.audioContextUnlocked) {
        return;
    }

    const unlockAudioContext = () => {
        if (window.audioContextUnlocked) {
            return;
        }

        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        const buffer = audioCtx.createBuffer(1, 1, 22050);
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.start(0);

        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        window.audioContextUnlocked = true;

        document.body.removeEventListener('click', unlockAudioContext);
        document.body.removeEventListener('touchend', unlockAudioContext);
        document.body.removeEventListener('keydown', unlockAudioContext);
    };

    document.body.addEventListener('click', unlockAudioContext);
    document.body.addEventListener('touchend', unlockAudioContext);
    document.body.addEventListener('keydown', unlockAudioContext);
})();
