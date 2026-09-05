export const SOUNDTRACK = ['quattro-1.mp3', 'quattro-2.mp3', 'quattro-3.mp3'];
// One of these closes the race, once: the fanfare if the player beat the ace,
// the consolation number if they did not.
export const FINALE_TRACKS = {win:'quattro-winner.mp3', lose:'quattro-not-winner.mp3'};

export function createSoundtrack(audio, base = '/audio/') {
  let index = -1, playing = false, finale = false;
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
    // The closing track is a one-off; the race playlist keeps rolling.
    if (finale) { playing = false; return; }
    next();
    if (playing) play();
  });
  return {
    beginRace() {
      audio.pause();
      playing = false;
      finale = false;
      next();
    },
    finale(won) {
      if (finale) return;
      finale = true;
      audio.pause();
      audio.currentTime = 0;
      audio.src = base + (won ? FINALE_TRACKS.win : FINALE_TRACKS.lose);
      playing = true;
      play();
    },
    setPlaying(active) {
      if (active === playing) return;
      playing = active;
      if (active && (index >= 0 || finale)) play();
      else audio.pause();
    },
    retry() {
      if (playing && audio.paused && (index >= 0 || finale)) play();
    },
  };
}
