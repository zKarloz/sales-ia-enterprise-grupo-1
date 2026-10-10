export interface Payment {
  id: number;
  sale_id: number;
  user_id: number;
  method: string;
  amount: string;
  status: string;
  reference: string | null;
  paid_at: string;
}
