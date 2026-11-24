import { gql } from "@apollo/client";
import { notFound } from "next/navigation";

import { createApolloClient } from "@/lib/apollo-client";
import type { Viewer } from "@/lib/current-employee";
import { authenticatedRequest, isRejected, readAccessToken, redirectForSession } from "@/lib/session";

import { cvDetailsHref, isCvId, type CvsQuery } from "./cvs-url";

export type CvDetails = {
  id: string;
  name: string;
  education: string | null;
  description: string;
};

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
  if (!isCvId(id)) notFound();
  const destination = cvDetailsHref(id, query);
  const token = await readAccessToken(destination);
  let result;
  try {
    result = await createApolloClient().query<{ cv: CvDetails & { user: { id: string } | null }; me: Viewer }>({
      query: CV_DETAILS, variables: { id }, ...authenticatedRequest(token),
    });
  } catch (error) {
    if (isRejected(error, "unauthorized")) return redirectForSession(destination);
    if (isRejected(error, "notOwnCv") || isRejected(error, "cvNotFound")) notFound();
    return null;
  }

  if (!result.data) return null;
  const { cv, me } = result.data;
  if (me.role !== "Employee" || cv.user?.id !== me.id) notFound();
  return { id: cv.id, name: cv.name, education: cv.education, description: cv.description };
}
