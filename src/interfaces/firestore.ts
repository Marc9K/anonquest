import { SurveyStatus } from "@/model/SurveyStatus";

export interface FirestoreSurvey {
  title: string;
  description: string;
  ownerEmail: string;
  questions?: FirestoreQuestion[];
  status: SurveyStatus;
  totalParticipants?: number;
  responseCount?: number;
  publishedAt?: unknown; // Firestore Timestamp
  totalParticipantsAtClose?: number;
}

export interface FirestoreQuestion {
  title: string;
  description: string;
  answers?: FirestoreAnswer[];
}

export interface FirestoreAnswer {
  title: string;
  count: number;
}

export interface FirestoreIntersection {
  label: string;
  questionTitles: string[];
  operator?: "and";
  // dynamic combination keys: [key: string]: number
}

export interface Loadable {
  load(): Promise<void>;
}
