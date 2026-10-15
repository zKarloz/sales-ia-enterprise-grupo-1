import { apiRequest } from "./api";

import type {
    Insight,
    InsightGenerateRequest,
    InsightGenerateResponse,
    InsightEvidenceResponse,
} from "../types/insight";

// Consulta el historial de observaciones.
export function getInsights(): Promise<Insight[]> {
    return apiRequest<Insight[]>("/api/insights");
}

// Consulta una observación individual.
export function getInsight(
    insightId: number,
): Promise<Insight> {
    return apiRequest<Insight>(
        `/api/insights/${insightId}`,
    );
}

// Genera insights mediante Analytics F10 y las reglas F11.
export function generateInsights(
    filters: InsightGenerateRequest,
): Promise<InsightGenerateResponse> {
    return apiRequest<InsightGenerateResponse>(
        "/api/insights/generate",
        {
            method: "POST",
            body: JSON.stringify(filters),
        },
    );
}

export function getInsightEvidence(
    insightId: number,
): Promise<InsightEvidenceResponse> {
    return apiRequest<InsightEvidenceResponse>(
        `/api/insights/${insightId}/evidence`,
    );
}
