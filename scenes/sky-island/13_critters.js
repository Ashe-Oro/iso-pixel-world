/* =====================================================================
   Small visitors: the robin, the owl and the sky fish on the boy's line.
   ===================================================================== */
const RM = { h: '#4a3438', b: '#7a5a4e', r: '#f0703a', y: '#f4c040', w: '#f6e8dc' };
const ROBIN_PERCH = outl(smap(pad(['..hhh...', '.ywhhb..', '..rrbbbb', '..rrrbb.', '...rrb..', '...y.y..']), RM, 5, 7));
const ROBIN_FLY = [outl(smap(pad(['bb...bb.', '.bbhbb..', '..wrr...', '...r....']), RM, 5, 3)), outl(smap(pad(['...hh...', '.bwrrbb.', 'bb.rr.bb', '........']), RM, 5, 3))];
const OM = { b: '#5a5272', B: '#3c3654', f: '#b0aac8', y: CE('#ffd84a'), k: '#e0a050' };
const OWL_SIT = outl(smap(pad(['b.....b', 'bbbbbbb', 'byybyyb', 'byybyyb', 'bffkffb', 'Bfffffb', 'BBfffBB', '.B.B.B.']), OM, 4, 9));
const OWL_BLINK = outl(smap(pad(['b.....b', 'bbbbbbb', 'bbbbbbb', 'byybyyb', 'bffkffb', 'Bfffffb', 'BBfffBB', '.B.B.B.']), OM, 4, 9));
const OWL_FLY = [outl(smap(pad(['bbb...bbb', '.bbbbbbb.', '...yby...', '...BBB...']), OM, 5, 3)), outl(smap(pad(['.........', 'bbbbbbbbb', '...yby...', '...BBB...']), OM, 5, 3))];
const SFM = { b: '#6e8cb8', m: '#e2ecf2', e: '#1e1a2a', f: '#ffb49a' };
const FISH_HANG = [outl(smap(pad(['.mm.', 'bemb', 'bmmb', 'bmmb', '.bb.', 'f..f']), SFM, 2, 0)), outl(smap(pad(['.mm.', 'bemb', 'bmmb', 'bmmb', '.bb.', '.ff.']), SFM, 2, 0))];
const FISH_LIE = k => cached('fl' + k, () => { const rows = ['..bbbb...f', 'bemmmmbbff', '..bbbb...f'].map(r => '.'.repeat(Math.min(k, r.length)) + r.slice(k)); return outl(smap(pad(rows), SFM, 5, 4)); });
