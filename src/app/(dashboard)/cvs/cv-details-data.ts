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
  let data;
  try {
    ({ data } = await createApolloClient().query<Result>({
      query: document, variables: { id }, ...authenticatedRequest(token),
    }));
  } catch (error) {
    if (isRejected(error, "unauthorized")) return redirectForSession(destination);
    if (isRejected(error, "notOwnCv") || isRejected(error, "cvNotFound")) notFound();
    return null;
  }

  if (!data) return null;
  if (data.me.role !== "Employee" || data.cv.user?.id !== data.me.id) notFound();
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
