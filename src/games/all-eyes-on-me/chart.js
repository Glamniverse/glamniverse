// Full-song M3 choreography. These are authored strike beats, NOT spawn beats.
// Labels describe workout energy, not verified vocal/lyric sections.
export const GRID = { bpm: 125.28, offset: 0.005, laterBeat: 176, laterTime: 84.214, laterBpm: 125.94 }
// Later anchor follows the local spectral-flux pulse (90.407s, 110.429s, etc.).
export const beatTime = beat => beat < GRID.laterBeat
  ? GRID.offset + beat * 60 / GRID.bpm
  : GRID.laterTime + (beat-GRID.laterBeat) * 60 / GRID.laterBpm
export const SECTIONS = [
  {name:'Arrival', from:0, to:16, punches:'8:L 10:R 12:L 14:R'},
  {name:'Warm up', from:16, to:48, punches:'18:L 20:R 22:L 24:R 26:L 27:R 28:L 29:R 30:LH 31:RH 32:L 33:R 34:LS 35:RS 36:L 38:R'},
  {name:'Build', from:48, to:80, punches:'54:R 55:L 56:R 57:L 58:RS 59:LS 60:R 61:L 62:RH 63:LH 64:L 65:L 66:R 67:R 68:LS 70:RS'},
  {name:'First energy lift', from:80, to:112, punches:'86:L 87:R 88:L 89:R 90:LS 91:RS 92:LH 93:RH 94:L 95:R 96:L 97:R 98:LS 99:RS 100:L 100.5:R 101:L 102:R'},
  {name:'Sustained chorus', from:112, to:160, punches:'118:R 119:L 120:R 121:L 122:RS 123:LS 124:RH 125:LH 126:R 127:L 128:R 129:L 132:L 133:L 134:R 135:R 136:LS 137:RS 138:L 139:R 140:LH 141:RH 144:L 145:R 146:LS 147:RS 148:L 149:R 150:L'},
  {name:'Breathing phrase', from:160, to:192, punches:'166:R 168:L 170:R 172:L 174:RH 176:LH 178:RS 180:LS 182:R'},
  {name:'Second work block', from:192, to:240, punches:'198:L 199:R 200:L 201:R 202:LS 203:RS 204:LH 205:RH 206:L 207:R 208:L 209:R 212:R 213:R 214:L 215:L 216:RS 217:LS 218:R 219:L 220:RH 221:LH 224:L 225:R 226:LS 227:RS 228:L 229:R 230:L'},
  {name:'Recovery and restart', from:240, to:272, punches:'246:R 248:L 250:R 252:L 254:RS 256:LS 258:RH 260:LH 262:R'},
  {name:'Rebuild', from:272, to:304, punches:'278:L 279:R 280:L 281:R 282:LS 283:RS 284:LH 285:RH 286:L 287:L 288:R 289:R 290:LS 291:RS 292:L 294:R'},
  {name:'Long confidence block', from:304, to:352, punches:'310:R 311:L 312:R 313:L 314:RS 315:LS 316:RH 317:LH 318:R 319:L 322:L 323:R 324:L 325:R 326:LS 327:RS 328:LH 329:RH 332:R 333:L 334:RS 335:LS 336:R 337:L 338:RH 339:LH 340:L 342:R'},
  {name:'Final lift', from:352, to:400, punches:'358:L 359:R 360:L 361:R 362:LS 363:RS 364:LH 365:RH 366:L 367:R 368:L 369:R 372:R 373:L 374:RS 375:LS 376:R 377:L 378:RH 379:LH 380:L 381:R 384:LS 385:RS 386:L 386.5:R 387:L 388:R 390:L'},
  {name:'Final drive', from:400, to:440, punches:'406:R 407:L 408:R 409:L 410:RS 411:LS 412:RH 413:LH 414:R 415:L 418:L 419:R 420:LS 421:RS 422:L 423:R 424:LH 425:RH 426:L 427:R 428:L 428.5:R 429:L 430:R'},
  {name:'Last phrase and release', from:440, to:458, punches:'446:L 447:R 448:LS 449:RS 450:L 450.5:R 451:L 452:R'},
 ]
export const EVENTS = SECTIONS.flatMap(section => section.punches.split(' ').map(pair => {
  const [b,lane]=pair.split(':');const beat=Number(b)
  return {beat,hitAt:beatTime(beat),lane,hand:lane.startsWith('L')?'left':'right'}
}))
export const OBSTACLES = [
  [46,'duck'],[78,'left'],[110,'right'],[158,'duck'],[190,'left'],
  [238,'right'],[270,'duck'],[302,'left'],[350,'right'],[398,'duck'],[438,'left'],
].map(([beat,kind])=>({beat,at:beatTime(beat),kind}))
// Decorative pulses, scheduled sparsely; accent pairs only at selected lifts.
export const WAVES = [2,32,48,80,88,112,128,144,160,176,192,208,224,240,256,272,288,304,336,352,360,376,392,400,416,432,444].map(beat=>({beat,at:beatTime(beat)}))
