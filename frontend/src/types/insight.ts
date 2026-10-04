// Insight generado a partir de un análisis estadístico.
export interface Insight {
    id: number;
    analysis_id: number | null;
    title: string;
    observation: string;
    evidence: string | null;
    created_at: string | null;
}