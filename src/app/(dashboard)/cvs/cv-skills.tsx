"use client";

import { Plus, Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { groupSkills, LevelIndicator, masteryLevels } from "@/components/layout/skill-presentation";
import { Button } from "@/components/ui/button";

import type { EmployeeSkill, SkillCategory } from "../employees/[employeeId]/employee-profile-data";
import { skillMasteryLabels } from "../employees/[employeeId]/qualification-levels";
import { CvSkillDialog } from "./cv-skill-dialog";

export function CvSkills({ cvId, skills, ownerSkills, categories }: {
  cvId: string;
  skills: EmployeeSkill[];
  ownerSkills: EmployeeSkill[];
  categories: SkillCategory[];
}) {
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const toolbar = useRef<HTMLDivElement>(null);
  const firstSkill = useRef<HTMLButtonElement>(null);
  const headingId = useId();
  const groups = groupSkills(skills, categories);
  const names = new Set(skills.map(({ name }) => name));
  const options = ownerSkills.filter(({ name }) => !names.has(name));
  const selectedNames = selected.filter((name) => names.has(name));

  useEffect(() => {
    if (selecting) firstSkill.current?.focus();
  }, [selecting]);

  function exitSelection() {
    setSelecting(false);
    setSelected([]);
    toolbar.current?.focus();
  }

  return (
    <div className="space-y-8 pt-4">
      {skills.length === 0 && <p className="text-muted-foreground">No skills added yet</p>}
      {groups.map(({ id, name, items }) => {
        const header = `${headingId}-${id ?? "uncategorized"}`;
        return (
          <section key={id ?? "uncategorized"} aria-labelledby={header}>
            <h2 id={header} className="text-base">{name}</h2>
            <ul role="list" className="mt-4 grid gap-x-4 gap-y-1 @lg:grid-cols-2 @4xl:grid-cols-3">
              {items.map((skill) => {
                const pressed = selectedNames.includes(skill.name);
                const contents = (
                  <>
                    <LevelIndicator level={masteryLevels[skill.mastery]} />
                    <span className="min-w-0 wrap-anywhere">
                      <span className="block">{skill.name}</span>{" "}
                      <span className="block text-xs">{skillMasteryLabels[skill.mastery]}</span>
                    </span>
                  </>
                );
                const className = "h-auto min-h-12 w-full items-start justify-start gap-4 px-4 py-2 text-left text-base font-normal whitespace-normal text-muted-foreground aria-pressed:bg-[#f6dadd] aria-pressed:text-[#831b20]";
                return (
                  <li key={skill.name} className="min-w-0">
                    {selecting ? (
                      <Button variant="ghost" aria-pressed={pressed} className={className}
                        ref={skill === groups[0]?.items[0] ? firstSkill : undefined}
                        onClick={() => setSelected((prior) => pressed ? prior.filter((name) => name !== skill.name) : [...prior, skill.name])}>
                        {contents}
                      </Button>
                    ) : (
                      <CvSkillDialog cvId={cvId} intent={{ action: "update", skill }}
                        trigger={<Button variant="ghost" className={className}>{contents}</Button>}
                        onSaved={() => setAnnouncement(`${skill.name} updated`)} />
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
      <div ref={toolbar} tabIndex={-1} className="mt-12 flex flex-wrap items-center justify-end gap-x-6 gap-y-2">
        {selecting ? (
          <>
            <Button variant="ghost" className="h-11 px-4 uppercase" onClick={exitSelection}>Cancel</Button>
            <CvSkillDialog cvId={cvId} intent={{ action: "remove", names: selectedNames }}
              trigger={<Button variant="ghost" disabled={selectedNames.length === 0}
                className="h-11 gap-3 px-4 text-[#b31f24] uppercase">
                <Trash2 aria-hidden="true" /> Remove ({selectedNames.length})
              </Button>}
              onSaved={() => {
                setAnnouncement(`${selectedNames.length} ${selectedNames.length === 1 ? "skill" : "skills"} removed`);
                exitSelection();
              }} />
          </>
        ) : (
          <>
            <CvSkillDialog cvId={cvId} intent={{ action: "add", options }}
              trigger={<Button variant="ghost" className="h-11 gap-3 px-4 text-muted-foreground uppercase">
                <Plus aria-hidden="true" /> Add skill
              </Button>}
              onSaved={() => setAnnouncement("Skill added")} />
            <Button variant="ghost" disabled={skills.length === 0} className="h-11 gap-3 px-4 text-[#b31f24] uppercase"
              onClick={() => { setSelecting(true); setAnnouncement("Select skills to remove"); }}>
              <Trash2 aria-hidden="true" /> Remove skills
            </Button>
          </>
        )}
      </div>
      <p role="status" className="sr-only">{announcement}</p>
    </div>
  );
}
