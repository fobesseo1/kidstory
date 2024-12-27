export type Option = {
  value: string;
  label: string;
  description?: string;
};

export type BaseQuestion = {
  id: string;
  title: string;
  subtitle: string;
};

export type SelectQuestion = BaseQuestion & {
  type: 'select';
  options: Option[];
};

export type NumberInputQuestion = BaseQuestion & {
  type: 'number';
  unit: string;
  placeholder: string;
  min?: number;
  max?: number;
};

export type DateInputQuestion = BaseQuestion & {
  type: 'date';
  placeholder: string;
};

export type ResultDisplayQuestion = BaseQuestion & {
  type: 'result';
};

export type Question =
  | SelectQuestion
  | NumberInputQuestion
  | DateInputQuestion
  | ResultDisplayQuestion;

export type Answers = {
  [key: string]: string | number;
};
