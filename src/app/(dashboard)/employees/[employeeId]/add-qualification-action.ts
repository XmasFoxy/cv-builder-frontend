"use server";

import { gql } from "@apollo/client";
import { refresh } from "next/cache";
import { z } from "zod";

import { createApolloClient } from "@/lib/apollo-client";
import { readViewer } from "@/lib/current-employee";
import { authenticatedRequest, isRejected, withMutationSession } from "@/lib/session";

import { isEmployeeId } from "../employees-url";
import { languageProficiencies, skillMasteryLabels, type Mastery } from "./qualification-levels";

const qualificationSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("skill"), name: z.string().min(1),
    categoryId: z.string().refine(isEmployeeId), level: z.enum(Object.keys(skillMasteryLabels) as Mastery[]),
  }),
  z.object({ kind: z.literal("language"), name: z.string().min(1), level: z.enum(languageProficiencies) }),
]);

const ADD_SKILL = gql`
  mutation AddEmployeeSkill($skill: AddProfileSkillInput!) {
    profile: addProfileSkill(skill: $skill) { id }
  }
`;

const ADD_LANGUAGE = gql`
  mutation AddEmployeeLanguage($language: AddProfileLanguageInput!) {
    profile: addProfileLanguage(language: $language) { id }
  }
`;

export type Qualification = z.infer<typeof qualificationSchema>;

export async function addQualification(userId: string, input: Qualification) {
  const parsed = qualificationSchema.safeParse(input);
  if (!isEmployeeId(userId) || !parsed.success) return "invalid";

  const result = await withMutationSession(async (token) => {
    const qualification = parsed.data;
    const { name, level, kind } = qualification;
    const isSkill = qualification.kind === "skill";
    try {
      const viewer = await readViewer(token);
      if (viewer?.role !== "Employee" || viewer.id !== userId) return "forbidden";

      const { data } = await createApolloClient().mutate<{ profile: { id: string } }>({
        mutation: isSkill ? ADD_SKILL : ADD_LANGUAGE,
        variables: isSkill
          ? { skill: { userId, name, categoryId: qualification.categoryId, mastery: level } }
          : { language: { userId, name, proficiency: level } },
        ...authenticatedRequest(token),
      });
      return data?.profile?.id === userId ? "added" : "unavailable";
    } catch (error) {
      if (isRejected(error, "unauthorized")) return "expired";
      if (isRejected(error, `${kind}HasBeenAdded`)) {
        refresh();
        return "duplicate";
      }
      return "unavailable";
    }
  });

  if (result === "added") refresh();
  return result;
}
