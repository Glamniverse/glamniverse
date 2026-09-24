// Fictional generic negativity, never fetched from social media.
export const COMMENTS = [
  "YOU'RE UGLY", 'NOT GOOD ENOUGH', 'NOBODY LIKES YOU', 'WHO ASKED?',
  'CRINGE', 'JUST QUIT', 'NOBODY CARES', 'TRY HARDER', "YOU'RE A JOKE",
  'SO EMBARRASSING', 'PATHETIC', "YOU'RE WEIRD", 'SO ANNOYING', 'DELETE THIS',
  'THIS IS AWFUL', "YOU CAN'T DO THIS", "YOU'LL NEVER MAKE IT", 'ZERO TALENT',
  "YOU'RE NOT SPECIAL", 'STOP TRYING', 'SO DESPERATE', 'WHAT A FLOP',
  'TOTAL FAILURE', 'YOU LOOK RIDICULOUS', "YOU'RE SO FAKE", 'GET A REAL JOB',
  "THIS AIN'T IT", 'YOU CALL THIS TALENT?', 'NO ONE WATCHES THIS',
  "YOU'RE TRYING TOO HARD", 'STAY IN YOUR LANE', 'WHY EVEN BOTHER?',
  'THIS IS SO BAD', 'PLEASE STOP', 'ABSOLUTELY NOT', 'LOL NICE TRY',
  'YOU REALLY POSTED THIS?', 'MID', 'BRO THOUGHT SHE ATE', 'THE DELUSION',
  "AIN'T NO WAY", 'GIRL... NO', 'BE SO FR',
]

// Deterministic shuffled bags. A new replay seed varies ONLY text, not geometry/time.
// No repetition within a bag, or across its boundary. Doubles get distinct text.
export function selectComments(count, seed) {
  let state = (seed >>> 0) || 1
  const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296 }
  const result = []
  while (result.length < count) {
    const bag = COMMENTS.map((_, i) => i)
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]
    }
    if (bag[0] === result.at(-1)) [bag[0], bag[1]] = [bag[1], bag[0]]
    for (const index of bag) { if (result.length < count) result.push(index) }
  }
  return result
}
