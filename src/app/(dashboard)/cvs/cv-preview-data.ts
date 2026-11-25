import { gql } from "@apollo/client";

import type { Viewer } from "@/lib/current-employee";

import type { SkillCategory } from "../employees/[employeeId]/employee-profile-data";
import { loadOwnedCv, queryOwnedCv } from "./cv-details-data";
import { buildCvPreview, type CvPreviewSource } from "./cv-preview-model";
import type { CvDetailsDestination } from "./cvs-url";

const CV_PREVIEW = gql`
  query EmployeeCvPreview($id: ID!) {
    cv(cvId: $id) {
      name
      education
      description
      user {
        id
        position { name }
        profile { full_name languages { name proficiency } }
      }
      skills { name categoryId }
      projects {
        id start_date end_date roles responsibilities
        project { name domain description environment }
      }
    }
    me { id role }
    skillCategories { id name order }
  }
`;

type CvPreviewResponse = { cv: CvPreviewSource; me: Viewer; skillCategories: SkillCategory[] };

export async function getCvPreview(id: string, destination: CvDetailsDestination) {
  const data = await queryOwnedCv<CvPreviewResponse>(id, destination, CV_PREVIEW);
  return data ? buildCvPreview(data.cv, data.skillCategories) : null;
}

export async function loadCvPreviewForExport(id: string, token: string) {
  const data = await loadOwnedCv<CvPreviewResponse>(id, token, CV_PREVIEW);
  return typeof data === "string" ? data : buildCvPreview(data.cv, data.skillCategories);
}
