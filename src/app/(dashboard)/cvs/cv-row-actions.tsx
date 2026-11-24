"use client";

import { EllipsisVertical } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { EditableCvForm } from "./cv-form";
import type { CvSummary } from "./cvs-data";
import type { CvDetailsDestination } from "./cvs-url";
import { deleteEmployeeCv } from "./manage-cv-actions";

export function CvRowActions({ cv, href }: { cv: CvSummary; href: CvDetailsDestination }) {
  const [dialog, setDialog] = useState<"edit" | "delete" | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const pending = useRef(false);
  const trigger = useRef<HTMLButtonElement>(null);

  async function deleteCv() {
    if (pending.current) return;
    pending.current = true;
    setDeleting(true);
    setMessage("");
    try {
      const status = await deleteEmployeeCv(cv.id);
      if (status === "deleted") setDialog(null);
      else if (status === "expired") setMessage("Your session has expired. Sign in to continue.");
      else if (status === "forbidden") setMessage("This CV is no longer available to you.");
      else setMessage("Failed to delete CV. Please try again.");
    } catch {
      setMessage("Failed to delete CV. Please try again.");
    } finally {
      pending.current = false;
      setDeleting(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger ref={trigger} aria-label={`Actions for ${cv.name}`} render={<Button variant="ghost" size="icon" />}>
          <EllipsisVertical aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem nativeButton={false} render={<Link href={href} prefetch={false} />}>View</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDialog("edit")}>Edit</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive" onClick={() => { setMessage(""); setDialog("delete"); }}>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={dialog !== null} onOpenChange={(open) => { if (!open && !pending.current) setDialog(null); }}>
        <DialogContent finalFocus={trigger} showCloseButton={false} className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
          {dialog === "edit" && <>
            <DialogTitle>Update CV</DialogTitle>
            <EditableCvForm cv={cv} action="Save" onUpdated={() => setDialog(null)}
              onPendingChange={(saving) => { pending.current = saving; }} />
          </>}
          {dialog === "delete" && <>
            <DialogTitle>Delete CV</DialogTitle>
            <DialogDescription className="wrap-anywhere">Are you sure you want to delete CV {cv.name}?</DialogDescription>
            {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
            <DialogFooter className="flex-row justify-end">
              <DialogClose render={<Button variant="outline" disabled={deleting} className="uppercase" />}>Cancel</DialogClose>
              <Button onClick={deleteCv} disabled={deleting} className="bg-[#b51f24] text-white uppercase hover:bg-[#95191d]">
                {deleting ? "Deleting…" : "Confirm"}
              </Button>
            </DialogFooter>
          </>}
        </DialogContent>
      </Dialog>
    </>
  );
}
