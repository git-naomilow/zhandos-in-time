
export interface GameState {
  step: 'UPLOAD' | 'SCENARIO' | 'PLAYING';
  baseImage: string | null;
  scenario: string;
  history: Chapter[];
  isGenerating: boolean;
}

export interface Chapter {
  text: string;
  imageUrl: string;
  choices: string[];
}

export interface GenerationResult {
  storyText: string;
  imagePrompt: string;
  choices: string[];
}
