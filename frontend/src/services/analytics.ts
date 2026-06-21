import { api } from "@/lib/api";

export interface AIInsight {
  id: string;
  name: string;
  ai_score: number;
  ai_next_action: string;
}

export interface AIInsightsResponse {
  top_leads: AIInsight[];
  top_deals: AIInsight[];
}

export interface ForecastData {
  month: string;
  expected_revenue: number;
  secured_revenue: number;
}

export interface ForecastResponse {
  forecast: ForecastData[];
}

export const analyticsService = {
  getInsights(): Promise<AIInsightsResponse> {
    return api.get<AIInsightsResponse>("/analytics/insights").then((r) => r.data);
  },
  
  getForecast(): Promise<ForecastResponse> {
    return api.get<ForecastResponse>("/analytics/forecast").then((r) => r.data);
  }
};
