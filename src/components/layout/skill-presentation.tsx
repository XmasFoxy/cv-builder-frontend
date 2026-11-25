import type { EmployeeSkill, SkillCategory } from "@/app/(dashboard)/employees/[employeeId]/employee-profile-data";

export const masteryLevels = {
  Novice: { width: "20%", color: "#757575", track: "#cecece" },
  Advanced: { width: "40%", color: "#087bb4", track: "#b0d8eb" },
  Competent: { width: "60%", color: "#39793e", track: "#bbd4bb" },
  Proficient: { width: "80%", color: "#a96800", track: "#f3d895" },
  Expert: { width: "100%", color: "#bf3639", track: "#efc3c4" },
} satisfies Record<EmployeeSkill["mastery"], { width: string; color: string; track: string }>;

export function LevelIndicator({ level }: { level: (typeof masteryLevels)[EmployeeSkill["mastery"]] }) {
  return (
    <span aria-hidden="true" className="mt-2.5 h-1 w-14 shrink-0 @lg:w-20" style={{ backgroundColor: level.track }}>
      <span className="block h-full" style={{ width: level.width, backgroundColor: level.color }} />
    </span>
  );
}

export function groupSkills(skills: EmployeeSkill[], categories: SkillCategory[]) {
  const byCategory = new Map<string | null, EmployeeSkill[]>();
  const categoriesById = new Set(categories.map(({ id }) => id));
  for (const skill of skills) {
    const category = skill.categoryId && categoriesById.has(skill.categoryId) ? skill.categoryId : null;
    const items = byCategory.get(category) ?? [];
    items.push(skill);
    byCategory.set(category, items);
  }

  const groups = [...categories].sort((a, b) => a.order - b.order);
  return [...groups, { id: null, name: "Uncategorized" }].flatMap(({ id, name }) => {
    const items = byCategory.get(id);
    return items ? [{ id, name, items }] : [];
  });
}
