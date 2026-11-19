export type IntentLensId = "commute" | "quick-bite" | "quiet-study" | "safe-night";

export type AppTab = "map" | "copilot" | "tracker";

export type LandmarkId =
  | "chennai-central"
  | "t-nagar"
  | "marina-beach"
  | "guindy"
  | "omr-corridor"
  | "tambaram";

export type TransitLineId = "metro-blue" | "metro-green" | "suburban-rail" | "omr-arterial";

export type CrowdLevel = "Low" | "Moderate" | "High";

export interface LensConfig {
  id: IntentLensId;
  label: string;
  shortLabel: string;
  headline: string;
  accentHex: string;
  glowHex: string;
  badgeTextClass: string;
  badgeBgClass: string;
  activePillClass: string;
  highlightedLines: TransitLineId[];
}

export interface LandmarkLensInsight {
  badge: string;
  detail: string;
  highlightMetric: string;
  recommended: boolean;
}

export interface ChennaiLandmark {
  id: LandmarkId;
  name: string;
  shortName: string;
  district: string;
  x: number;
  y: number;
  labelOffsetX: number;
  labelOffsetY: number;
  badgeOffsetX: number;
  badgeOffsetY: number;
  transitConnections: string[];
  lenses: Record<IntentLensId, LandmarkLensInsight>;
}

export interface TransitLine {
  id: TransitLineId;
  name: string;
  shortName: string;
  color: string;
  pathD: string;
  dashed?: boolean;
  stations: Array<{ name: string; x: number; y: number }>;
}

export interface CopilotRecommendation {
  id: string;
  name: string;
  area: string;
  nearestLandmarkId: LandmarkId;
  detourTime: string;
  transitMode: string;
  reason: string;
  contextNote: string;
}

export interface CopilotResponse {
  query: string;
  summary: string;
  recommendedLens: IntentLensId;
  recommendations: CopilotRecommendation[];
}

export interface TripStop {
  id: string;
  name: string;
  subtitle: string;
  minutesFromStart: number;
  crowd: CrowdLevel;
  platformOrBay: string;
  distanceKm: number;
}

export interface TransitTrip {
  id: string;
  mode: "Chennai Metro" | "MTC Bus";
  routeCode: string;
  routeLineName: string;
  accentColor: string;
  origin: string;
  destination: string;
  fareInr: number;
  vehicleTag: string;
  stops: TripStop[];
}
