export interface Risk {
  id?: number;
  risk_id?: string;
  user_id?: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  mitigation: string;
  confidence: number;
  status?: string;
}

export interface DigitalScores {
    urlThreatLevel: number;
    documentSensitivity: number;
    imageAnomalyScore: number;
    videoIncidentScore: number;
}

export interface FullAssessmentResponse {
  risks: Risk[];
  report: string;
  digitalScores: DigitalScores;
}

export interface UserPlan {
  user_id: string;
  assessment_count: number;
  assessment_limit: number;
  is_premium: boolean;
}
