import { apiRequest } from "./api";
import type { Branch } from "../types/branch";

export function getBranches(includeInactive = false): Promise<Branch[]> {
    const params = new URLSearchParams();
    if (includeInactive) params.set("include_inactive", "true");
    const suffix = params.toString();
    return apiRequest<Branch[]>(`/api/branches${suffix ? `?${suffix}` : ""}`);
}
