import { gql } from "@apollo/client";
import type { DocumentNode } from "graphql";
import { notFound } from "next/navigation";

import { createApolloClient } from "@/lib/apollo-client";
import type { Viewer } from "@/lib/current-employee";
import { authenticatedRequest, isRejected, readAccessToken, redirectForSession } from "@/lib/session";

import { cvDetailsHref, isCvId, type CvDetailsDestination, type CvsQuery } from "./cvs-url";

export type CvDetails = {
  id: string;
  name: string;
  education: string | null;
  description: string;
};

type OwnedCvResponse = {
  cv: { user: { id: string } | null };
  me: Viewer;
};

export async function queryOwnedCv<Result extends OwnedCvResponse>(
  id: string,
  destination: CvDetailsDestination,
  document: DocumentNode,
): Promise<Result | null> {
  if (!isCvId(id)) notFound();
  const token = await readAccessToken(destination);
  const result = await loadOwnedCv<Result>(id, token, document);
  if (result === "expired") return redirectForSession(destination);
  if (result === "not-found") notFound();
  return result === "unavailable" ? null : result;
}

export async function loadOwnedCv<Result extends OwnedCvResponse>(
  id: string,
  token: string,
  document: DocumentNode,
): Promise<Result | "expired" | "not-found" | "unavailable"> {
  if (!isCvId(id)) return "not-found";
  let data;
  try {
    ({ data } = await createApolloClient().query<Result>({
      query: document, variables: { id }, ...authenticatedRequest(token),
    }));
  } catch (error) {
    if (isRejected(error, "unauthorized")) return "expired";
    if (isRejected(error, "notOwnCv") || isRejected(error, "cvNotFound")) return "not-found";
    return "unavailable";
  }

  if (!data) return "unavailable";
  if (data.me.role !== "Employee" || data.cv.user?.id !== data.me.id) return "not-found";
  return data;
}

const CV_DETAILS = gql`
  query EmployeeCvDetails($id: ID!) {
    cv(cvId: $id) {
      id
      name
      education
      description
      user { id }
    }
    me { id role }
  }
`;

export async function getCvDetails(id: string, query: CvsQuery): Promise<CvDetails | null> {
  const data = await queryOwnedCv<OwnedCvResponse & { cv: CvDetails }>(id, cvDetailsHref(id, query), CV_DETAILS);
  if (!data) return null;
  const { name, education, description } = data.cv;
  return { id: data.cv.id, name, education, description };
}
