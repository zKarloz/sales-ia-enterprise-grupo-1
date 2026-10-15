import type { DashboardQueryFilters } from "./analytics";

// Insight almacenado por el backend.
export interface Insight {
    id: number;
    analysis_id: number | null;
    title: string;
    observation: string;
    evidence: string | null;
    created_at: string | null;
}

// Filtros reutilizados de Analytics F10.
export type InsightGenerateRequest = DashboardQueryFilters;

// Respuesta del endpoint POST /api/insights/generate.
export interface InsightGenerateResponse {
    analysis_id: number;
    dataset_id: number;
    generated_count: number;
    insights: Insight[];
    message: string;
}

export interface InsightEvidenceResponse {
    insight_id: number;
    analysis_id: number;
    dataset_id: number;
    rule_code: string;
    title: string;
    evidence: Record<string, string | number | null>;
}
