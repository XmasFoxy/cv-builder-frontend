import type { ReactNode } from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import type { CvPreviewDocumentData } from "./cv-preview-model";

export function CvPreviewDocument({ cv, action }: { cv: CvPreviewDocumentData; action?: ReactNode }) {
  return (
    <article className="cv-preview" data-cv-preview-document>
      <style>{previewStyles}</style>
      <header className="cv-preview-header">
        <div>
          <h2>{cv.employee}</h2>
          <p className="cv-preview-position">{cv.position}</p>
        </div>
        {action}
      </header>

      <div className="cv-preview-columns">
        <section aria-label="General information" className="cv-preview-stack">
          <PreviewField label="Education">{cv.education}</PreviewField>
          {cv.languages.length > 0 && (
            <PreviewField label="Language proficiency">
              <ul className="cv-preview-plain-list">
                {cv.languages.map(({ name, proficiency }) => <li key={name}>{name} — {proficiency}</li>)}
              </ul>
            </PreviewField>
          )}
          {cv.domains.length > 0 && <PreviewField label="Domains">{cv.domains.join(", ")}</PreviewField>}
        </section>

        <section aria-label="Summary and skills" className="cv-preview-stack">
          <PreviewField label={cv.name}>{cv.description}</PreviewField>
          {cv.skillGroups.map(({ id, name, skills }) => (
            <PreviewField key={id ?? ""} label={name}>{skills.map((skill) => skill.name).join(", ")}</PreviewField>
          ))}
        </section>
      </div>

      {cv.projects.length > 0 && (
        <section className="cv-preview-section">
          <h3>Projects</h3>
          {cv.projects.map((project) => (
            <section key={project.id} aria-label={project.name} className="cv-preview-columns">
              <div className="cv-preview-stack">
                <h4 className="cv-preview-project-name">{project.name}</h4>
                <p>{project.description}</p>
              </div>
              <div className="cv-preview-stack">
                {project.roles.length > 0 && <PreviewField label="Project roles">{project.roles.join(", ")}</PreviewField>}
                <PreviewField label="Period">{project.period}</PreviewField>
                {project.responsibilities.length > 0 && (
                  <PreviewField label="Responsibilities">
                    <ul className="cv-preview-responsibilities">
                      {project.responsibilities.map((value, index) => <li key={index}>{value}</li>)}
                    </ul>
                  </PreviewField>
                )}
                <PreviewField label="Environment">{project.environment.join(", ") || "—"}</PreviewField>
              </div>
            </section>
          ))}
        </section>
      )}

      {cv.skillGroups.length > 0 && (
        <section className="cv-preview-section">
          <h3 id="cv-professional-skills">Professional skills</h3>
          <Table aria-labelledby="cv-professional-skills" className="cv-preview-skills">
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Skills category</TableHead>
                <TableHead scope="col">Skill</TableHead>
                <TableHead scope="col">Experience in years</TableHead>
                <TableHead scope="col">Last used</TableHead>
              </TableRow>
            </TableHeader>
            {cv.skillGroups.map(({ id, name, skills }) => (
              <TableBody key={id ?? ""}>
                {skills.map((skill, index) => (
                  <TableRow key={skill.name}>
                    {index === 0 && <TableHead scope="rowgroup" rowSpan={skills.length}>{name}</TableHead>}
                    <TableCell>{skill.name}</TableCell>
                    <TableCell>{skill.years ?? ""}</TableCell>
                    <TableCell>{skill.lastUsed ?? ""}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            ))}
          </Table>
        </section>
      )}
    </article>
  );
}

function PreviewField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="cv-preview-field">
      <h4>{label}</h4>
      {typeof children === "string" ? <p>{children}</p> : children}
    </div>
  );
}

// The preview and the standalone print document use the same markup and stylesheet.
const previewStyles = `
  .cv-preview {
    --cv-accent: #b31f24;
    container-type: inline-size;
    color: #292929;
    font-size: 1rem;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
  .cv-preview :is(h2, h3, h4, p, ul) { margin: 0; }
  .cv-preview h2, .cv-preview h3 { font-size: 2.125em; line-height: 1.2; font-weight: 400; }
  .cv-preview h4 { font-size: 1em; font-weight: 600; }
  .cv-preview p, .cv-preview li { white-space: pre-wrap; }
  .cv-preview-header {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 2rem;
  }
  .cv-preview-position, .cv-preview-project-name { text-transform: uppercase; }
  .cv-preview-columns { display: grid; grid-template-columns: minmax(0, 31%) minmax(0, 1fr); }
  .cv-preview-columns > :first-child { padding: 1rem 1.5rem 0 0; }
  .cv-preview-columns > :last-child { padding: 1rem 0 0 1.5rem; border-left: 1px solid var(--cv-accent); }
  .cv-preview-stack > * + * { margin-top: 1rem; }
  .cv-preview-field h4, .cv-preview .cv-preview-project-name { margin-bottom: .5rem; }
  .cv-preview .cv-preview-project-name + p { margin-top: 0; }
  .cv-preview-plain-list { padding: 0; list-style: none; }
  .cv-preview-responsibilities { padding-left: 1.25em; list-style: disc; }
  .cv-preview-section { margin-top: 3rem; }
  .cv-preview-section > h3 { margin-bottom: 2rem; }
  .cv-preview-section > .cv-preview-columns + .cv-preview-columns { margin-top: 2rem; }
  .cv-preview-project-name, .cv-preview-skills th[scope="rowgroup"] { color: var(--cv-accent); }
  .cv-preview-skills { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: .875em; }
  .cv-preview-skills :is(td, th) { padding: .625em .875em; text-align: left; vertical-align: top; white-space: normal; }
  .cv-preview-skills th[scope="col"] { border-bottom: 1px solid var(--cv-accent); text-transform: uppercase; }
  .cv-preview-skills th[scope="col"]:first-child { width: 28%; }
  .cv-preview-skills th[scope="col"]:nth-child(3) { width: 16%; }
  .cv-preview-skills th[scope="col"]:nth-child(4) { width: 15%; }
  .cv-preview-skills :is(td, th):nth-last-child(-n+2) { text-align: center; }
  .cv-preview-skills tbody tr { border: 0; }
  .cv-preview-skills tbody { border-bottom: 1px solid #aaa; }
  @container (max-width: 30rem) {
    .cv-preview-columns { grid-template-columns: minmax(0, 1fr); gap: 1rem; }
    .cv-preview-columns > :first-child { padding: 0; }
    .cv-preview-columns > :last-child { padding: 1rem 0 0; border-left: 0; border-top: 1px solid var(--cv-accent); }
  }
  @media print {
    body.cv-preview-print { margin: 0; font-family: Arial, sans-serif; }
    .cv-preview { container-type: normal; font-size: 10.5pt; print-color-adjust: exact; }
    .cv-preview-header { margin-bottom: 12pt; }
    .cv-preview-section { margin-top: 23pt; }
    .cv-preview-section > h3 { margin-bottom: 9pt; }
    .cv-preview-section > .cv-preview-columns { break-inside: avoid; }
    .cv-preview :is(h2, h3, h4) { break-after: avoid; }
    .cv-preview-skills tr { break-inside: avoid; }
  }
`;
