
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  {
    label: "Employees",
    href: "/employees",
    icon: "/icons/employees.svg",
  },
  {
    label: "Skills",
    href: "/skills",
    icon: "/icons/skills.svg",
  },
  {
    label: "Languages",
    href: "/languages",
    icon: "/icons/languages.svg",
  },
  {
    label: "CVs",
    href: "/cvs",
    icon: "/icons/cvs.svg",
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`relative flex shrink-0 flex-col transition-[width] duration-200 ${
        collapsed ? "w-[80px]" : "w-[240px]"
      }`}
    >
      <div className="flex h-[72px] items-center gap-3 px-5">
        <Image
          src="/icons/logo.svg"
          alt="CV Builder logo"
          width={24}
          height={24}
          className="shrink-0"
        />

        {!collapsed && (
          <span className="truncate text-base font-semibold">
            CV Builder
          </span>
        )}
      </div>

      <button
        type="button"
        aria-label={
          collapsed ? "Expand sidebar" : "Collapse sidebar"
        }
        onClick={() => setCollapsed((value) => !value)}
        className="absolute right-2 top-[77px] flex h-7 w-7 items-center justify-center rounded-md text-xl text-(--dashboard-muted) hover:bg-(--dashboard-hover)"
      >
        {collapsed ? "›" : "‹"}
      </button>

      <nav
        aria-label="Main navigation"
        className="mt-10 flex flex-col gap-2 pr-3"
      >
        {navigation.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              aria-current={pathname === item.href ? "page" : active ? "location" : undefined}
              className={`flex h-12 items-center gap-4 rounded-r-full px-5 text-base transition-colors ${
                active
                  ? "bg-(--dashboard-active) font-medium"
                  : "text-(--dashboard-muted) hover:bg-(--dashboard-hover)"
              }`}
            >
              <Image
                src={item.icon}
                alt=""
                width={24}
                height={24}
                className="dashboard-nav-icon shrink-0"
              />

              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto shrink-0 px-4 pb-7">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#cf3033] text-base font-medium text-white">
            D
          </div>

          {!collapsed && (
            <span className="truncate text-base text-(--dashboard-profile)">
              Demo User
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
