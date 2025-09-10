
import React from 'react';
import type { CharacterImage } from '@/types';

interface CharacterUploaderProps {
  index: number;
  image: CharacterImage | null;
  onImageChange: (index: number, image: CharacterImage) => void;
  onImageRemove: (index: number) => void;
}

const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve({ base64, mimeType: file.type });
    };
    reader.onerror = error => reject(error);
  });
};

const CharacterUploader: React.FC<CharacterUploaderProps> = ({ index, image, onImageChange, onImageRemove }) => {
  const inputId = `character-upload-${index}`;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const { base64, mimeType } = await fileToBase64(file);
        onImageChange(index, { base64, mimeType });
      } catch (error) {
        console.error("Error converting file to base64:", error);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <label htmlFor={inputId} className="w-36 h-36 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-gray-800/50 transition-all duration-300 relative group overflow-hidden bg-gray-800">
        {image ? (
          <>
            <img src={`data:${image.mimeType};base64,${image.base64}`} alt={`Character ${index + 1}`} className="w-full h-full object-cover rounded-full" />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onImageRemove(index);
                  }}
                  className="bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                  aria-label={`Remove character ${index + 1}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                </button>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            <span className="text-xs">Add Character</span>
          </div>
        )}
      </label>
      <input
        type="file"
        id={inputId}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
        onChange={handleFileChange}
      />
      <h3 className="font-semibold text-gray-300">Character {index + 1}</h3>
    </div>
  );
};

export default CharacterUploader;