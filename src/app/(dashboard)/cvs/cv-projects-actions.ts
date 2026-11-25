"use server";

import { gql } from "@apollo/client";
import { refresh } from "next/cache";
import { z } from "zod";

import { createApolloClient } from "@/lib/apollo-client";
import { readViewer } from "@/lib/current-employee";
import { authenticatedRequest, isRejected, withMutationSession } from "@/lib/session";

import { isCvId } from "./cvs-url";

const projectId = z.string().refine(isCvId);
const participation = {
  projectId,
  start_date: z.iso.date(),
  end_date: z.iso.date().nullable(),
  roles: z.array(z.string().refine((value) => Boolean(value.trim()))).min(1),
  responsibilities: z.array(z.string()),
};

const inputSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("add"), ...participation }),
  z.object({ action: z.literal("update"), ...participation }),
  z.object({ action: z.literal("remove"), projectId }),
]);

export type CvProjectChange = z.infer<typeof inputSchema>;

const operations = {
  add: ["addCvProject", gql`mutation AddEmployeeCvProject($project: AddCvProjectInput!) { addCvProject(project: $project) { id } }`],
  update: ["updateCvProject", gql`mutation UpdateEmployeeCvProject($project: UpdateCvProjectInput!) { updateCvProject(project: $project) { id } }`],
  remove: ["removeCvProject", gql`mutation RemoveEmployeeCvProject($project: RemoveCvProjectInput!) { removeCvProject(project: $project) { id } }`],
} as const;

const projectErrors = [
  "projectHasBeenAdded", "projectNotFound", "cvProjectNotFound", "invalidProjectStartDate",
  "invalidProjectEndDate", "projectStartOutsideDuration", "projectEndBeforeStart",
  "projectEndOutsideDuration", "projectRoleRequired", "projectRoleUnavailable",
] as const;

export async function changeCvProject(cvId: string, input: CvProjectChange) {
  if (!isCvId(cvId)) return "invalid";
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return "invalid";

  const { action, ...project } = parsed.data;
  const [field, mutation] = operations[action];
  const outcome = await withMutationSession(async (token) => {
    try {
      if ((await readViewer(token))?.role !== "Employee") return "forbidden";
      const { data } = await createApolloClient().mutate<Partial<Record<typeof field, { id: string }>>>({
        mutation,
        variables: { project: { ...project, cvId } },
        ...authenticatedRequest(token),
      });
      return data?.[field]?.id === cvId ? "saved" : "unavailable";
    } catch (error) {
      if (isRejected(error, "unauthorized")) return "expired";
      if (isRejected(error, "notOwnCv") || isRejected(error, "cvNotFound")) return "forbidden";
      return projectErrors.find((code) => isRejected(error, code)) ?? "unavailable";
    }
  });
  if (outcome === "saved") refresh();
  return outcome;
}
