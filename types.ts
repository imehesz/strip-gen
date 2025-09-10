export interface ComicPanel {
  image: string;
  text: string;
}

export interface PanelPromptData {
  image_prompt: string;
  panel_text?: string;
}

export interface CharacterImage {
  base64: string;
  mimeType: string;
}