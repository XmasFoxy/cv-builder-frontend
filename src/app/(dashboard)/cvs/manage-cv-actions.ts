"use server";

import { gql } from "@apollo/client";
import { refresh } from "next/cache";

import { createApolloClient } from "@/lib/apollo-client";
import { readViewer } from "@/lib/current-employee";
import { authenticatedRequest, isRejected, withMutationSession } from "@/lib/session";

import { createCvSchema, type CreateCvFields } from "./create-cv-schema";
import { isCvId } from "./cvs-url";

const UPDATE_CV = gql`
  mutation UpdateEmployeeCv($cv: UpdateCvInput!) {
    updateCv(cv: $cv) { id }
  }
`;

const DELETE_CV = gql`
  mutation DeleteEmployeeCv($cv: DeleteCvInput!) {
    deleteCv(cv: $cv) { affected }
  }
`;

async function manageCv(cvId: string, fields?: CreateCvFields) {
  if (!isCvId(cvId)) return "invalid";

  const result = await withMutationSession(async (token) => {
    try {
      const viewer = await readViewer(token);
      if (viewer?.role !== "Employee") return "forbidden";

      const { data } = await createApolloClient().mutate<{
        updateCv?: { id: string };
        deleteCv?: { affected: number };
      }>({
        mutation: fields ? UPDATE_CV : DELETE_CV,
        variables: { cv: { ...fields, cvId } },
        ...authenticatedRequest(token),
      });
      if (data?.updateCv?.id === cvId) return "updated";
      if (data?.deleteCv?.affected === 1) return "deleted";
      return "unavailable";
    } catch (error) {
      if (isRejected(error, "unauthorized")) return "expired";
      if (isRejected(error, "notOwnCv") || isRejected(error, "cvNotFound")) return "forbidden";
      return "unavailable";
    }
  });

  if (result === "updated" || result === "deleted") refresh();
  return result;
}

export async function updateEmployeeCv(cvId: string, input: CreateCvFields) {
  const fields = createCvSchema.safeParse(input);
  if (!fields.success) return "invalid";
  return manageCv(cvId, fields.data);
}

export async function deleteEmployeeCv(cvId: string) {
  return manageCv(cvId);
}
