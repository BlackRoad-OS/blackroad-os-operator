export type Job = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;
};
