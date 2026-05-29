import { Talent } from './types.ts';

export const talents: Talent[] = [
  {
    id: 'MY-F-01',
    name: 'Nadia Putri',
    ethnicity: 'Malay',
    gender: 'F',
    ageRange: '25 - 30',
    personality: ['Professional', 'Friendly', 'Aspirational'],
    bestFit: ['Beauty & Skincare', 'Lifestyle Content', 'Fashion'],
    outfits: [
      { label: 'Base Look' }, 
      { label: 'Casual' }, 
      { label: 'Business' }, 
      { label: 'Formal' }, 
      { label: 'Hijab' }
    ],
    voices: [
      { language: 'English' }, 
      { language: 'Malay' }, 
      { language: 'Chinese' }
    ],
    imageSeed: 'nadia',
    useCases: [
      {
        title: 'Social Media Content / Product Campaigns',
        description: 'Nadia can be used as a consistent virtual face for brand content and product campaigns. She can also be customized with different outfits, settings, poses, and campaign themes, while also showcasing, holding, using, or presenting a product. This helps brands create content faster, produce more variations, and maintain a recognizable talent identity without needing a physical shoot each time.'
      },
      {
        title: 'Interactive Panelist Host',
        description: 'Nadia representing one of the panelist for Astro Media Solutions x U Business SMEvaganza 2026 event. Showcasing her interacting with the event hosts in real-time appearing as the special guests via a video call.'
      },
      {
        title: 'Corporate Content',
        description: 'She can also be used for corporate content such as internal announcements, training videos, onboarding materials, explainer content, and company updates. Delivering messages in a consistent, professional, and brand-safe way, helping companies create polished communication assets faster without needing repeated filming, talent coordination, or physical production.'
      }
    ]
  },
  {
    id: 'IN-M-01',
    name: 'Bobby Kumar',
    ethnicity: 'Indian, South Asian',
    gender: 'M',
    ageRange: '30 - 35',
    personality: ['Expressive', 'Witty', 'Approachable'],
    bestFit: ['TV Show / Corporate Host', 'Finance & Banking', 'Telco Campaigns'],
    outfits: [
      { label: 'Base Look' }, 
      { label: 'Casual' }, 
      { label: 'Business' }, 
      { label: 'Formal' }, 
      { label: 'Festive' }
    ],
    voices: [
      { language: 'English' }, 
      { language: 'Hindi' }
    ],
    imageSeed: 'bobby'
  },
  {
    id: 'CN-M-01',
    name: 'Ming Chong',
    ethnicity: 'Chinese',
    gender: 'M',
    ageRange: '21 - 26',
    personality: ['Gen Z', 'Smart', 'Tech-Savvy'],
    bestFit: ['Youth Lifestyle', 'Gaming', 'Technology'],
    outfits: [
      { label: 'Base Look' }, 
      { label: 'Casual' }, 
      { label: 'Business' }, 
      { label: 'Formal' }, 
      { label: 'Festive' }
    ],
    voices: [
      { language: 'English' }, 
      { language: 'Mandarin' }
    ],
    imageSeed: 'ming'
  },
  {
    id: 'CN-F-01',
    name: 'Mei Lin',
    ethnicity: 'Chinese',
    gender: 'F',
    ageRange: '22 - 27',
    personality: ['Elegant', 'Trendy', 'Charismatic'],
    bestFit: ['Fashion & Luxury', 'Beauty', 'Lifestyle & Travel'],
    outfits: [
      { label: 'Base Look' },
      { label: 'Casual' },
      { label: 'Business' },
      { label: 'Formal' },
      { label: 'Festive' }
    ],
    voices: [
      { language: 'English' },
      { language: 'Mandarin' },
      { language: 'Cantonese' }
    ],
    imageSeed: 'meilin'
  },
  {
    id: 'MY-M-01',
    name: 'Haziq Ramli',
    ethnicity: 'Malay',
    gender: 'M',
    ageRange: '26 - 31',
    personality: ['Energetic', 'Motivational', 'Bold'],
    bestFit: ['Sports & Fitness', 'Automotive', 'F&B Campaigns'],
    outfits: [
      { label: 'Base Look' },
      { label: 'Casual' },
      { label: 'Sportswear' },
      { label: 'Business' },
      { label: 'Formal' }
    ],
    voices: [
      { language: 'English' },
      { language: 'Malay' }
    ],
    imageSeed: 'haziq'
  }
];
