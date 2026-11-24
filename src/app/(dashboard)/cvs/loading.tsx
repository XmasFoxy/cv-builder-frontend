import { CvsTable } from "./cvs-table";

export default function Loading() {
  return (
    <section data-cvs-page>
      <h1 className="text-base font-medium">CVs</h1>
      <CvsTable />
    </section>
  );
}
