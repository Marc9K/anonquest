import { SurveyStatus } from "@/model/SurveyStatus";

export interface FirestoreSurvey {
  title: string;
  description: string;
  ownerEmail: string;
  questions?: FirestoreQuestion[];
  status: SurveyStatus;
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

export interface Loadable {
  load(): Promise<void>;
}
