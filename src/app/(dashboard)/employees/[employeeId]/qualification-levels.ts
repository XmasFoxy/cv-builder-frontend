// Map Notion's labels to the five levels stored by the GraphQL API.
export const skillMasteryLabels = {
  Novice: "Beginner",
  Advanced: "Elementary",
  Competent: "Intermediate",
  Proficient: "Advanced",
  Expert: "Expert",
} as const;

export type Mastery = keyof typeof skillMasteryLabels;

export const languageProficiencies = ["A1", "A2", "B1", "B2", "C1", "C2", "Native"] as const;
export type Proficiency = (typeof languageProficiencies)[number];
