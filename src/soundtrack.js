export const SOUNDTRACK = ['quattro-1.mp3', 'quattro-2.mp3', 'quattro-3.mp3'];

export function createSoundtrack(audio, base = '/audio/') {
  let index = -1, playing = false;
  audio.volume = .45;
  // Loading stays deferred until the player starts a race.
  audio.preload = 'none';
  const play = () => {
    // A pause or source change can cancel a pending play request. Autoplay
    // rejection can be retried on the next explicit player interaction.
    audio.play().catch(() => {});
  };
  function next() {
    index = (index + 1) % SOUNDTRACK.length;
    audio.src = base + SOUNDTRACK[index];
  }
  audio.addEventListener('ended', () => {
    next();
    if (playing) play();
  });
  return {
    beginRace() {
      audio.pause();
      playing = false;
      next();
    },
    setPlaying(active) {
      if (active === playing) return;
      playing = active;
      if (active && index >= 0) play();
      else audio.pause();
    },
    retry() {
      if (playing && audio.paused && index >= 0) play();
    },
  };
}
