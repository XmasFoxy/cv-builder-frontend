import { gql } from "@apollo/client";
import { createApolloClient } from "@/lib/apollo-client";
import { authenticatedRequest } from "@/lib/session";

export type Viewer = { id: string; role: "Employee" | "Admin" | null };

const VIEWER_QUERY = gql`
  query CurrentEmployee {
    me { id role }
  }
`;

export async function readViewer(token: string) {
  const { data } = await createApolloClient().query<{ me: Viewer }>({
    query: VIEWER_QUERY,
    ...authenticatedRequest(token),
  });
  return data?.me ?? null;
}
