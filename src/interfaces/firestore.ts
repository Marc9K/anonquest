export interface FirestoreSurvey {
  title: string;
  description: string;
  participants: string[];
  ownerEmail: string;
  questions?: FirestoreQuestion[];
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
