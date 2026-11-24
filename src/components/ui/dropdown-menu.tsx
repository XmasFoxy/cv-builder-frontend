"use client";

import { Menu } from "@base-ui/react/menu";
import { cn } from "cn";

function DropdownMenu(props: Menu.Root.Props) {
  return <Menu.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuTrigger(props: Menu.Trigger.Props) {
  return <Menu.Trigger data-slot="dropdown-menu-trigger" {...props} />;
}

function DropdownMenuContent({ className, ...props }: Menu.Popup.Props) {
  return (
    <Menu.Portal>
      <Menu.Positioner align="end" sideOffset={4} className="isolate z-50">
        <Menu.Popup data-slot="dropdown-menu-content"
          className={cn("min-w-32 rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none", className)}
          {...props} />
      </Menu.Positioner>
    </Menu.Portal>
  );
}

function DropdownMenuItem({ className, ...props }: Menu.Item.Props) {
  return <Menu.Item data-slot="dropdown-menu-item"
    className={cn("flex min-h-8 cursor-default items-center rounded-md px-2 py-1.5 text-sm outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground", className)}
    {...props} />;
}

export { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger };
