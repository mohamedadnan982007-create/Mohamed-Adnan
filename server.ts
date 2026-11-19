import "dotenv/config";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI, Type } from "@google/genai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === "production";

const VALID_LANDMARK_IDS = [
  "chennai-central",
  "t-nagar",
  "marina-beach",
  "guindy",
  "omr-corridor",
  "tambaram",
] as const;

const VALID_LENSES = [
  "commute",
  "quick-bite",
  "quiet-study",
  "safe-night",
] as const;

function createGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function generateWithRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const status =
        typeof err === "object" && err !== null && "status" in err
          ? Number((err as { status?: unknown }).status)
          : 0;
      const isTransient = status === 429 || status === 503 || status === 500;
      if (!isTransient || attempt === maxAttempts) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 450 * Math.pow(2, attempt - 1)));
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", app: "A-Maps" });
  });

  app.post("/api/copilot/search", async (req, res) => {
    const rawQuery = typeof req.body?.query === "string" ? req.body.query.trim() : "";
    const activeLens = typeof req.body?.activeLens === "string" ? req.body.activeLens : "commute";

    if (!rawQuery) {
      res.status(400).json({ error: "Please enter a Chennai location or transit question." });
      return;
    }

    if (rawQuery.length > 400) {
      res.status(400).json({ error: "Query is too long. Please keep it under 400 characters." });
      return;
    }

    const ai = createGeminiClient();
    if (!ai) {
      res.status(503).json({
        error:
          "Gemini API key is not configured. Please check your API key in Settings > Secrets.",
      });
      return;
    }

    const systemInstruction = `You are A-Maps Spatial Copilot, a hyper-local Chennai commuter transit and spatial assistant.
You have deep, accurate knowledge of Chennai neighborhoods, CMRL Metro Blue Line (Wimco Nagar - Central - AG-DMS - Saidapet - Guindy - Airport), CMRL Metro Green Line (Central - Egmore - Koyambedu - Vadapalani - Alandur - St. Thomas Mount), Chennai Suburban Rail (Beach - Central/Park - Mambalam/T. Nagar - Guindy - Tambaram), MTC bus routes (including 21G, 23C, 102, 570, 5C), Anna Salai, OMR IT Corridor (Tidel Park, Perungudi, Sholinganallur), Marina Beach, and real Chennai cafes, tiffin spots, libraries, and late-night safe corridors.

Always return EXACTLY 3 structured, realistic, hyper-local Chennai recommendations tailored to the commuter's query and active intent lens (${activeLens}).
- Keep each "reason" to ONE crisp, specific sentence explaining why it fits the user's intent.
- Keep "detourTime" concise and realistic (e.g., "+5 min detour", "+3 min walk", "On route · 0 min").
- Keep "transitMode" grounded in Chennai transit (e.g., "Metro Blue Line + 4 min walk", "MTC 21G / Share Auto", "Suburban EMU + Footbridge").
- Keep "contextNote" to a compact 2-part insight separated by " · " (e.g., "₹160 avg · 80 Mbps Wi-Fi" or "Well-lit · High footfall").
- Map "nearestLandmarkId" strictly to one of: chennai-central, t-nagar, marina-beach, guindy, omr-corridor, tambaram.
- Map "recommendedLens" strictly to one of: commute, quick-bite, quiet-study, safe-night.`;

    try {
      const response = await generateWithRetry(() =>
        ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Commuter spatial query: "${rawQuery}"`,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summary: {
                  type: Type.STRING,
                  description:
                    "One short sentence summarizing the spatial strategy in Chennai for this query.",
                },
                recommendedLens: {
                  type: Type.STRING,
                  description:
                    "Best matching intent lens: commute, quick-bite, quiet-study, or safe-night.",
                },
                recommendations: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: {
                        type: Type.STRING,
                        description: "Specific Chennai spot, venue, or transit hub name.",
                      },
                      area: {
                        type: Type.STRING,
                        description: "Neighborhood or transit station reference in Chennai.",
                      },
                      nearestLandmarkId: {
                        type: Type.STRING,
                        description:
                          "Closest map landmark ID: chennai-central, t-nagar, marina-beach, guindy, omr-corridor, or tambaram.",
                      },
                      detourTime: {
                        type: Type.STRING,
                        description: "Estimated detour time such as '+6 min detour' or '+3 min walk'.",
                      },
                      transitMode: {
                        type: Type.STRING,
                        description: "Recommended Chennai transit mode and last-mile connection.",
                      },
                      reason: {
                        type: Type.STRING,
                        description: "Exactly one sentence explaining why it fits the user's intent.",
                      },
                      contextNote: {
                        type: Type.STRING,
                        description:
                          "Short hyper-local detail with separator, e.g. '₹140 avg · Fast service'.",
                      },
                    },
                    required: [
                      "name",
                      "area",
                      "nearestLandmarkId",
                      "detourTime",
                      "transitMode",
                      "reason",
                      "contextNote",
                    ],
                  },
                },
              },
              required: ["summary", "recommendedLens", "recommendations"],
            },
          },
        }),
      );

      const rawText = (response.text ?? "").trim();
      if (!rawText) {
        res.status(502).json({ error: "Gemini returned an empty response. Please try again." });
        return;
      }

      const parsed = JSON.parse(rawText) as {
        summary?: string;
        recommendedLens?: string;
        recommendations?: Array<{
          name?: string;
          area?: string;
          nearestLandmarkId?: string;
          detourTime?: string;
          transitMode?: string;
          reason?: string;
          contextNote?: string;
        }>;
      };

      const sanitizedLens = VALID_LENSES.includes(
        parsed.recommendedLens as (typeof VALID_LENSES)[number],
      )
        ? parsed.recommendedLens
        : activeLens;

      const recommendations = (parsed.recommendations ?? []).slice(0, 3).map((rec, index) => ({
        id: `rec-${Date.now()}-${index}`,
        name: rec.name?.trim() || "Chennai Transit Spot",
        area: rec.area?.trim() || "Chennai",
        nearestLandmarkId: VALID_LANDMARK_IDS.includes(
          rec.nearestLandmarkId as (typeof VALID_LANDMARK_IDS)[number],
        )
          ? rec.nearestLandmarkId
          : "guindy",
        detourTime: rec.detourTime?.trim() || "+5 min detour",
        transitMode: rec.transitMode?.trim() || "CMRL Metro / MTC",
        reason: rec.reason?.trim() || "Conveniently aligned along your Chennai commute corridor.",
        contextNote: rec.contextNote?.trim() || "Verified Chennai corridor",
      }));

      res.json({
        query: rawQuery,
        summary:
          parsed.summary?.trim() ||
          "Top 3 hyper-local Chennai recommendations along your corridor.",
        recommendedLens: sanitizedLens,
        recommendations,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to reach Gemini spatial assistant.";
      const status =
        typeof err === "object" && err !== null && "status" in err
          ? Number((err as { status?: unknown }).status)
          : 500;

      if (status === 403 || status === 400 || message.includes("API_KEY")) {
        res.status(403).json({
          error:
            "Gemini API key was rejected or is missing permissions. Please verify your key in Settings > Secrets.",
        });
        return;
      }

      if (status === 429) {
        res.status(429).json({
          error:
            "Gemini API rate limit reached. Please wait a moment and retry, or check your API quota in Settings > Secrets.",
        });
        return;
      }

      res.status(500).json({
        error: `Spatial search error: ${message}`,
      });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      const indexHtml = path.join(distPath, "index.html");
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send("Build output not found. Run npm run build first.");
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`A-Maps server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
