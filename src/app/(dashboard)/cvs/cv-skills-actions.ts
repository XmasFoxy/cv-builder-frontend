"use server";

import { gql } from "@apollo/client";
import { refresh } from "next/cache";
import { z } from "zod";

import { createApolloClient } from "@/lib/apollo-client";
import { readViewer } from "@/lib/current-employee";
import { authenticatedRequest, isRejected, withMutationSession } from "@/lib/session";

import { skillMasteryLabels } from "../employees/[employeeId]/qualification-levels";
import { isCvId } from "./cvs-url";

const name = z.string().min(1);
const mastery = z.enum(Object.keys(skillMasteryLabels) as (keyof typeof skillMasteryLabels)[]);
const changeSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("add"), name, mastery }),
  z.object({ action: z.literal("update"), name, mastery }),
  z.object({ action: z.literal("remove"), name: z.array(name).min(1) }),
]);

export type CvSkillChange = z.infer<typeof changeSchema>;

const mutations = {
  add: gql`mutation AddEmployeeCvSkill($skill: AddCvSkillInput!) { addCvSkill(skill: $skill) { id } }`,
  update: gql`mutation UpdateEmployeeCvSkill($skill: UpdateCvSkillInput!) { updateCvSkill(skill: $skill) { id } }`,
  remove: gql`mutation RemoveEmployeeCvSkills($skill: DeleteCvSkillInput!) { deleteCvSkill(skill: $skill) { id } }`,
};

const mutationFields = { add: "addCvSkill", update: "updateCvSkill", remove: "deleteCvSkill" } as const;

export async function changeCvSkills(cvId: string, input: CvSkillChange) {
  if (!isCvId(cvId)) return "invalid";
  const parsed = changeSchema.safeParse(input);
  if (!parsed.success) return "invalid";

  const { action, ...skill } = parsed.data;
  const outcome = await withMutationSession(async (token) => {
    try {
      if ((await readViewer(token))?.role !== "Employee") return "forbidden";
      const { data } = await createApolloClient().mutate<Partial<Record<(typeof mutationFields)[keyof typeof mutationFields], { id: string }>>>({
        mutation: mutations[action],
        variables: { skill: { ...skill, cvId } },
        ...authenticatedRequest(token),
      });
      return data?.[mutationFields[action]]?.id === cvId ? "saved" : "unavailable";
    } catch (error) {
      if (isRejected(error, "unauthorized")) return "expired";
      if (isRejected(error, "notOwnCv") || isRejected(error, "cvNotFound")) return "forbidden";
      if (isRejected(error, "skillHasBeenAdded")) return "duplicate";
      if (isRejected(error, "skillNotOnCvOwnerProfile")) return "missingOwnerSkill";
      if (isRejected(error, "cvSkillNotFound")) return "missingCvSkill";
      return "unavailable";
    }
  });
  if (outcome === "saved") refresh();
  return outcome;
}
