# KULT AI Talent Library - Deployment & Media Hosting Guide

This document explains how to take this frontend prototype to production, specifically addressing how to host the uploaded images and audio files, and how to deploy the web application.

## 1. Media Hosting (Images & Audio)

Currently, the application uses `URL.createObjectURL()` to preview uploaded files. This creates a temporary, local URL that only exists in the user's browser memory. If you refresh the page, the images and audio will disappear.

To make this a real platform, you need to upload these files to a Cloud Storage bucket and save the returned permanent URLs to a database.

### Recommended Storage Providers:
*   **Amazon S3 (AWS):** The industry standard. Highly scalable.
*   **Google Cloud Storage (GCP):** Excellent alternative to S3.
*   **Cloudinary:** Great for images, as it allows on-the-fly resizing and optimization.
*   **Vercel Blob / Supabase Storage:** Easiest to integrate if you are using Vercel for hosting or Supabase for your database.

### How to implement it in `TalentForm.tsx`:
Instead of just creating an object URL, you would write an async function to upload the file to your backend or directly to the storage provider.

```typescript
// Example implementation for handleFileUpload
const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // 1. Show a loading state here...

  // 2. Create FormData
  const formData = new FormData();
  formData.append('file', file);

  try {
    // 3. Send to your API endpoint
    const response = await fetch('https://your-api.com/upload', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    // 4. The API returns the permanent public URL (e.g., https://s3.amazonaws.com/bucket/image.jpg)
    callback(data.publicUrl);
  } catch (error) {
    console.error("Upload failed", error);
  }
};
```

## 2. Database Integration

Currently, the data is stored in React state (`useState` in `App.tsx`) and initialized from `data.ts`. 
To persist the data (so admins can add talents and users can see them later), you need a database.

### Recommended Databases:
*   **Firebase / Firestore:** Real-time NoSQL database, very easy to set up with React.
*   **Supabase:** Open-source Firebase alternative (PostgreSQL).
*   **MongoDB / Vercel Postgres:** Standard relational databases.

You would replace the `handleSaveTalent` function in `App.tsx` with an API call (`POST` or `PUT`) to save the JSON object to your database.

## 3. Deployment

Since this is a standard React Single Page Application (SPA) built with Vite/ESM, deploying it is incredibly straightforward.

### Option A: Vercel (Recommended)
1. Push your code to a GitHub repository.
2. Go to [Vercel.com](https://vercel.com) and sign in.
3. Click "Add New Project" and import your GitHub repository.
4. Vercel will automatically detect the settings. Click "Deploy".

### Option B: Netlify
1. Push your code to a GitHub repository.
2. Go to [Netlify.com](https://netlify.com).
3. Click "Add new site" -> "Import an existing project".
4. Connect your GitHub and select the repository.
5. Click "Deploy site".

### Option C: GitHub Pages
If you don't have a backend yet and just want to host the static frontend:
1. Install `gh-pages` via npm.
2. Add a deploy script to your `package.json`.
3. Run `npm run deploy`.

## 4. Security Note
The current login system uses hardcoded credentials (`admin` / `astrogobeyond@1`) on the client side. **This is not secure for production.** Anyone can inspect the JavaScript code and find the password. 

For production, you must implement proper authentication (e.g., JWT tokens, NextAuth, Firebase Auth, or Auth0) where the password verification happens securely on a backend server.
