export type NodeCoordinates = {
  x: number;
  y: number;
  z: number;
};

export type CodeNode = {
  id: string;
  path: string;
  name: string;
  type: "file" | "directory";
  language: string;
  summary: string;
  cyclomatic_complexity: number;
  centrality_score: number;
  is_core_node: boolean;
  cluster_id?: number;
  coordinates: NodeCoordinates;
  raw_text?: string;
};

export type CodeEdge = {
  source: string;
  target: string;
  weight: number;
};

export type CodebasePayload = {
  repositoryName: string;
  totalFilesAnalyzed: number;
  nodes: CodeNode[];
  edges: CodeEdge[];
};

export type UserRole = "Manager" | "Senior Dev" | "Junior Dev";
