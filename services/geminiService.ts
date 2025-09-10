import type { CharacterImage, ComicPanel } from '@/types';

export async function generateComicStrip(story: string, characters: CharacterImage[], includeText: boolean, numPanels: number): Promise<ComicPanel[]> {

  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      story,
      characters,
      includeText,
      numPanels
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "An error occurred while generating the comic.");
  }

  const result = await response.json();
  return result.panels;
}