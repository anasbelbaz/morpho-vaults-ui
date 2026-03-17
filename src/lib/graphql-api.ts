import type { z } from "zod";

const GRAPHQL_API = "https://api.morpho.org/graphql";

export async function graphqlQuery<T>(
  query: string,
  schema: z.ZodType<T>,
): Promise<T> {
  const res = await fetch(GRAPHQL_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) throw new Error(`graphql api error: ${res.status}`);

  return schema.parse(await res.json());
}
