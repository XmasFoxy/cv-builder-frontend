export default function Loading() {
  return (
    <div role="status" className="mx-auto flex max-w-[852px] flex-col items-center gap-4 pt-5 text-[#626262]">
      <span aria-hidden="true" className="size-[120px] rounded-full bg-[#e3e3e6] motion-safe:animate-pulse" />
      Loading profile…
    </div>
  );
}
