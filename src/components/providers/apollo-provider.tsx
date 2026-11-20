"use client";

import { ApolloProvider } from "@apollo/client/react";
import { createApolloClient } from "@/lib/apollo-client";

const apolloClient = createApolloClient();

type Props = {
  children: React.ReactNode;
};

export function AppApolloProvider({ children }: Props) {
  return (
    <ApolloProvider client={apolloClient}>
      {children}
    </ApolloProvider>
  );
}
