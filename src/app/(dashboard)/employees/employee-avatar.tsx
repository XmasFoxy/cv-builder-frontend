import { Avatar } from "@base-ui/react/avatar";

import { cn } from "@/lib/utils";

export function EmployeeAvatar({
  src,
  initials,
  className,
}: {
  src: string | null;
  initials: string;
  className?: string;
}) {
  return (
    <Avatar.Root
      aria-hidden="true"
      className={cn("grid size-10 place-items-center overflow-hidden rounded-full bg-[#707070] text-base text-white", className)}
    >
      {src && (
        <Avatar.Image
          src={src}
          alt=""
          keepMounted
          loading="lazy"
          referrerPolicy="no-referrer"
          className="col-start-1 row-start-1 size-full object-cover aria-hidden:invisible"
        />
      )}
      <Avatar.Fallback className="col-start-1 row-start-1">{initials}</Avatar.Fallback>
    </Avatar.Root>
  );
}
