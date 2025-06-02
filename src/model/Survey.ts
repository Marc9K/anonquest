import { db } from "@/app/firebase";
import { create } from "domain";
import {
  FirestoreQuestion,
  FirestoreSurvey,
  type Loadable,
} from "@/interfaces/firestore";
import {
  arrayRemove,
  collection,
  deleteDoc,
  doc,
  DocumentData,
  DocumentReference,
  getDoc,
  getDocs,
  increment,
  runTransaction,
  setDoc,
} from "firebase/firestore";
import Question from "./Question";
import Answer from "./Answer";

export default class Survey implements Loadable {
  id?: string;
  title?: string;
  description?: string;
  participants?: string[];
  ownerEmail?: string;

  questions?: Question[];
  deletedQuestions: Question[] = [];

  ref?: DocumentReference<DocumentData, DocumentData>;
  loaded = false;

  constructor(id?: string) {
    this.id = id;
    if (!id) {
      this.title = "";
      this.description = "";
      this.participants = [];
      this.ownerEmail = "";
      this.questions = [];
    }
  }

  static copy(of: Survey) {
    const survey = new Survey(of.id);
    survey.title = of.title;
    survey.description = of.description;
    survey.participants = of.participants;
    survey.ownerEmail = of.ownerEmail;
    survey.questions = of.questions;
    survey.deletedQuestions = of.deletedQuestions;

    survey.ref = of.ref;
    survey.loaded = of.loaded;

    return survey;
  }

  get copy() {
    return Survey.copy(this);
  }

  async load() {
    if (!this.id) return;
    const surveyRef = doc(db, "surveys", this.id);
    const docSnap = await getDoc(surveyRef);
    if (!docSnap.exists()) throw new Error("No survey found");
    this.ref = surveyRef;
    const data = docSnap.data();
    this.title = data.title;
    this.description = data.description;
    this.participants = data.participants;
    this.ownerEmail = data.ownerEmail;
    await this.loadQuestions();
  }

  async save(form: FormData, byEmail: string) {
    // if (this.id || this.ref) throw new Error("Survey already exists");

    console.log(this);

    const title = form.get("title")?.toString() || "";
    const emails = form.get("emails")?.toString() || "";

    const surveyData: FirestoreSurvey = {
      ownerEmail: byEmail,
      title,
      participants: emails.split(",").map((e) => e.trim()),
      description: "",
    };

    const surveyRef = this.id
      ? doc(db, "surveys", this.id)
      : doc(collection(db, "surveys"));
    await setDoc(surveyRef, surveyData);
    const questionsCollectionRef = collection(surveyRef, "questions");

    if (this.ref) {
      await Promise.all(
        this.deletedQuestions.map(async (deleted) => {
          if (deleted._title) {
            return await deleteDoc(doc(surveyRef, "questions", deleted._title));
          }
        })
      );
    }

    for (const question of this.questions ?? []) {
      const questionRef = doc(questionsCollectionRef, question.title);
      console.log(question.answersToDelete);
      if (this.ref && question.answersToDelete) {
        await Promise.all(
          question.answersToDelete.map(async (deleted: Answer) => {
            if (deleted._title) {
              return await deleteDoc(
                doc(questionRef, "answers", deleted._title)
              );
            }
          })
        );
      }

      const questionData: FirestoreQuestion = {
        description: question.description ?? "",
      };
      try {
        await setDoc(questionRef, questionData);

        const answersCollectionRef = collection(questionRef, "answers");
        for (const answer of question.answers ?? []) {
          const answerRef = doc(answersCollectionRef, answer.title);
          await setDoc(answerRef, { count: 0 });
        }
      } catch (e) {
        console.error("Error adding answer: ", e);
      }
    }

    this.ref = surveyRef;
    this.id = surveyRef.id;
  }

  async loadQuestions() {
    if (!this.ref) throw new Error("No ref found");
    const questionsRef = collection(this.ref, "questions");
    const questionsSnap = await getDocs(questionsRef);
    const questionsLoaders = questionsSnap.docs.map(async (q) => {
      const question = new Question(q);
      await question.load();
      return question;
    });
    this.questions = await Promise.all(questionsLoaders);
  }

  async submit(form: FormData, userEmail: string) {
    if (!this.ref) return;
    const ref = this.ref;
    runTransaction(db, async (transaction) => {
      this.questions?.map(async (question) => {
        const answerId = form.get(question.title!)?.toString();
        if (!answerId || !question.ref) return;
        const answerRef = doc(question.ref, "answers", answerId);
        transaction.update(answerRef, {
          count: increment(1),
        });
      });
      transaction.update(ref, {
        participants: arrayRemove(userEmail),
      });
    });
  }

  addQuestion(question?: Question) {
    if (!question && this.hasVacantQuestion) return;
    this.questions?.push(question ?? new Question());
  }

  addingQuestion(question?: Question) {
    const copy = this.copy;
    copy.addQuestion(question);
    return copy;
  }

  deleteQuestion(question: Question) {
    this.questions = this.questions?.filter((q) => !q.equals(question));
    if (!question.isLocal) {
      this.deletedQuestions.push(question);
    }
  }

  replacingQuestion(question: Question, newQuestion: Question) {
    const oldQuestions =
      this.questions?.filter((q) => !q.equals(question)) ?? [];
    if (oldQuestions.find((q) => q.equals(newQuestion))) return this;
    const copy = this.copy;
    const questionIndex = copy.questions?.findIndex((q) => q.equals(question));

    if (questionIndex) {
      copy.questions?.splice(questionIndex, 1, newQuestion);

      return copy.copy;
    }

    return copy;
  }

  deletingQuestion(question: Question) {
    const copy = this.copy;
    copy.deleteQuestion(question);
    return copy;
  }

  get isLocal() {
    return !this.ref;
  }

  get hasVacantQuestion() {
    return this.questions?.some((question) => question.isNotFilled);
  }
}
