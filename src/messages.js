// Race banter. Every pool is swapped at random so two races never read the
// same, and the result screen is written from here rather than hard-coded.
export const MESSAGES = {
  ready: [
    'READY WHEN YOU ARE',
    'HELMET ON. EGO OFF.',
    'THE PIT WALL BELIEVES IN YOU',
    'TYRE PRESSURES: VIBES',
    'DHH IS ALREADY ON POLE',
  ],
  lights: [
    'ENGINES READY',
    'FOUR RINGS. ONE FLAG.',
    'DHH IS CHECKING HIS MIRRORS. BRIEFLY.',
    'LAUNCH CONTROL: YOUR RIGHT FOOT',
    'THE WAFFLE IRON IS PREHEATED',
  ],
  racing: [
    'RACE ON · THREE LAPS TO GLORY',
    'RACE ON · THE ACE STARTED AHEAD, NOT FASTER',
    'RACE ON · APEXES ARE FREE, BARRIERS ARE NOT',
    'RACE ON · NITRO IS A PERSONALITY',
    'RACE ON · BRAKE LATER THAN IS SENSIBLE',
  ],
  flag: [
    'CHEQUERED FLAG · PODIUM PARTY',
    'CHEQUERED FLAG · SOMEONE FETCH THE WAFFLES',
    'CHEQUERED FLAG · THE TYRES NEED A LIE DOWN',
    'CHEQUERED FLAG · TELEMETRY SAYS: BOLD',
  ],
  final: [
    'RESULTS FINAL · SEE YOU ON THE NEXT GRID',
    'RESULTS FINAL · THE GRAVEL REMEMBERS EVERYTHING',
    'RESULTS FINAL · SCRUTINEERING FOUND ONLY CRUMBS',
    'RESULTS FINAL · SAME TIME NEXT LAP?',
  ],
  grace: [
    'Rivals are finishing their laps… (25 second grace period)',
    'Still out there, still convinced they had the pace…',
    'Holding the podium open for 25 seconds. Be nice.',
    'The stragglers are taking the scenic line…',
  ],
  // Result headlines by finishing position, and the one nobody expected.
  triumph: [
    'YOU BEAT DHH.',
    'THE ACE IS BEATEN.',
    'DHH FOLLOWED YOU HOME.',
    'POLE MEANT NOTHING TODAY.',
    'THE FLYING DANE, GROUNDED.',
  ],
  title: [
    ['ABSOLUTE WAFFLE CHAMPION.', 'FIRST. GLORIOUSLY FIRST.', 'THE ARENA IS YOURS.', 'NOBODY SAW WHICH WAY YOU WENT.'],
    ['P2. THE FIRST LOSER, ELEGANTLY.', 'P2. ONE APEX AWAY.', 'P2. THE PHOTO FINISH LIED.', 'P2. YOU WERE FASTER IN SPIRIT.'],
    ['P3. BRONZE IS A COLOUR TOO.', 'P3. THE PODIUM COUNTS THREE.', 'P3. HEROIC IN PLACES.', 'P3. THE MIDFIELD SALUTES YOU.'],
    ['P4. STILL A LEGEND.', 'P4. YOU FINISHED. THAT IS SOMETHING.', 'P4. THE GRAVEL WON THIS ONE.', 'P4. GREAT SCENERY BACK THERE.'],
  ],
  // Podium blocks, gold to bronze.
  podium: [
    ['WAFFLE CHAMPION', 'UNTOUCHABLE', 'ALREADY SPRAYING THE JUICE', 'FASTEST, LOUDEST, DONE'],
    ['VICTORY DANCE LOADING', 'SO CLOSE IT STINGS', 'BLAMES THE HAIRPIN', 'SILVER, BUT WITH ATTITUDE'],
    ['FIXING THE EXCUSES', 'BRONZE, TECHNICALLY METAL', 'FOUND EVERY BARRIER', 'WILL BE BACK, PROBABLY'],
  ],
};

// Deterministic when handed a stub, random in the game.
export function pick(list, random = Math.random) {
  return list[Math.min(list.length - 1, Math.floor(random() * list.length))];
}

// Headlines are position-based, unless the ace has been beaten — that outranks
// everything else on the board.
export function resultTitle(rank, beatAce, random = Math.random) {
  if (beatAce) return pick(MESSAGES.triumph, random);
  return pick(MESSAGES.title[Math.min(rank, MESSAGES.title.length) - 1], random);
}
