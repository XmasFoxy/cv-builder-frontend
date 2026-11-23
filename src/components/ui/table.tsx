import type { ComponentProps } from "react";
import { cn } from "cn";

export function Table({
  className,
  containerProps,
  ...props
}: ComponentProps<"table"> & { containerProps?: ComponentProps<"div"> }) {
  const { className: containerClassName, ...container } = containerProps ?? {};
  return (
    <div
      data-slot="table-container"
      className={cn("relative w-full overflow-x-auto", containerClassName)}
      {...container}
    >
      <table data-slot="table" className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  );
}

export function TableHeader(props: ComponentProps<"thead">) {
  return <thead data-slot="table-header" {...props} />;
}

export function TableBody(props: ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" {...props} />;
}

export function TableRow({ className, ...props }: ComponentProps<"tr">) {
  return <tr data-slot="table-row" className={cn("border-b", className)} {...props} />;
}

export function TableHead({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn("px-2 text-left align-middle font-medium whitespace-nowrap text-foreground", className)}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: ComponentProps<"td">) {
  return <td data-slot="table-cell" className={cn("p-2 align-middle", className)} {...props} />;
}
