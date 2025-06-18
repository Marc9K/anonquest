import { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

export default class Answer {
  static fireCollection = "answers";
  title: string;
  _title?: string;
  count: number;
  orderIndex: number = 0;

  constructor(
    doc?: QueryDocumentSnapshot<DocumentData, DocumentData>,
    title?: string
  ) {
    this.title = doc?.id ?? title ?? "";
    this._title = doc?.id ?? title ?? "";
    this.count = doc?.data().count ?? 0;
    this.orderIndex = doc?.data().orderIndex ?? 0;
  }

  equals(other: Answer) {
    return other.title === this.title;
  }

  renaming(title: string) {
    const copy = new Answer();
    copy.title = title;
    copy.orderIndex = this.orderIndex;
    return copy;
  }

  get copy() {
    const copy = new Answer();
    copy.title = this.title;
    copy._title = this._title;
    copy.count = this.count;
    copy.orderIndex = this.orderIndex;
    return copy;
  }

  get firestore() {
    return {
      id: this.title,
      data: {
        count: this.count,
        orderIndex: this.orderIndex,
      },
    };
  }
}
