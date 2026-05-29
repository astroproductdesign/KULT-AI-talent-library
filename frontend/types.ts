export interface UseCase {
  title: string;
  description: string;
  imageUrl?: string;
}

export interface Voice {
  language: string;
  audioUrl?: string;
}

export interface Outfit {
  label: string;
  imageUrl?: string;
}

export interface Talent {
  id: string;
  name: string;
  ethnicity: string;
  gender: 'M' | 'F';
  ageRange: string;
  personality: string[];
  bestFit: string[];
  outfits: Outfit[];
  voices: Voice[];
  useCases?: UseCase[];
  imageSeed: string;
  
  // Custom Media Overrides
  profileImageUrl?: string;
  mainImageUrl?: string;
  turnaroundUrls?: string[];
  expressionUrls?: string[];
  closeupUrl?: string;
}
