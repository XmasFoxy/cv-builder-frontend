import { requireSession } from "@/lib/session";

export default async function SkillsPage() {
  await requireSession("/skills");

  return (
    <section>
      <h1 className="text-xl font-medium">Skills</h1>

      <p className="mt-4 text-sm text-[#888888]">
        Skills management will be available here.
      </p>
    </section>
  );
}
