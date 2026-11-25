"use client";

import { RetryButton } from "@/components/layout/retry-button";
import { groupSkills, LevelIndicator, masteryLevels } from "@/components/layout/skill-presentation";

import { addQualification } from "./add-qualification-action";
import { AddQualificationDialog } from "./add-qualification-dialog";
import type { EmployeeLanguage, EmployeeSkill, SkillCategory, SkillOption } from "./employee-profile-data";
import { languageProficiencies, skillMasteryLabels, type Mastery, type Proficiency } from "./qualification-levels";

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
      <LevelIndicator level={indicator} />
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
  const groups = groupSkills(skills, categories);

  return (
    <div className="mx-auto max-w-[852px] space-y-8 pt-8">
      <h1 className="sr-only">Skills for {name}</h1>
      {skills.length === 0 && <p className="text-[#626262]">No skills added yet</p>}
      {groups.map(({ id, name: category, items }) => {
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
