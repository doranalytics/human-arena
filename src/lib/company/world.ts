/**
 * The arena world. Every learner enters as themselves, working at Halden Outdoor Co.
 * Everything here is fiction: the company, the people, the numbers.
 */
export const COMPANY = {
  name: "Halden Outdoor Co.",
  short: "Halden",
  tagline: "Packs, tents and layers for people who walk further.",
  hq: "Portland, Oregon",
  founded: 2011,
  headcount: 124,
  fiscalYear: "calendar",
};

export const PEOPLE = {
  priya: { name: "Priya Raman", role: "Chief Operating Officer", email: "priya.raman@haldenoutdoor.example" },
  marcus: { name: "Marcus Oyelaran", role: "Chief Financial Officer", email: "marcus.oyelaran@haldenoutdoor.example" },
  dana: { name: "Dana Whitfield", role: "Head of Product", email: "dana.whitfield@haldenoutdoor.example" },
  tomasz: { name: "Tomasz Nowak", role: "Supply Chain Lead", email: "tomasz.nowak@haldenoutdoor.example" },
  lena: { name: "Lena Fischer", role: "Marketing Director", email: "lena.fischer@haldenoutdoor.example" },
  sam: { name: "Sam Okafor", role: "IT Manager", email: "sam.okafor@haldenoutdoor.example" },
  june: { name: "June Castellanos", role: "Retail Partnerships", email: "june.castellanos@haldenoutdoor.example" },
};

/** The learner's role. `name` is substituted at runtime. */
export function personaBlurb(name: string) {
  return `${name} is an Operations Associate at ${COMPANY.name}, reporting to ${PEOPLE.priya.name} (${PEOPLE.priya.role}). Started three weeks ago.`;
}

export const USER_EMAIL = (name: string) => `${name.toLowerCase().split(/\s+/)[0] || "you"}@haldenoutdoor.example`;
