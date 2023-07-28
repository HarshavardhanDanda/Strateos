export type FieldMapperData = {
  [key: string]: string;
}[]

export interface FieldMap {
  [key: string]: string;
}

export interface ErrorMap {
  [key: string]: string;
}

export interface ScoreItem {
  value?: string;
  score?: number;
}

export interface ScoreMap {
  [key: string]: ScoreItem;
}

export interface Field {
  display: string;
  required?: boolean;
}
