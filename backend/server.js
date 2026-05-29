
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
import { createClient } from '@supabase/supabase-js';
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

// Supabase initialization
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
console.log('Supabase: Client initialized.');

// Helpers: convert between camelCase (frontend) and snake_case (Supabase)
function toDb(talent) {
  const row = {
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

function fromDb(row) {
  return {
    id:              row.id,
    name:            row.name,
    ethnicity:       row.ethnicity,
    gender:          row.gender,
    ageRange:        row.age_range,
    personality:     row.personality,
    bestFit:         row.best_fit,
    outfits:         row.outfits,
    voices:          row.voices,
    useCases:        row.use_cases,
    imageSeed:       row.image_seed,
    profileImageUrl: row.profile_image_url,
    mainImageUrl:    row.main_image_url,
    turnaroundUrls:  row.turnaround_urls,
    expressionUrls:  row.expression_urls,
    closeupUrl:      row.closeup_url,
    position:        row.position ?? null,
  };
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
      port: PORT,
      cloudinary: !!process.env.CLOUDINARY_CLOUD_NAME,
      supabase: !!process.env.SUPABASE_URL,
    }
  };

  try {
    const { data, error } = await supabase.from('talents').select('id').limit(1);
    if (error) throw new Error(error.message);
    results.supabase = 'OK';
  } catch (e) {
    results.supabase = `ERROR: ${e.message}`;
  }

  results.cloudinary = process.env.CLOUDINARY_CLOUD_NAME ? 'CONFIGURED' : 'MISSING CREDENTIALS';

  res.json(results);
});

// --- Talent Management API Endpoints ---

// GET /api/talents - Fetch all talents, ordered by position then created_at
app.get('/api/talents', async (req, res) => {
  try {
    // Try ordering by position; fall back to default order if column doesn't exist yet
    let result = await supabase
      .from('talents')
      .select('*')
      .order('position', { ascending: true, nullsFirst: false });
    if (result.error && result.error.message.includes('column talents.position does not exist')) {
      // Position column not yet added — return in natural DB order
      result = await supabase.from('talents').select('*');
    }
    if (result.error) throw new Error(result.error.message);
    res.json(result.data.map(fromDb));
  } catch (error) {
    console.error('Error fetching talents:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/talents - Create new talent (appended to end of order)
app.post('/api/talents', async (req, res) => {
  console.log('API: Received request to create talent:', req.body?.name);
  try {
    // Assign position = current count so new talent goes to end
    const { count } = await supabase.from('talents').select('*', { count: 'exact', head: true });
    const row = toDb({ ...req.body, position: count ?? 0 });
    const { data, error } = await supabase.from('talents').insert(row).select().single();
    if (error) throw new Error(error.message);
    console.log('API: Successfully created talent with ID:', data.id);
    res.json(fromDb(data));
  } catch (error) {
    console.error('API Error creating talent:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/reorder - Persist drag-and-drop order to Supabase
app.post('/api/reorder', async (req, res) => {
  try {
    const { order } = req.body; // [{ id, position }, ...]
    if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be an array' });
    const updates = order.map(({ id, position }) =>
      supabase.from('talents').update({ position }).eq('id', id)
    );
    const results = await Promise.all(updates);
    const failed = results.find(r => r.error);
    if (failed) {
      if (failed.error.message.includes('column') && failed.error.message.includes('position')) {
        return res.status(400).json({ error: 'position_column_missing', message: 'Run the SQL migration in Supabase to enable persistent ordering.' });
      }
      throw new Error(failed.error.message);
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error reordering talents:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/talents/:id - Update talent
app.put('/api/talents/:id', async (req, res) => {
  const { id } = req.params;
  console.log('API: Received request to update talent:', id);
  try {
    const row = toDb({ ...req.body, id });
    const { data, error } = await supabase.from('talents').upsert(row).select().single();
    if (error) throw new Error(error.message);
    console.log('API: Successfully updated talent:', id);
    res.json(fromDb(data));
  } catch (error) {
    console.error('API Error updating talent:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/talents/:id - Delete talent
app.delete('/api/talents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('talents').delete().eq('id', id);
    if (error) throw new Error(error.message);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Error deleting talent:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/login - Validate admin credentials (stored in env, never exposed to client)
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const validUser = process.env.ADMIN_USERNAME;
  const validPass = process.env.ADMIN_PASSWORD;
  if (!validUser || !validPass) {
    return res.status(500).json({ error: 'Server auth not configured.' });
  }
  if (username === validUser && password === validPass) {
    return res.json({ success: true });
  }
  return res.status(401).json({ error: 'Invalid credentials.' });
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
console.log(`Supabase: ${process.env.SUPABASE_URL ? 'CONFIGURED' : 'MISSING'}`);
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


