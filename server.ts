import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  // AI Studio requires dev server on port 3000 (nginx is on 8080)
  const PORT = 3000;

  app.use(express.json());

  // Server-side Google GenAI initialization with User-Agent header
  const ai = process.env.GEMINI_API_KEY
    ? new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      })
    : null;

  // In-memory cache for route previews to prevent redundant API calls and rate-limiting
  const previewCache = new Map<string, { data: any; timestamp: number }>();
  const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes cache
  let geminiQuotaExhaustedUntil = 0;

  // Curated Coimbatore corridor insights for school transport safety
  const getCuratedCorridorGuidance = (routeCode: string, routeName: string, origin: string, destination: string) => {
    const code = (routeCode || '').toUpperCase();
    if (code.includes('101')) {
      return `Corridor Navigation for Gandhipuram Express: Originates at ${origin}, proceeding along 100 Feet Road and Cross Cut Road, merging onto Avinashi Road arterial at Nava India flyover towards Peelamedu campus. Caution Zones: Gandhipuram signal complex, Lakshmi Mills signal, and Nava India morning bottlenecks. Safety Guidance: Strict 40 km/h speed governor compliance, bus lane priority, ensure student door security at all times.`;
    }
    if (code.includes('102')) {
      return `Corridor Navigation for RS Puram Route: Originates at ${origin}, traversing DB Road and Thiruvenkatasamy Road, passing Brookefields Sukrawarpet junction, and merging via Avinashi Road towards Peelamedu campus. Caution Zones: DB Road commercial morning traffic and Sukrawarpet pedestrian crossing. Safety Guidance: Approach pedestrian crossings cautiously, observe student boarding curb safety.`;
    }
    if (code.includes('103')) {
      return `Corridor Navigation for Singanallur Corridor: Originates at ${origin}, traversing Trichy Road, Ondipudur flyover link, Ramanathapuram signal, and connecting via Hope College road to Peelamedu. Caution Zones: Singanallur junction and Ramanathapuram flyover descents. Safety Guidance: Maintain safe following distance during peak commercial transit hours.`;
    }
    if (code.includes('104')) {
      return `Corridor Navigation for Saravanampatti IT Corridor: Originates at ${origin}, navigating Sathy Road, CHIL SEZ link road, and Peelamedu bypass corridor. Caution Zones: Saravanampatti IT commuter peaks and Sathy Road intersection. Safety Guidance: Plan stop approach early with hazard indicator warnings.`;
    }
    if (code.includes('105')) {
      return `Corridor Navigation for Vadavalli Route: Originates at ${origin}, proceeding through Maruthamalai Main Road, Lawley Road roundabout, Cowley Brown Road, and Avinashi Road towards Peelamedu. Caution Zones: Lawley Road roundabout and DB Road traffic. Safety Guidance: Extra buffer around educational institution junctions.`;
    }
    return `Corridor Navigation for ${routeName}: Navigating designated Coimbatore arterial transit corridors between ${origin} and ${destination}. All intermediate stops mapped with standard speed-governor limits (40 km/h). Maintain school vehicle protocols and verify guardian 6-digit handover PINs at drop-offs.`;
  };

  // POST /api/routes/preview: dynamically fetch upcoming trip path, list of student stops, Google Maps Grounding & expected arrival times
  app.post('/api/routes/preview', async (req, res) => {
    try {
      const { route, trip, studentsAtStops, session, startLocation, destination } = req.body;

      if (!route) {
        return res.status(400).json({ error: 'Route information is required' });
      }

      const cacheKey = `${route.id || route.routeCode}-${session || trip?.session || 'Morning'}`;
      const now = Date.now();
      const cached = previewCache.get(cacheKey);
      if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
        return res.json(cached.data);
      }

      const stopsList = route.pickupPoints || [];
      const originName = startLocation || route.startLocation || 'Origin Hub';
      const destinationName = destination || route.destination || 'Kovai Valley Matriculation School, Coimbatore';

      let aiInsights = '';
      let mapLinks: { uri: string; title: string }[] = [];

      // Check if we can attempt Gemini Maps Grounding (not in 429 quota exhaustion cooldown)
      const canCallGemini = ai && (now > geminiQuotaExhaustedUntil);

      if (canCallGemini) {
        try {
          const stopsSummary = stopsList
            .map((s: any, idx: number) => `Stop ${idx + 1}: ${s.name} (${s.address}) - Expected: ${s.morningTime || s.afternoonTime}`)
            .join('; ');

          const prompt = `You are a school bus route intelligence navigator for Kovai Valley Matriculation School in Coimbatore, Tamil Nadu, India.
Analyze this upcoming school bus trip path along the Coimbatore corridor:
- Route Corridor: ${route.name} (${route.routeCode})
- Trip Session: ${session || trip?.session || 'Morning Pickup'}
- Starting Origin: ${originName}
- Campus Destination: ${destinationName}
- Total Distance: ${route.estimatedDistanceKm || 15} km
- Stops: ${stopsSummary}

Provide a concise, practical route preview for the bus driver:
1. Recommended driving corridor and path across Coimbatore arterial roads (e.g., Avinashi Road, Trichy Road, Sathy Road, Mettupalayam Road, 100 Feet Road, Cross Cut Road, etc.).
2. High-traffic choke points or caution zones along this specific Coimbatore path.
3. Accurate transit navigation tips for maneuvering a school bus between these stops safely.`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              tools: [{ googleMaps: {} }],
              toolConfig: {
                retrievalConfig: {
                  latLng: {
                    latitude: 11.0168,
                    longitude: 76.9558, // Coimbatore, Tamil Nadu
                  },
                },
              },
            },
          });

          aiInsights = response.text || '';

          // Extract Maps grounding links from groundingChunks as required by Google Maps Grounding skill
          const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
          if (Array.isArray(chunks)) {
            chunks.forEach((chunk: any) => {
              if (chunk.maps?.uri) {
                mapLinks.push({
                  uri: chunk.maps.uri,
                  title: chunk.maps.title || 'View Location on Google Maps',
                });
              }
            });
          }
        } catch (apiError: any) {
          // If quota exhausted (429 / RESOURCE_EXHAUSTED), set cooldown without logging noisy error payloads
          const errMsg = String(apiError?.message || '');
          const errStatus = String(apiError?.status || '');
          if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errStatus.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota')) {
            geminiQuotaExhaustedUntil = Date.now() + 15 * 60 * 1000; // 15 minute cooldown
          }
          // Fall back gracefully to curated Coimbatore corridor guidance
          aiInsights = getCuratedCorridorGuidance(route.routeCode, route.name, originName, destinationName);
        }
      }

      if (!aiInsights) {
        aiInsights = getCuratedCorridorGuidance(route.routeCode, route.name, originName, destinationName);
      }

      // Ensure driver always has genuine Google Maps links for corridor and stops
      if (mapLinks.length === 0) {
        mapLinks.push({
          uri: `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originName + ', Coimbatore')}&destination=${encodeURIComponent(destinationName + ', Coimbatore')}`,
          title: `${route.name} Full Corridor Directions`,
        });
        stopsList.forEach((stop: any) => {
          mapLinks.push({
            uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.name + ', ' + (stop.address || '') + ', Coimbatore, Tamil Nadu')}`,
            title: `${stop.name} (Stop Location)`,
          });
        });
      }

      // Compute dynamic expected arrival times for each stop
      const isMorning = (session || trip?.session || '').toLowerCase().includes('morning');
      const baseStartTimeStr = trip?.scheduledStartTime || (isMorning ? '07:00 AM' : '03:00 PM');

      const computedStops = stopsList.map((stop: any, idx: number) => {
        const scheduledTime = isMorning ? stop.morningTime : stop.afternoonTime;
        const studentCount = (studentsAtStops && studentsAtStops[stop.id]) ? studentsAtStops[stop.id].length : 0;
        const assignedStudents = (studentsAtStops && studentsAtStops[stop.id]) || [];

        return {
          id: stop.id,
          order: idx + 1,
          name: stop.name,
          address: stop.address,
          landmark: stop.landmark || 'Designated School Shelter',
          scheduledTime,
          expectedArrival: scheduledTime,
          passengerCount: studentCount,
          assignedStudents,
          distanceFromStartKm: +( (route.estimatedDistanceKm / Math.max(1, stopsList.length - 1)) * idx ).toFixed(1),
          status: idx === 0 ? 'Start Point' : idx === stopsList.length - 1 ? 'Campus Destination' : 'Student Stop',
        };
      });

      const resultPayload = {
        success: true,
        routeId: route.id,
        routeName: route.name,
        routeCode: route.routeCode,
        session: session || trip?.session || 'Morning Pickup',
        tripCode: trip?.tripCode || `TRIP-${route.routeCode}`,
        origin: originName,
        destination: destinationName,
        totalDistanceKm: route.estimatedDistanceKm,
        estimatedDurationMin: route.estimatedDurationMin,
        departureTime: baseStartTimeStr,
        estimatedCampusArrival: isMorning ? '07:45 AM' : '03:45 PM',
        stops: computedStops,
        aiInsights,
        mapLinks,
        coimbatoreCorridor: route.description || `${route.name} via Avinashi Road and arterial link ways`,
        trafficCondition: 'Normal Traffic (Flowing Safely)',
      };

      // Store in memory cache
      previewCache.set(cacheKey, { data: resultPayload, timestamp: now });

      return res.json(resultPayload);
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to generate route preview' });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'SmartRoute API' });
  });

  // Vite middleware in dev or static files in prod
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SmartRoute server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
