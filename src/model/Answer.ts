import { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

export default class Answer {
  static fireCollection = "answers";
  title: string;
  _title?: string;
  count: number;
  orderIndex: number = 0;
  numericValue?: number;

  constructor(
    doc?: QueryDocumentSnapshot<DocumentData, DocumentData>,
    title?: string,
    numericValue?: number
  ) {
    this.title = doc?.id ?? title ?? "";
    this._title = doc?.id ?? title ?? "";
    this.count = doc?.data().count ?? 0;
    this.orderIndex = doc?.data().orderIndex ?? 0;
    this.numericValue = doc?.data().numericValue ?? numericValue;
  }

  equals(other: Answer) {
    return other.title === this.title;
  }

  renaming(title: string) {
    const copy = new Answer();
    copy.title = title;
    copy.orderIndex = this.orderIndex;
    copy.numericValue = this.numericValue;
    return copy;
  }

  get copy() {
    const copy = new Answer();
    copy.title = this.title;
    copy._title = this._title;
    copy.count = this.count;
    copy.orderIndex = this.orderIndex;
    copy.numericValue = this.numericValue;
    return copy;
  }

  get firestore() {
    return {
      id: this.title,
      data: {
        count: this.count,
        orderIndex: this.orderIndex,
        numericValue: this.numericValue,
      },
    };
  }
}
