type SearchParam = string | string[] | undefined;

export type CvsQuery = {
  search: string;
  page: number;
  sortOrder: "ASC" | "DESC";
};

export type CvsDestination = "/cvs" | `/cvs?${string}`;
export type CvDetailsDestination = `/cvs/${string}`;
export const cvCreatePath = "/cvs/new";

export function cvCreateHref(query: CvsQuery): CvDetailsDestination {
  return `${cvCreatePath}${cvsHref(query).slice("/cvs".length)}`;
}

export function isCvId(value: string) {
  return /^[1-9]\d{0,9}$/.test(value) && Number(value) <= 2_147_483_647;
}

export function cvDetailsHref(cvId: string, query: CvsQuery): CvDetailsDestination {
  return `/cvs/${cvId}${cvsHref(query).slice("/cvs".length)}`;
}

export function cvSkillsHref(cvId: string, query: CvsQuery): CvDetailsDestination {
  return `/cvs/${cvId}/skills${cvsHref(query).slice("/cvs".length)}`;
}

export function cvProjectsHref(cvId: string, query: CvsQuery): CvDetailsDestination {
  return `/cvs/${cvId}/projects${cvsHref(query).slice("/cvs".length)}`;
}

export function readCvsQuery(params: Record<string, SearchParam> | URLSearchParams): CvsQuery {
  function read(key: string) {
    const value = params instanceof URLSearchParams ? params.getAll(key) : params[key];
    if (Array.isArray(value)) return value.length === 1 ? value[0] : undefined;
    return value;
  }

  const rawPage = read("page");
  const page = rawPage && /^[1-9]\d*$/.test(rawPage) ? Number(rawPage) : 1;

  return {
    search: read("search")?.trim() ?? "",
    // GraphQL Int is signed and 32-bit.
    page: page <= 2_147_483_647 ? page : 1,
    sortOrder: read("sort_by") === "name" && read("sort_order") === "DESC" ? "DESC" : "ASC",
  };
}

export function cvsHref({ search, page, sortOrder }: CvsQuery): CvsDestination {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (page > 1) params.set("page", String(page));
  if (sortOrder === "DESC") {
    params.set("sort_by", "name");
    params.set("sort_order", sortOrder);
  }

  return params.size ? `/cvs?${params}` : "/cvs";
}
