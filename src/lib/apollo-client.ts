
import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

export function createApolloClient() {
  return new ApolloClient({
    link: new HttpLink({ uri: "http://localhost:3001/api/graphql" }),
    cache: new InMemoryCache(),
  });
}
