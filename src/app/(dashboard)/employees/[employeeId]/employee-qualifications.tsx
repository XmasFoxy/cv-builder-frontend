"use client";

import { RetryButton } from "@/components/layout/retry-button";

import { addQualification } from "./add-qualification-action";
import { AddQualificationDialog } from "./add-qualification-dialog";
import type { EmployeeLanguage, EmployeeSkill, SkillCategory, SkillOption } from "./employee-profile-data";
import { languageProficiencies, skillMasteryLabels, type Mastery, type Proficiency } from "./qualification-levels";

const masteryLevels = {
  Novice: { width: "20%", color: "#757575", track: "#cecece" },
  Advanced: { width: "40%", color: "#087bb4", track: "#b0d8eb" },
  Competent: { width: "60%", color: "#39793e", track: "#bbd4bb" },
  Proficient: { width: "80%", color: "#a96800", track: "#f3d895" },
  Expert: { width: "100%", color: "#bf3639", track: "#efc3c4" },
} satisfies Record<EmployeeSkill["mastery"], { width: string; color: string; track: string }>;

const proficiencyLevels = {
  A1: { ...masteryLevels.Novice, width: "14%" },
  A2: { ...masteryLevels.Advanced, width: "29%" },
  B1: { ...masteryLevels.Advanced, width: "43%" },
  B2: { ...masteryLevels.Competent, width: "57%" },
  C1: { ...masteryLevels.Proficient, width: "71%" },
  C2: { ...masteryLevels.Proficient, width: "86%" },
  Native: masteryLevels.Expert,
} satisfies Record<EmployeeLanguage["proficiency"], (typeof masteryLevels)[EmployeeSkill["mastery"]]>;

function LevelItem({ name, level, indicator }: {
  name: string;
  level: string;
  indicator: (typeof masteryLevels)[EmployeeSkill["mastery"]];
}) {
  return (
    <li className="flex min-w-0 items-start gap-4 py-2 text-[#626262]">
      <span aria-hidden="true" className="mt-2.5 h-1 w-14 shrink-0 @lg:w-20" style={{ backgroundColor: indicator.track }}>
        <span className="block h-full" style={{ width: indicator.width, backgroundColor: indicator.color }} />
      </span>
      <div className="min-w-0 wrap-anywhere">
        <p>{name}</p>
        <p className="text-xs">{level}</p>
      </div>
    </li>
  );
}

const grid = "mt-4 grid gap-x-6 px-4 @lg:grid-cols-2 @4xl:grid-cols-3";

function CatalogError({ kind }: { kind: string }) {
  return <div className="mt-8"><p role="alert">Failed to load the {kind} catalog</p><RetryButton /></div>;
}

export function EmployeeSkills({ skills, categories, name, userId, catalog }: {
  skills: EmployeeSkill[];
  categories: SkillCategory[];
  name: string;
  userId?: string;
  catalog?: SkillOption[] | null;
}) {
  const byCategory = new Map<string | null, EmployeeSkill[]>();
  const categoryIds = new Set(categories.map(({ id }) => id));
  for (const skill of skills) {
    const id = skill.categoryId && categoryIds.has(skill.categoryId) ? skill.categoryId : null;
    const items = byCategory.get(id) ?? [];
    items.push(skill);
    byCategory.set(id, items);
  }
  const groups = [...categories].sort((a, b) => a.order - b.order);

  return (
    <div className="mx-auto max-w-[852px] space-y-8 pt-8">
      <h1 className="sr-only">Skills for {name}</h1>
      {skills.length === 0 && <p className="text-[#626262]">No skills added yet</p>}
      {[...groups, { id: null, name: "Uncategorized" }].map(({ id, name: category }) => {
        const items = byCategory.get(id);
        if (!items) return null;

        return (
          <section key={id ?? "uncategorized"} aria-labelledby={`skill-category-${id ?? "uncategorized"}`}>
            <h2 id={`skill-category-${id ?? "uncategorized"}`}>{category}</h2>
            <ul role="list" className={grid}>
              {items.map((skill) => (
                <LevelItem key={skill.name} name={skill.name} level={skillMasteryLabels[skill.mastery]} indicator={masteryLevels[skill.mastery]} />
              ))}
            </ul>
          </section>
        );
      })}
      {catalog === null && <CatalogError kind="skill" />}
      {userId && catalog && (
        <AddQualificationDialog
          kind="skill"
          options={catalog.filter((option) => !skills.some((skill) => skill.name === option.name))}
          levels={Object.entries(skillMasteryLabels).map(([value, label]) => ({ value, label }))}
          add={(option, level) => addQualification(userId, {
            kind: "skill", name: option.name, categoryId: option.category.id, level: level as Mastery,
          })}
        />
      )}
    </div>
  );
}

export function EmployeeLanguages({ languages, name, userId, catalog }: {
  languages: EmployeeLanguage[];
  name: string;
  userId?: string;
  catalog?: { id: string; name: string }[] | null;
}) {
  return (
    <div className="mx-auto max-w-[852px] pt-8">
      <h1 className="sr-only">Languages for {name}</h1>
      <section aria-labelledby="current-languages">
        <h2 id="current-languages">Current Languages</h2>
        {languages.length === 0 ? (
          <p className="mt-4 text-[#626262]">No languages added yet</p>
        ) : (
          <ul role="list" className={grid}>
            {languages.map((language) => (
              <LevelItem
                key={language.name}
                name={language.name}
                level={language.proficiency}
                indicator={proficiencyLevels[language.proficiency]}
              />
            ))}
          </ul>
        )}
      </section>
      {catalog === null && <CatalogError kind="language" />}
      {userId && catalog && (
        <AddQualificationDialog
          kind="language"
          options={catalog.filter((option) => !languages.some((language) => language.name === option.name))}
          levels={languageProficiencies.map((level) => ({ value: level, label: level }))}
          add={(option, level) => addQualification(userId, { kind: "language", name: option.name, level: level as Proficiency })}
        />
      )}
    </div>
  );
}
