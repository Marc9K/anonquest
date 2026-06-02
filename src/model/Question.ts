import {
  collection,
  DocumentData,
  DocumentReference,
  getDocs,
  QueryDocumentSnapshot,
} from "firebase/firestore";

import { type Loadable } from "@/interfaces/firestore";
import Answer from "./Answer";

export enum QuestionType {
  SINGLE_CHOICE = "single-choice",
  MULTI_CHOICE = "multi-choice",
  NUMERIC = "numeric",
  TEXT = "text",
  DATE = "date",
  CHECKBOX = "checkbox",
}

export type DateVariant =
  | "date"
  | "time"
  | "datetime"
  | "month-only"
  | "year-month"
  | "year";

export enum QuestionPrefilled {
  ETHNICITY = "ethnicity",
  RELIGION = "religion",
  COUNTRY = "country",
  SEXUAL_ORIENTATION = "sexual orientation",
}

export default class Question implements Loadable {
  static fireCollection = "questions";

  title?: string;
  _title?: string;
  description?: string;
  orderIndex: number = 0;
  type: QuestionType = QuestionType.SINGLE_CHOICE;

  // Numeric
  numericPrefix?: string;
  numericSuffix?: string;
  numericMin?: number;
  numericMax?: number;

  // Date
  dateVariant?: DateVariant;
  dateMin?: string;
  dateMax?: string;
  dateFutureOnly?: boolean;
  datePastOnly?: boolean;

  // Text
  textCaseSensitive?: boolean;
  textMinLength?: number;
  textMaxLength?: number;

  answers: Answer[] = [];
  answersToDelete: Answer[] = [];

  ref?: DocumentReference<DocumentData, DocumentData>;

  constructor(question?: QueryDocumentSnapshot<DocumentData, DocumentData>) {
    this.title = question?.id ?? "";
    this._title = question?.id;
    this.description = question?.data().description ?? "";
    this.orderIndex = question?.data().orderIndex ?? 0;
    this.type = question?.data().type ?? QuestionType.SINGLE_CHOICE;
    this.numericPrefix = question?.data().numericPrefix ?? "";
    this.numericSuffix = question?.data().numericSuffix ?? "";
    this.numericMin = question?.data().numericMin;
    this.numericMax = question?.data().numericMax;
    this.dateVariant = question?.data().dateVariant;
    this.dateMin = question?.data().dateMin;
    this.dateMax = question?.data().dateMax;
    this.dateFutureOnly = question?.data().dateFutureOnly;
    this.datePastOnly = question?.data().datePastOnly;
    this.textCaseSensitive = question?.data().textCaseSensitive;
    this.textMinLength = question?.data().textMinLength;
    this.textMaxLength = question?.data().textMaxLength;
    this.ref = question?.ref;
    this.answers =
      question
        ?.data()
        .answers?.map((answer: string) => new Answer(undefined, answer)) ?? [];
  }

  delete(answer: Answer) {
    this.answersToDelete.push(answer);
    this.answers = this.answers?.filter((a) => a !== answer);
  }

  deleting(answer: Answer) {
    const copy = this.copy;
    copy.delete(answer);
    return copy;
  }

  async load() {
    if (!this.ref) throw new Error("No ref found");
    const answersRef = collection(this.ref, "answers");
    try {
      const answersSnap = await getDocs(answersRef);
      this.answers = answersSnap.docs.map((doc) => new Answer(doc));
    } catch (error) {
      console.error("Error loading answers: ", error);
    }
  }

  static async getAllFrom(
    survey: DocumentReference<DocumentData, DocumentData>
  ) {
    const questionsRef = collection(survey, "questions");
    const questionsSnap = await getDocs(questionsRef);
    return await Promise.all(
      questionsSnap.docs.map(async (q) => {
        const question = new Question(q);
        return question;
      })
    );
  }

  get isLocal() {
    return !this.ref;
  }

  equals(other: Question) {
    return other.title === this.title;
  }

  get id() {
    return this.isLocal ? this.title : this._title;
  }

  get isNotFilled() {
    return this.title?.trim().length === 0;
  }

  get hasVacantOption() {
    return this.answers?.some((answer) => answer.title.trim().length === 0);
  }

  /** True for types that use an explicit answer options list. */
  get hasAnswerOptions() {
    return (
      this.type === QuestionType.SINGLE_CHOICE ||
      this.type === QuestionType.MULTI_CHOICE
    );
  }

  /** HTML <input type> string for this question, used by QuestionCard. */
  get inputType(): string {
    switch (this.type) {
      case QuestionType.NUMERIC:
        return "number";
      case QuestionType.DATE:
        switch (this.dateVariant) {
          case "time":
            return "time";
          case "datetime":
            return "datetime-local";
          case "year":
            return "number";
          case "year-month":
            return "month";
          default:
            return "date";
        }
      default:
        return "text";
    }
  }

  /** Normalize a free-text answer before using it as a Firestore doc key. */
  normalizeAnswer(raw: string): string {
    const trimmed = raw.trim();
    return this.textCaseSensitive ? trimmed : trimmed.toLowerCase();
  }

  get copy() {
    const copy = new Question();
    copy.title = this.title;
    copy._title = this._title;
    copy.description = this.description;
    copy.orderIndex = this.orderIndex;
    copy.type = this.type;
    copy.numericPrefix = this.numericPrefix;
    copy.numericSuffix = this.numericSuffix;
    copy.numericMin = this.numericMin;
    copy.numericMax = this.numericMax;
    copy.dateVariant = this.dateVariant;
    copy.dateMin = this.dateMin;
    copy.dateMax = this.dateMax;
    copy.dateFutureOnly = this.dateFutureOnly;
    copy.datePastOnly = this.datePastOnly;
    copy.textCaseSensitive = this.textCaseSensitive;
    copy.textMinLength = this.textMinLength;
    copy.textMaxLength = this.textMaxLength;
    copy.answers = this.answers;
    copy.answersToDelete = this.answersToDelete;
    copy.ref = this.ref;
    return copy;
  }

  get firestore() {
    return {
      id: this.id,
      collections: {
        answers: this.answers
          ?.sort((a, b) => a.orderIndex - b.orderIndex)
          .map((answer) => answer.firestore),
      },
      data: {
        title: this.title,
        answers: this.answers?.map((answer) => answer.title),
        description: this.description,
        orderIndex: this.orderIndex,
        type: this.type,
        numericPrefix: this.numericPrefix,
        numericSuffix: this.numericSuffix,
        numericMin: this.numericMin,
        numericMax: this.numericMax,
        dateVariant: this.dateVariant,
        dateMin: this.dateMin,
        dateMax: this.dateMax,
        dateFutureOnly: this.dateFutureOnly,
        datePastOnly: this.datePastOnly,
        textCaseSensitive: this.textCaseSensitive,
        textMinLength: this.textMinLength,
        textMaxLength: this.textMaxLength,
      },
    };
  }

  addingOption() {
    if (this.hasVacantOption) return this.copy;
    const copy = this.copy;
    copy.answers?.push(new Answer());
    return copy;
  }

  replacing(answer: Answer, newAnswer: Answer) {
    const copy = this.copy;
    if (this.answers?.find((a) => a.equals(newAnswer))) return this;
    const index = copy.answers?.findIndex((a) => a.equals(answer));
    copy.answersToDelete.push(answer);
    copy.answers?.splice(index!, 1, newAnswer);
    return copy;
  }

  get isNumeric() {
    return this.type === QuestionType.NUMERIC;
  }

  get hasNumericLimits() {
    return this.numericMin !== undefined && this.numericMax !== undefined;
  }
}
