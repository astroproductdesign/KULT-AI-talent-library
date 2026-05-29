# Setup Guide for Step 5 & 6: Backend Database + Image Hosting

## What Was Updated

### Backend (`backend/server.js`)
✅ Added Firebase Firestore initialization
✅ Added Cloudinary configuration  
✅ Added 5 new API endpoints:
- `GET /api/talents` - Fetch all talents
- `POST /api/talents` - Create new talent
- `PUT /api/talents/:id` - Update talent
- `DELETE /api/talents/:id` - Delete talent
- `POST /api/upload` - Upload images to Cloudinary

### Frontend (`frontend/App.tsx` & `frontend/components/TalentForm.tsx`)
✅ Fetches talents from API on app load
✅ All CRUD operations (Create, Read, Update, Delete) now use API calls
✅ Image uploads now go to Cloudinary (not local)
✅ Added loading states and error handling

---

## Configuration Steps

### 1. Get Your Cloudinary Credentials

1. Go to [Cloudinary Dashboard](https://cloudinary.com/console/dashboard)
2. Copy your **Cloud Name** from the Dashboard
3. Go to **Settings > API Keys**
4. Copy **API Key** and **API Secret**

### 2. Update Backend `.env.local`

Open `backend/.env.local` and replace:

```
CLOUDINARY_CLOUD_NAME = "your_cloud_name"
CLOUDINARY_API_KEY = "your_api_key"
CLOUDINARY_API_SECRET = "your_api_secret"
```

With your actual Cloudinary credentials (from step 1).

### 3. Install Backend Dependencies

Run in the `backend/` folder:

```bash
npm install firebase-admin cloudinary multer
```

(They may already be installed from package.json)

### 4. Firebase Setup

Your Firebase connection uses the `GOOGLE_CLOUD_PROJECT` env var that's already set in `.env.local`. Firebase Admin SDK will use Application Default Credentials. Before running locally, authenticate:

```bash
gcloud auth application-default login
```

This will open a browser to authenticate with Google and create credentials for local development.

### 5. Frontend API URL

Open `frontend/.env.local`:

```
VITE_API_URL=http://localhost:5000
```

- **Local dev**: `http://localhost:5000`
- **After deploying to Railway**: Replace with your Railway backend URL (e.g., `https://my-app.railway.app`)

---

## Testing Locally

### Terminal 1: Start Backend

```bash
cd backend
npm run dev
```

This starts the backend on `http://localhost:5000`. You should see:
```
Vertex AI Backend listening at http://localhost:5000
```

### Terminal 2: Start Frontend

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

### Test Admin Features

1. Go to Admin Dashboard (Login section)
2. Add a new talent
3. Upload an image - it should now upload to Cloudinary
4. Submit - it saves to Firestore
5. Refresh the page - data persists from Firestore

---

## Data Flow

```
User uploads image → TalentForm → API /api/upload → Cloudinary → URL returned
Admin saves talent → API /api/talents → Firestore → Data persists
Refresh page → App fetches from /api/talents → Firestore returns data → Shows up
```

---

## What Happens If Backend Isn't Running

If the backend isn't available, the app gracefully falls back to the initial data from `data.ts`. This is for development convenience. Production deployments must have the backend running.

---

## Next Steps

1. **Test locally** (follow Testing section above)
2. **Push to GitHub** after testing
3. **Deploy Backend to Railway** (see Step 7 in main guide)
4. **Deploy Frontend to Vercel** (see Step 8 in main guide)
5. **Update VITE_API_URL** in Vercel env vars to your Railway URL

---

## Troubleshooting

### "Cannot find module 'firebase-admin'"
Run `npm install firebase-admin` in the backend folder

### "Cloudinary upload failed"
- Check credentials in `.env.local`
- Verify backend is running on port 5000

### "Cannot fetch from API"
- Ensure backend is running: `npm run dev` in backend folder
- Check browser console for CORS errors (may need to add CORS headers)

### "No talents showing after refresh"
- Ensure Firestore is initialized in Firebase
- Check browser console for API errors
- Verify `GOOGLE_CLOUD_PROJECT` is correct in `.env.local`
