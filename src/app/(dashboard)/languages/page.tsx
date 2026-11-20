
import { requireSession } from "@/lib/session";

export default async function LanguagesPage() {
  await requireSession("/languages");

  return (
    <section>
      <h1 className="text-xl font-medium">Languages</h1>

      <p className="mt-4 text-sm text-[#888888]">
        Languages management will be available here.
      </p>
    </section>
  );
}
