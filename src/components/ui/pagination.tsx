import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "cn";

import { buttonVariants } from "@/components/ui/button";

export function Pagination({ className, ...props }: ComponentProps<"nav">) {
  return (
    <nav
      aria-label="Pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

export function PaginationContent({ className, ...props }: ComponentProps<"ul">) {
  return <ul data-slot="pagination-content" className={cn("flex items-center gap-0.5", className)} {...props} />;
}

export function PaginationItem(props: ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}

export function PaginationLink({ className, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      data-slot="pagination-link"
      className={cn(buttonVariants({ variant: "ghost", size: "sm" }), className)}
      {...props}
    />
  );
}
