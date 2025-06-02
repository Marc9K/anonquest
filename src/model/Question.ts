import {
  collection,
  DocumentData,
  DocumentReference,
  getDocs,
  QueryDocumentSnapshot,
} from "firebase/firestore";

import { type Loadable } from "@/interfaces/firestore";
import Answer from "./Answer";

export default class Question implements Loadable {
  title?: string;
  _title?: string;
  description?: string;

  answers: Answer[] = [];
  answersToDelete: Answer[] = [];

  ref?: DocumentReference<DocumentData, DocumentData>;

  constructor(question?: QueryDocumentSnapshot<DocumentData, DocumentData>) {
    this.title = question?.id ?? "";
    this._title = question?.id;
    this.description = question?.data().description ?? "";
    this.ref = question?.ref;
  }

  delete(answer: Answer) {
    this.answersToDelete.push(answer);
    this.answers = this.answers?.filter((a) => a !== answer);
  }

  deleting(answer: Answer) {
    this.delete(answer);
    return this.copy;
  }

  async load() {
    if (!this.ref) throw new Error("No ref found");
    const answersRef = collection(this.ref, "answers");
    const answersSnap = await getDocs(answersRef);
    this.answers = answersSnap.docs.map((doc) => new Answer(doc));
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

  get copy() {
    const copy = new Question();
    copy.title = this.title;
    copy._title = this._title;
    copy.description = this.description;
    copy.answers = this.answers;
    copy.answersToDelete = this.answersToDelete;
    copy.ref = this.ref;
    return copy;
  }

  addingOption() {
    if (this.hasVacantOption) return this;
    this.answers?.push(new Answer());
    return this.copy;
  }

  replacing(answer: Answer, newAnswer: Answer) {
    if (this.answers?.find((answer) => answer.equals(newAnswer))) return this;

    const index = this.answers?.findIndex((a) => a.equals(answer));

    this.answers?.splice(index!, 1, newAnswer);

    return this.copy;
  }
}
