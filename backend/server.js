
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import 'dotenv/config';
import express from 'express';
import { GoogleAuth } from 'google-auth-library';
import fetch from 'node-fetch';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { WebSocketServer, WebSocket } from 'ws';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import cloudinary from 'cloudinary';
import multer from 'multer';

const app = express();
app.use(express.json({limit: process?.env?.API_PAYLOAD_MAX_SIZE || "7mb"}));
app.use(express.urlencoded({ limit: process?.env?.API_PAYLOAD_MAX_SIZE || "7mb" }));

// CORS configuration - allow requests from Vercel frontend
app.use(cors({
  origin: true, // Reflect the request origin back to the client
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-app-proxy']
}));


// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Firebase initialization
let db;
try {
  let firebaseOptions = {};
  
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.log('Firebase: Using service account from environment variable.');
    let serviceAccount;
    try {
      // Check if it's base64 encoded or raw JSON
      const decoded = process.env.FIREBASE_SERVICE_ACCOUNT.startsWith('{') 
        ? process.env.FIREBASE_SERVICE_ACCOUNT 
        : Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString();
      serviceAccount = JSON.parse(decoded);
      firebaseOptions.credential = cert(serviceAccount);
    } catch (e) {
      console.error('Firebase: Failed to parse FIREBASE_SERVICE_ACCOUNT. Ensure it is valid JSON or Base64 JSON.', e.message);
    }
  } else {
    console.log('Firebase: Using Application Default Credentials (ADC).');
    firebaseOptions.projectId = process.env.GOOGLE_CLOUD_PROJECT;
  }

  const firebaseApp = initializeApp(firebaseOptions);
  db = getFirestore(firebaseApp);
  console.log('Firebase: Initialized successfully.');
} catch (error) {
  console.error('Firebase: Initialization error:', error.message);
  console.error('CRITICAL: App will likely fail if database is not accessible.');
}

// Cloudinary configuration
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('Cloudinary: Configured successfully.');
} else {
  console.warn('Cloudinary: Missing credentials! Check CLOUDINARY_CLOUD_NAME, API_KEY, and API_SECRET.');
}

// Health check endpoint for Railway
app.get('/health', (req, res) => res.status(200).send('OK'));

// Diagnostic endpoint to test services
app.get('/api/test-services', async (req, res) => {
  const results = {
    timestamp: new Date().toISOString(),
    env: {
      project: GOOGLE_CLOUD_PROJECT,
      port: PORT,
      cloudinary: !!process.env.CLOUDINARY_CLOUD_NAME
    }
  };
  
  try {
    if (!db) throw new Error('Firestore DB not initialized');
    const testDoc = await db.collection('test_connection').add({ 
      test: true, 
      time: new Date().toISOString() 
    });
    results.firestore = `OK (Write test successful: ${testDoc.id})`;
    await db.collection('test_connection').doc(testDoc.id).delete();
  } catch (e) {
    results.firestore = `ERROR: ${e.message}`;
  }
  
  try {
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      results.cloudinary = 'CONFIGURED';
    } else {
      results.cloudinary = 'MISSING CREDENTIALS';
    }
  } catch (e) {
    results.cloudinary = `ERROR: ${e.message}`;
  }
  
  res.json(results);
});

// --- Talent Management API Endpoints ---

// GET /api/talents - Fetch all talents
app.get('/api/talents', async (req, res) => {
  try {
    const snapshot = await db.collection('talents').get();
    const talents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(talents);
  } catch (error) {
    console.error('Error fetching talents:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/talents - Create new talent
app.post('/api/talents', async (req, res) => {
  console.log('API: Received request to create talent:', req.body?.name);
  try {
    const talent = req.body;
    const docRef = await db.collection('talents').add(talent);
    console.log('API: Successfully created talent with ID:', docRef.id);
    res.json({ id: docRef.id, ...talent });
  } catch (error) {
    console.error('API Error creating talent:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/talents/:id - Update talent
app.put('/api/talents/:id', async (req, res) => {
  const { id } = req.params;
  console.log('API: Received request to update talent:', id);
  try {
    const talent = req.body;
    await db.collection('talents').doc(id).set(talent, { merge: true });
    console.log('API: Successfully updated talent:', id);
    res.json({ id, ...talent });
  } catch (error) {
    console.error('API Error updating talent:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/talents/:id - Delete talent
app.delete('/api/talents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('talents').doc(id).delete();
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Error deleting talent:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/upload - Upload image to Cloudinary
app.post('/api/upload', upload.single('image'), async (req, res) => {
  console.log('API: Received upload request');
  try {
    if (!req.file) {
      console.warn('API: No file provided in upload request');
      return res.status(400).json({ error: 'No file provided' });
    }

    console.log('API: Uploading to Cloudinary...', req.file.originalname);
    const result = await new Promise((resolve, reject) => {
      cloudinary.v2.uploader.upload_stream(
        { folder: 'talents', resource_type: 'auto' },
        (error, result) => {
          if (error) {
            console.error('Cloudinary Upload Error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(req.file.buffer);
    });

    console.log('API: Upload successful:', result.secure_url);
    res.json({ url: result.secure_url });
  } catch (error) {
    console.error('API Error uploading image:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || process.env.API_BACKEND_PORT || 5000;
const API_BACKEND_HOST = process?.env?.API_BACKEND_HOST || "0.0.0.0";

let GOOGLE_CLOUD_LOCATION = process?.env?.GOOGLE_CLOUD_LOCATION || 'us-central1';
let GOOGLE_CLOUD_PROJECT = process?.env?.GOOGLE_CLOUD_PROJECT;

// Fallback: Extract Project ID from Service Account if missing
if (!GOOGLE_CLOUD_PROJECT && process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const decoded = process.env.FIREBASE_SERVICE_ACCOUNT.startsWith('{') 
      ? process.env.FIREBASE_SERVICE_ACCOUNT 
      : Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString();
    const sa = JSON.parse(decoded);
    GOOGLE_CLOUD_PROJECT = sa.project_id;
    console.log(`Firebase: Extracted Project ID "${GOOGLE_CLOUD_PROJECT}" from service account.`);
  } catch (e) {
    // Ignore error here, handled in Firebase init
  }
}

console.log('--- Backend Startup Health Check ---');
console.log(`Port: ${PORT}`);
console.log(`Host: ${API_BACKEND_HOST}`);
console.log(`Project ID: ${GOOGLE_CLOUD_PROJECT || 'MISSING'}`);
console.log(`Location: ${GOOGLE_CLOUD_LOCATION}`);
console.log(`Service Account: ${process.env.FIREBASE_SERVICE_ACCOUNT ? 'PROVIDED' : 'MISSING'}`);
console.log(`Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME ? 'CONFIGURED' : 'INCOMPLETE'}`);
console.log(`Proxy Header: ${process.env.PROXY_HEADER ? 'CUSTOM' : 'DEFAULT'}`);
console.log('------------------------------------');

const PROXY_HEADER = process?.env?.PROXY_HEADER || 'dAGtg3qhY5E8-3ai3mnHrtJoh34Rz4qR';

app.set('trust proxy', 1 /* number of proxies between user and server */);

// IMPORTANT: Vertex AI Studio Rate Limiting
// This rate limiting configuration protects your backend APIs from abuse.
// Removing it exposes your service to DoS attacks and unexpected costs.
const proxyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // Set ratelimit window at 15min (in ms)
    max: 100, // Limit each IP to 100 requests per window 
    standardHeaders: true, // Return rate limit info in the "RateLimit-*" headers
    legacyHeaders: false, // no "X-RateLimit-*" headers
    message: {
      error: 'Too many requests',
      message: 'You have exceed the request limit, please try again later.'
    },
});
// Apply the rate limiter to the /api-proxy route before the main proxy logic
app.use('/api-proxy', proxyLimiter);

const API_CLIENT_MAP = [
 {
    name: "VertexGenAi:generateContent",
    patternForProxy: "https://aiplatform.googleapis.com/{{version}}/publishers/google/models/{{model}}:generateContent",
    getApiEndpoint: (context, params) => {
      return `https://aiplatform.clients6.google.com/${params['version']}/projects/${context.projectId}/locations/${context.region}/publishers/google/models/${params['model']}:generateContent`;
    },
    isStreaming: false,
    transformFn: null,
  },
 {
    name: "VertexGenAi:predict",
    patternForProxy: "https://aiplatform.googleapis.com/{{version}}/publishers/google/models/{{model}}:predict",
    getApiEndpoint: (context, params) => {
      return `https://aiplatform.clients6.google.com/${params['version']}/projects/${context.projectId}/locations/${context.region}/publishers/google/models/${params['model']}:predict`;
    },
    isStreaming: false,
    transformFn: null,
  },
 {
    name: "VertexGenAi:streamGenerateContent",
    patternForProxy: "https://aiplatform.googleapis.com/{{version}}/publishers/google/models/{{model}}:streamGenerateContent",
    getApiEndpoint: (context, params) => {
      return `https://aiplatform.clients6.google.com/${params['version']}/projects/${context.projectId}/locations/${context.region}/publishers/google/models/${params['model']}:streamGenerateContent`;
    },
    isStreaming: true,
    transformFn: (response) => {
        let normalizedResponse = response.trim();
        while (normalizedResponse.startsWith(',') || normalizedResponse.startsWith('[')) {
          normalizedResponse = normalizedResponse.substring(1).trim();
        }
        while (normalizedResponse.endsWith(',') || normalizedResponse.endsWith(']')) {
          normalizedResponse = normalizedResponse.substring(0, normalizedResponse.length - 1).trim();
        }

        if (!normalizedResponse.length) {
          return {result: null, inProgress: false};
        }

        if (!normalizedResponse.endsWith('}')) {
          return {result: normalizedResponse, inProgress: true};
        }

        try {
          const parsedResponse = JSON.parse(`${normalizedResponse}`);
          const transformedResponse = `data: ${JSON.stringify(parsedResponse)}\n\n`;
          return {result: transformedResponse, inProgress: false};
        } catch (error) {
          throw new Error(`Failed to parse response: ${error}.`);
        }
    },
  },
 {
    name: "ReasoningEngine:query",
    patternForProxy: "https://{{endpoint_location}}-aiplatform.googleapis.com/{{version}}/projects/{{project_id}}/locations/{{location_id}}/reasoningEngines/{{engine_id}}:query",
    getApiEndpoint: (context, params) => {
      return `https://${params['endpoint_location']}-aiplatform.clients6.google.com/v1beta1/projects/${params['project_id']}/locations/${params['location_id']}/reasoningEngines/${params['engine_id']}:query`;
    },
    isStreaming: false,
    transformFn: null,
  },
 {
    name: "ReasoningEngine:streamQuery",
    patternForProxy: "https://{{endpoint_location}}-aiplatform.googleapis.com/{{version}}/projects/{{project_id}}/locations/{{location_id}}/reasoningEngines/{{engine_id}}:streamQuery",
    getApiEndpoint: (context, params) => {
      return `https://${params['endpoint_location']}-aiplatform.clients6.google.com/v1beta1/projects/${params['project_id']}/locations/${params['location_id']}/reasoningEngines/${params['engine_id']}:streamQuery`;
    },
    isStreaming: true,
    transformFn: null,
  },
].map((client) => ({ ...client, patternInfo: parsePattern(client.patternForProxy) }));

// Uses Google Application Default Credentials (ADC).
// Users need to run "gcloud auth application-default login" in order to use the proxy.
const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parsePattern(pattern) {
  const paramRegex = /\{\{(.*?)\}\}/g;
  const params = [];
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = paramRegex.exec(pattern)) !== null) {
    params.push(match[1]);
    const literalPart = pattern.substring(lastIndex, match.index);
    parts.push(escapeRegex(literalPart));
    parts.push(`(?<${match[1]}>[^/]+)`);
    lastIndex = paramRegex.lastIndex;
  }
  parts.push(escapeRegex(pattern.substring(lastIndex)));
  const regexString = parts.join('');

  return {regex: new RegExp(`^${regexString}$`), params};
}

function extractParams(patternInfo, url) {
  const match = url.match(patternInfo.regex);
  if (!match) return null;
  const params = {};
  patternInfo.params.forEach((paramName, index) => {
    params[paramName] = match[index + 1];
  });
  return params;
}

async function getAccessToken(res) {
  try {
    const authClient = await auth.getClient();
    const token = await authClient.getAccessToken();
    return token.token;
  } catch (error) {
    console.error('[Node Proxy] Authentication error:', error);
    if (!res) return null;
    if (error.code === 'ERR_GCLOUD_NOT_LOGGED_IN' || (error.message && error.message.includes('Could not load the default credentials'))) {
      res.status(401).json({
        error: 'Authentication Required',
        message: 'Google Cloud Application Default Credentials not found or invalid. Please run "gcloud auth application-default login" and try again.',
      });
    } else {
      res.status(500).json({ error: `Authentication failed: ${error.message}` });
    }
    return null;
  }
}

function getRequestHeaders(accessToken) {
  return {
    'Authorization': `Bearer ${accessToken}`,
    'X-Goog-User-Project': GOOGLE_CLOUD_PROJECT,
    'Content-Type': 'application/json',
  };
}

// --- Proxy Endpoint ---
app.post('/api-proxy', async (req, res) => {

  // Check for the custom header added by the shim
  if (req.headers['x-app-proxy'] !== PROXY_HEADER) {
    return res.status(403).send('Forbidden: Request must originate from the Vertex App shim.');
  }

  const { originalUrl, method, headers, body } = req.body;
  if (!originalUrl) {
    return res.status(400).send('Bad Request: originalUrl is required.');
  }

  // 1. Find the matching API client
  const apiClient = API_CLIENT_MAP.find(p => {
    // We store extractedParams on req for use later if needed, though getVertexUrl takes it as arg.
    req.extractedParams = extractParams(p.patternInfo, originalUrl);
    return req.extractedParams !== null;
  });

  if (!apiClient) {
    console.error(`[Node Proxy] No API client handler found for URL: ${originalUrl}`);
    return res.status(404).json({ error: `No proxy handler found for URL: ${originalUrl}` });
  }

  const extractedParams = req.extractedParams;
  console.log(`[Node Proxy] Matched API client: ${apiClient.name}`);
  try {
    // 2. Get authenticated access token
    const accessToken = await getAccessToken(res);
    if (!accessToken) return;

    // 3. Construct the full API URL using env-set GOOGLE_CLOUD_PROJECT/LOCATION and extracted params
    const context = {projectId: GOOGLE_CLOUD_PROJECT, region: GOOGLE_CLOUD_LOCATION};
    const apiUrl = apiClient.getApiEndpoint(context, extractedParams);
    console.log(`[Node Proxy] Forwarding to Vertex API: ${apiUrl}`);

    // 4. Prepare headers for the API call
    const apiHeaders = getRequestHeaders(accessToken);

    const apiFetchOptions = {
      method: method || 'POST',
      headers: {...apiHeaders, ...headers},
      body: body ? body : undefined,
    };

    // 5. Make the call to the API
    const apiResponse = await fetch(apiUrl, apiFetchOptions);

    // 6. Respond to the client based on stream type
    if (apiClient.isStreaming) {
      console.log(`[Node Proxy] Sending STREAMING response for ${apiClient.name}`);
      // Set headers for a streaming JSON response
      res.writeHead(apiResponse.status, {
        'Content-Type': 'text/event-stream',
        'Transfer-Encoding': 'chunked',
        'Connection': 'keep-alive',
      });
      // Immediately send headers
      res.flushHeaders();

      if (!apiResponse.body) {
        console.error('[Node Proxy] Streaming response has no body.');
        return res.end(JSON.stringify({ error: 'Streaming response body is null' }));
      }

      const decoder = new TextDecoder();
      let deltaChunk = '';
      apiResponse.body.on('data', (encodedChunk) => {
        if (res.writableEnded) return; // Prevent writing after res.end()

        try {
          if (!apiClient.transformFn) {
            res.write(encodedChunk);
          } else {
            const decodedChunk = decoder.decode(encodedChunk, { stream: true });
            deltaChunk = deltaChunk + decodedChunk;

            const {result, inProgress} = apiClient.transformFn(deltaChunk);
            if (result && !inProgress) {
              deltaChunk = '';
              res.write(new TextEncoder().encode(result));
            }
          }
        } catch (error) {
          console.error(`[Node Proxy] Error processing streaming response for ${apiClient.name}`);
          console.error(error);
        }
      });

      apiResponse.body.on('end', () => {
        deltaChunk = '';
        console.log(`[Node Proxy] Vertex stream finished and all data processed for ${apiClient.name}`);
        res.end();
      });

      apiResponse.body.on('error', (streamError) => {
        console.error('[Node Proxy] Error from Vertex stream:', streamError);
        if (!res.writableEnded) {
          res.end(JSON.stringify({ proxyError: 'Stream error from Vertex AI', details: streamError.message }));
        }
      });

      res.on('error', (resError) => {
        console.error('[Node Proxy] Error writing to client response:', resError);
        // The source stream might need to be destroyed if an error occurs here.
        if (apiResponse.body && typeof apiResponse.body.destroy === 'function') {
             apiResponse.body.destroy(resError);
        }
      });
    } else {
      // Non-streaming response handling
      console.log(`[Node Proxy] Sending JSON response for ${apiClient.name}`);
      const data = await apiResponse.json();
      res.status(apiResponse.status).json(data);
    }
  } catch (error) {
    console.error(`[Node Proxy] Error proxying request for ${apiClient.name}`);
    console.error(error)
    res.status(500).json({ error: error });
  }
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Vertex AI Backend listening on port ${PORT}`);
  console.log(`Public access should be available via your Railway URL.`);
});


const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', async (request, socket, head) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (url.pathname === '/ws-proxy') {
    
    let targetUrl = url.searchParams.get('target');
    if (!targetUrl) {
      console.log('[Node Proxy] Missing target URL');
      socket.destroy();
      return;
    }

    if (targetUrl === 'wss://aiplatform.googleapis.com//ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent') {
      const location = GOOGLE_CLOUD_LOCATION === 'global' ? 'us-central1' : GOOGLE_CLOUD_LOCATION;
      targetUrl = `wss://${location}-aiplatform.googleapis.com//ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent`;
    } else {
      console.log('[Node Proxy] Invalid target URL');
      socket.destroy();
      return;
    }

    let accessToken;

    try {
      accessToken = await getAccessToken();
      if (!accessToken) throw new Error('No token');
    } catch (err) {
      console.log('[Node Proxy] Authentication failed');
      socket.destroy();
      return;
    }

    console.log(`[Node Proxy] Initiating upstream connection to: ${targetUrl}`);

    let upstreamWs;

    try {
      upstreamWs = new WebSocket(targetUrl, {
        headers: getRequestHeaders(accessToken)
      });
    } catch (e) {
      console.error('[Node Proxy] Invalid Upstream URL');
      socket.destroy();
      return;
    }

    const initialErrorHandler = (error) => {
      console.error('[Node Proxy] Upstream connection failed:', error);
      upstreamWs.removeEventListener('open', onUpstreamOpen);

      if (socket.writable) {
        socket.write('HTTP/1.1 502 Bad Gateway\r\n\r\n');
        socket.destroy();
      }
    };

    upstreamWs.once('error', initialErrorHandler);

    // 5. Handle Successful Upstream Connection
    const onUpstreamOpen = () => {
      // Remove the "bootstrapping" error handler
      upstreamWs.removeListener('error', initialErrorHandler);

      // Perform the HTTP -> WebSocket upgrade for the Client
      wss.handleUpgrade(request, socket, head, (ws) => {

        upstreamWs.on('message', (data, isBinary) => {
          const logMsg = isBinary ? '<Binary Data>' : data.toString();
          console.log(`[Upstream -> Client] [${new Date().toISOString()}]: ${logMsg}`);

          if (ws.readyState === WebSocket.OPEN) {
            if (data === undefined || data === null) {
              console.warn('[Node Proxy] Attempted to send undefined/null data to client');
              return;
            }
            ws.send(data, { binary: isBinary });
          }
        });

        ws.on('message', (data, isBinary) => {
          const logMsg = isBinary ? '<Binary Data>' : data.toString();

          let dataJson = {};
          try {
            dataJson = JSON.parse(data.toString());
          } catch (error) {
            console.error('[Node Proxy] Failed to parse message from client:', error);
            ws.close(1011, 'Failed to parse message');
          }

          if (dataJson['setup']) {
            dataJson['setup']['model'] = `projects/${GOOGLE_CLOUD_PROJECT}/locations/${GOOGLE_CLOUD_LOCATION}/${dataJson['setup']['model']}`;
          }

          if (upstreamWs.readyState === WebSocket.OPEN) {
            upstreamWs.send(JSON.stringify(dataJson), { binary: false });
          }
        });

        upstreamWs.on('error', (error) => {
          console.error('[Node Proxy] Upstream error:', error);
          ws.close(1011, error.message);
        });

        upstreamWs.on('close', (code, reason) => {
          console.log(`[Node Proxy] Upstream closed: ${code} ${reason}`);
          if (ws.readyState === WebSocket.OPEN) {
            ws.close(code, reason);
          }
        });

        ws.on('error', (error) => {
          console.error('[Node Proxy] Client error:', error);
          upstreamWs.close(1011, error.message);
        });

        ws.on('close', (code, reason) => {
          console.log(`[Node Proxy] Client closed: ${code} ${reason}`);
          if (upstreamWs.readyState === WebSocket.OPEN) {
            upstreamWs.close(1000, reason);
          }
        });

        wss.emit('connection', ws, request);
      });
    };

    upstreamWs.once('open', onUpstreamOpen);

    
  } else {
    // Path did not match
    socket.destroy();
  }
  
});


