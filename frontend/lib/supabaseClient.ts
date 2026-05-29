import { createClient } from '@supabase/supabase-js';
import { Talent } from '../types.ts';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Convert camelCase Talent → snake_case DB row
export function toDb(talent: Partial<Talent> & { position?: number }): Record<string, unknown> {
  const row: Record<string, unknown> = {
    id:                talent.id,
    name:              talent.name,
    ethnicity:         talent.ethnicity,
    gender:            talent.gender,
    age_range:         talent.ageRange,
    personality:       talent.personality,
    best_fit:          talent.bestFit,
    outfits:           talent.outfits,
    voices:            talent.voices,
    use_cases:         talent.useCases ?? null,
    image_seed:        talent.imageSeed,
    profile_image_url: talent.profileImageUrl ?? null,
    main_image_url:    talent.mainImageUrl ?? null,
    turnaround_urls:   talent.turnaroundUrls ?? null,
    expression_urls:   talent.expressionUrls ?? null,
    closeup_url:       talent.closeupUrl ?? null,
  };
  if (talent.position !== undefined) row.position = talent.position;
  return row;
}

// Convert snake_case DB row → camelCase Talent
export function fromDb(row: Record<string, unknown>): Talent {
  return {
    id:              row.id as string,
    name:            row.name as string,
    ethnicity:       row.ethnicity as string,
    gender:          row.gender as 'M' | 'F',
    ageRange:        row.age_range as string,
    personality:     (row.personality as string[]) || [],
    bestFit:         (row.best_fit as string[]) || [],
    outfits:         (row.outfits as Talent['outfits']) || [],
    voices:          (row.voices as Talent['voices']) || [],
    useCases:        (row.use_cases as Talent['useCases']) || [],
    imageSeed:       row.image_seed as string,
    profileImageUrl: row.profile_image_url as string | undefined,
    mainImageUrl:    row.main_image_url as string | undefined,
    turnaroundUrls:  row.turnaround_urls as string[] | undefined,
    expressionUrls:  row.expression_urls as string[] | undefined,
    closeupUrl:      row.closeup_url as string | undefined,
  };
}
