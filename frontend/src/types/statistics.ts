export type DatasetSourceType =
  | "MANUAL"
  | "SALES"
  | "CUSTOMERS"
  | "PRODUCTS"
  | "INVENTORY";


export type StatisticalVariableType =
  | "QUALITATIVE_NOMINAL"
  | "QUALITATIVE_ORDINAL"
  | "QUANTITATIVE_DISCRETE"
  | "QUANTITATIVE_CONTINUOUS";


export type StatisticalValueType =
  | "NUMERIC"
  | "TEXT";


export type StatisticalAnalysisType =
  | "CLASSIFICATION"
  | "MEAN"
  | "MEDIAN"
  | "COMPARE"
  | "RANDOM_VARIABLE"
  | "PROBABILITY"
  | "BAYES";


export type RandomVariableType =
  | "DISCRETE"
  | "CONTINUOUS";


export interface Dataset {
  id: number;
  name: string;
  description: string | null;

  source_type: DatasetSourceType;
  source_config: Record<string, unknown> | null;

  created_by: number | null;
  created_at: string;
}


export interface DatasetCreateRequest {
  name: string;
  description?: string | null;
}


export interface DatasetGenerationRequest {
  name: string;
  description?: string | null;

  date_from?: string | null;
  date_to?: string | null;
}


export interface DatasetVariable {
  id: number;
  dataset_id: number;

  name: string;
  label: string;

  variable_type: StatisticalVariableType;
  value_type: StatisticalValueType;

  source_entity: string | null;
  source_field: string | null;

  description: string | null;
  created_at: string;
}


export interface Observation {
  id: number;
  variable_id: number;

  source_entity: string | null;
  source_record_id: number | null;

  numeric_value: string | null;
  text_value: string | null;

  observed_at: string | null;
  created_at: string;
}


export interface VariableAnalysisRequest {
  variable_id: number;
}


export interface ClassificationResponse {
  analysis_id: number;

  dataset_id: number;
  variable_id: number;

  variable_name: string;
  variable_type: StatisticalVariableType;
  value_type: StatisticalValueType;

  observation_count: number;
}


export interface MeanResponse {
  analysis_id: number;

  dataset_id: number;
  variable_id: number;

  variable_name: string;

  count: number;
  mean: string;
}


export interface MedianResponse {
  analysis_id: number;

  dataset_id: number;
  variable_id: number;

  variable_name: string;

  count: number;
  median: string;
}


export interface CompareResponse {
  analysis_id: number;

  dataset_id: number;
  variable_id: number;

  variable_name: string;

  count: number;

  mean: string;
  median: string;
  difference: string;
}


export interface DistributionItem {
  value: string;
  frequency: number;
  probability: string;
}


export interface RandomVariableAnalyzeRequest {
  variable_id: number;

  name: string;
  random_type: RandomVariableType;

  description?: string | null;
}


export interface RandomVariableAnalysisResponse {
  analysis_id: number;
  random_variable_id: number;

  dataset_id: number;
  variable_id: number;
  variable_name: string;

  random_type: RandomVariableType;

  count: number;

  expected_value: string;
  variance: string;

  min_value: string;
  max_value: string;

  distribution: DistributionItem[] | null;
}


export interface ProbabilityRequest {
  random_variable_id: number;
  event_value: number | string;
}


export interface ProbabilityResponse {
  analysis_id: number;
  random_variable_id: number;

  dataset_id: number;
  variable_id: number;
  variable_name: string;

  event_value: string;

  favorable: number;
  total: number;

  probability: string;
}


export interface BayesRequest {
  dataset_id: number;

  analysis_name: string;

  event_a: string;
  event_b: string;

  probability_a: number;
  probability_b_given_a: number;
  probability_b: number;
}


export interface BayesResponse {
  analysis_id: number;
  bayes_analysis_id: number;

  dataset_id: number;

  event_a: string;
  event_b: string;

  probability_a_given_b: string;
}


export interface AnalysisSummary {
  id: number;

  dataset_id: number | null;
  variable_id: number | null;
  random_variable_id: number | null;

  variable_name: string;
  analysis_type: StatisticalAnalysisType;

  mean_value: string | null;
  median_value: string | null;

  result_data: Record<string, unknown> | null;

  created_by: number | null;
  created_at: string | null;
}


export interface AnalysisResult {
  id: number;
  result_name: string;

  numeric_value: string | null;
  text_value: string | null;
  result_data: Record<string, unknown> | null;

  created_at: string;
}


export interface AnalysisVariable {
  id: number;
  dataset_id: number;

  name: string;
  label: string;

  variable_type: StatisticalVariableType;
  value_type: StatisticalValueType;

  source_entity: string | null;
  source_field: string | null;
}


export interface AnalysisRandomVariable {
  id: number;
  variable_id: number;

  name: string;
  random_type: RandomVariableType;

  description: string | null;
  configuration: Record<string, unknown> | null;

  created_by: number | null;
  created_at: string;
}


export interface AnalysisBayes {
  id: number;
  analysis_id: number;

  event_a: string;
  event_b: string;

  probability_a: string;
  probability_b_given_a: string;
  probability_b: string;
  probability_a_given_b: string;

  created_at: string;
}


export interface AnalysisDetail
  extends AnalysisSummary {
  variable: AnalysisVariable | null;

  results: AnalysisResult[];

  random_variable:
  | AnalysisRandomVariable
  | null;

  bayes_analysis:
  | AnalysisBayes
  | null;
}


export interface AnalysisFilters {
  analysis_type?: StatisticalAnalysisType;
  dataset_id?: number;
}


export type EmpiricalOperator = "eq" | "gt" | "gte" | "lt" | "lte";
export interface EmpiricalEvent { variable_id: number; operator: EmpiricalOperator; value: string; }
export interface EmpiricalBayesRequest { dataset_id: number; event_a: EmpiricalEvent; event_b: EmpiricalEvent; }
export interface EmpiricalBayesResponse {
  analysis_id: number; bayes_analysis_id: number; dataset_id: number;
  total: number; count_a: number; count_b: number; count_both: number;
  probability_a: string; probability_b_given_a: string;
  probability_b: string; probability_a_given_b: string;
}
