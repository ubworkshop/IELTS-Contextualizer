export interface UploadedDocument {
  id: string;
  name: string;
  content: string;
  type: 'markdown' | 'text';
  uploadDate: number;
}

export interface VocabularyAnalysis {
  originalSentence: string;
  chineseTranslation: string;
  wordMeaningInContext: string;
  sourceDocId: string;
  sourceDocName: string;
}

export interface AnalysisState {
  isLoading: boolean;
  error: string | null;
  results: VocabularyAnalysis[];
  searchedWord: string;
}

export enum ViewState {
  EMPTY = 'EMPTY',
  HAS_DOCS = 'HAS_DOCS',
  SEARCHING = 'SEARCHING',
  RESULTS = 'RESULTS'
}