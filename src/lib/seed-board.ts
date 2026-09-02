/**
 * Seed members for the leaderboard, carried over from How to AI Games. Ruben is real;
 * everyone else is fictional. Paying members show name, photo and links. Anonymous
 * members show first name plus initial, greyed. Points are rescaled to this arena's
 * 1485-point range (the old board topped out near 3100).
 */

// [id, full name | null, short name | null, pravatar img | null, linkedin, x, all-time pts (old scale), week pts (old scale)]
type Raw = [string, string | null, string | null, number | null, boolean, boolean, number, number];

const R: Raw[] = [
  ["ruben", "Ruben Hassid", null, -1, true, true, 3120, 420],
  ["hugo", "Hugo Bergstrom", null, 59, false, false, 2350, 344],
  ["shaina", "Shaina Kalmanson", null, 47, true, false, 1980, 322],
  ["felix", "Felix Brandt", null, 12, true, false, 1640, 0],
  ["quinn", null, "Quinn S.", null, false, false, 1378, 194],
  ["marta", "Marta Osei", null, 32, true, false, 1314, 156],
  ["henrik", null, "Henrik O.", null, false, false, 1261, 0],
  ["leila", "Leila Haddad", null, 45, true, false, 1198, 137],
  ["oscar", "Oscar Delgado", null, 53, true, true, 1134, 0],
  ["lucas", "Lucas Meyer", null, 14, false, false, 1086, 116],
  ["yasmin", "Yasmin El-Sayed", null, 26, true, false, 1018, 148],
  ["julien", "Julien Lefebvre", null, 68, true, false, 962, 0],
  ["nadia", "Nadia Petrova", null, 9, false, false, 898, 71],
  ["wim", null, "Wim D.", null, false, false, 842, 86],
  ["stefan", null, "Stefan B.", null, false, false, 775, 0],
  ["jonas", "Jonas Vandenberg", null, 60, true, false, 716, 99],
  ["ivan", null, "Ivan P.", null, false, false, 684, 0],
  ["clara", null, "Clara A.", null, false, false, 661, 54],
  ["camille", "Camille Dubois", null, 25, true, true, 645, 0],
  ["anika", "Anika Sorensen", null, 38, true, false, 631, 61],
  ["jasmine", null, "Jasmine W.", null, false, false, 604, 0],
  ["gustav", null, "Gustav L.", null, false, false, 591, 40],
  ["pedro", null, "Pedro A.", null, false, false, 570, 0],
  ["quentin", null, "Quentin M.", null, false, false, 562, 61],
  ["olivier", null, "Olivier G.", null, false, false, 535, 0],
  ["nils", "Nils Eriksen", null, 15, true, false, 524, 44],
  ["zoe", null, "Zoe P.", null, false, false, 503, 0],
  ["adam", "Adam Kaplan", null, 33, true, false, 491, 50],
  ["brandon", "Brandon Schwartz", null, 51, true, false, 465, 0],
  ["carmen", null, "Carmen D.", null, false, false, 446, 30],
  ["yonathan", "Yonathan Cohen", null, 7, true, false, 430, 0],
  ["paulina", null, "Paulina W.", null, false, false, 421, 0],
  ["valentina", null, "Valentina R.", null, false, false, 399, 34],
  ["anisha", "Anisha Jain", null, 44, true, true, 377, 0],
  ["pete", "Pete Sena", null, 56, true, true, 362, 45],
  ["hana", null, "Hana K.", null, false, false, 348, 0],
  ["ida", null, "Ida S.", null, false, false, 325, 21],
  ["frida", null, "Frida A.", null, false, false, 308, 0],
  ["amara", "Amara Nwosu", null, 24, true, false, 293, 24],
  ["dmitri", "Dmitri Volkov", null, 66, false, false, 275, 0],
  ["grant", "Grant Hushek", null, 13, true, false, 266, 32],
  ["willem", null, "Willem B.", null, false, false, 236, 0],
  ["astrid", null, "Astrid H.", null, false, false, 222, 14],
  ["maya", null, "Maya A.", null, false, false, 196, 0],
  ["talia", null, "Talia G.", null, false, false, 186, 11],
  ["ulrich", null, "Ulrich W.", null, false, false, 179, 0],
  ["andre", "Andre Boucher", null, 11, true, false, 164, 18],
  ["isabela", "Isabela Cardoso", null, 29, true, false, 142, 0],
  ["mei", "Mei-Ling Chang", null, 41, true, false, 131, 7],
  ["ingrid", "Ingrid Halvorsen", null, 20, true, false, 120, 0],
  ["tomas", null, "Tomas V.", null, false, false, 102, 6],
  ["sara", null, "Sara L.", null, false, false, 86, 0],
  ["kwame", "Kwame Mensah", null, 70, false, false, 69, 11],
  ["lena", null, "Lena R.", null, false, false, 62, 8],
  ["omar", null, "Omar F.", null, false, false, 38, 0],
  ["elif", null, "Elif K.", null, false, false, 26, 7],
];

const SCALE = 0.45;
const scale = (n: number) => (n <= 0 ? 0 : Math.max(10, Math.round((n * SCALE) / 5) * 5));
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");

export interface SeedMember {
  id: string;
  /** full name for paying members, first name plus initial for anonymous ones */
  name: string;
  paid: boolean;
  avatar: string | null;
  linkedin: string | null;
  x: string | null;
  points: number;
  weekPoints: number;
  challenges: number;
}

export const SEED_MEMBERS: SeedMember[] = R.map(([id, name, short, img, li, x, allPts, weekPts]) => {
  const paid = name !== null;
  const handle = name ? slugify(name) : id;
  const points = scale(allPts);
  return {
    id: `seed-${id}`,
    name: name ?? short ?? id,
    paid,
    avatar: img === null ? null : img === -1 ? "/ruben.png" : `https://i.pravatar.cc/160?img=${img}`,
    linkedin: li ? (id === "ruben" ? "https://www.linkedin.com/in/ruben-hassid" : `https://www.linkedin.com/in/demo-${handle}`) : null,
    x: x ? (id === "ruben" ? "https://x.com/RubenHassid" : `https://x.com/${handle.replace(/-/g, "")}`) : null,
    points,
    weekPoints: scale(weekPts),
    challenges: Math.min(32, Math.max(1, Math.round(points / 46))),
  };
});
