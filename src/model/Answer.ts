import { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

export default class Answer {
  static fireCollection = "answers";
  title: string;
  _title?: string;
  count: number;
  constructor(doc?: QueryDocumentSnapshot<DocumentData, DocumentData>) {
    this.title = doc?.id ?? "";
    this._title = doc?.id ?? "";
    this.count = doc?.data().count ?? 0;
  }

  equals(other: Answer) {
    return other.title === this.title;
  }

  renaming(title: string) {
    const copy = new Answer();
    copy.title = title;
    return copy;
  }

  get copy() {
    const copy = new Answer();
    copy.title = this.title;
    copy._title = this._title;
    copy.count = this.count;
    return copy;
  }

  get firestore() {
    return {
      id: this.title,
      data: {
        count: this.count,
      },
    };
  }
}
