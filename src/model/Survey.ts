import { db } from "../app/firebase";
import { type Loadable } from "@/interfaces/firestore";
import {
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
  updateDoc,
} from "firebase/firestore";
import Question from "./Question";
import { SurveyStatus } from "./SurveyStatus";

export default class Survey implements Loadable {
  static fireCollection = "surveys";

  id?: string;
  title?: string;
  description?: string;
  participants?: string[];
  ownerEmail?: string;

  questions?: Question[];
  deletedQuestions: Question[] = [];

  status: SurveyStatus = SurveyStatus.PENDING;

  ref?: DocumentReference<DocumentData, DocumentData>;
  loaded = false;

  constructor(id?: string, ownerEmail?: string | null) {
    this.id = id;
    if (!id) {
      this.title = "";
      this.description = "";
      this.participants = [];
      this.ownerEmail = ownerEmail ?? "";
      this.questions = [new Question()];
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

  get firestore() {
    return {
      id: this.id,
      collections: {
        participants: this.participants?.map((participant) => ({
          id: participant,
        })),
        questions: this.questions?.map((question) => question.firestore),
      },
      data: {
        ownerEmail: this.ownerEmail,
        title: this.title,
        description: "",
        status: this.status,
      },
    };
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
    this.ownerEmail = data.ownerEmail;
    this.status = data.status;
    await this.loadQuestions();

    try {
      this.participants = await this.participantsList();
    } catch {
      this.participants = [];
    }
  }

  async participantsList() {
    if (!this.ref) return [];
    const participantsRef = collection(this.ref, "participants");
    const participantsSnap = await getDocs(participantsRef);
    return participantsSnap.docs.map((doc) => doc.id);
  }

  async start() {
    if (!this.ref) throw new Error("No ref found");
    if (!this.questions?.length) throw new Error("No questions found");
    this.questions.forEach((question) =>
      question.answers.forEach((answer) => {
        answer.count = 0;
      })
    );
    await updateDoc(this.ref, { status: SurveyStatus.ACTIVE });
  }

  async finish() {
    if (!this.ref) throw new Error("No ref found");
    await updateDoc(this.ref, {
      status: SurveyStatus.CLOSED,
      participants: [],
    });
  }

  async delete() {
    if (!this.ref) throw new Error("No ref found");
    await deleteDoc(this.ref);
  }

  difference = (a: string[], b: string[]) => {
    const setA = new Set(a);
    const setB = new Set(b);
    return [...setA].filter((x) => !setB.has(x));
  };

  async save(form: FormData) {
    const title = form.get("title")?.toString() || "";
    const emails = form.get("emails")?.toString() || "";

    this.title = title;
    this.participants = emails.split(",").map((email) => email.trim());

    try {
      const surveyRef = this.id
        ? doc(db, "surveys", this.id)
        : doc(collection(db, "surveys"));
      await setDoc(surveyRef, this.firestore.data);

      const questionsCollectionRef = collection(surveyRef, "questions");

      const participants = await this.participantsList();

      await runTransaction(db, async (transaction) => {
        try {
          const toAdd = this.difference(this.participants ?? [], participants);
          const toDelete = this.difference(
            participants,
            this.participants ?? []
          );

          const participantsCollectionRef = collection(
            surveyRef,
            "participants"
          );

          const participantAdders = toAdd.map((participant) =>
            transaction.get(doc(participantsCollectionRef, participant))
          );
          const potentialExistingParticipants = (
            await Promise.allSettled(participantAdders)
          ).filter((potential) => potential.status == "fulfilled");

          const participantsCollection = collection(db, "participants");
          for (const participant of toAdd) {
            const participantRef = doc(participantsCollectionRef, participant);
            try {
              const existingParticipant = potentialExistingParticipants.find(
                (existing) => existing.value.id
              )?.value;
              if (
                existingParticipant &&
                existingParticipant.exists() &&
                existingParticipant.data().status
              )
                continue;
              transaction.set(participantRef, { status: "added" });
              //
              const participantDocRef = doc(
                participantsCollection,
                participant
              );
              const surveysSubcollectionRef = collection(
                participantDocRef,
                "surveys"
              );
              const surveyDocRef = doc(surveysSubcollectionRef, surveyRef.id);
              transaction.set(surveyDocRef, {});
            } catch (error) {
              console.log(error);
            }
          }
          for (const participant of toDelete) {
            const participantRef = doc(participantsCollectionRef, participant);
            transaction.update(participantRef, { status: "removed" });
            //
            const participantDocRef = doc(participantsCollection, participant);
            const surveysSubcollectionRef = collection(
              participantDocRef,
              "surveys"
            );
            const surveyDocRef = doc(surveysSubcollectionRef, surveyRef.id);
            transaction.delete(surveyDocRef);
          }
          if (this.ref) {
            for (const deleted of this.deletedQuestions) {
              if (deleted._title) {
                transaction.delete(doc(surveyRef, "questions", deleted._title));
              }
            }
          }
          for (const question of this.questions ?? []) {
            const questionRef = doc(
              questionsCollectionRef,
              question._title && question._title !== question.title
                ? question._title
                : question.title
            );

            if (question._title && question._title !== question.title) {
              transaction.delete(questionRef);
              const newQuestionRef = doc(
                questionsCollectionRef,
                question.title
              );
              transaction.set(newQuestionRef, question.firestore.data);

              const answersCollectionRef = collection(
                newQuestionRef,
                "answers"
              );
              for (const answer of question.answers ?? []) {
                const answerRef = doc(answersCollectionRef, answer.title);
                transaction.set(answerRef, {
                  ...answer.firestore.data,
                  count: 0,
                });
              }
            } else {
              const answersCollectionRef = collection(questionRef, "answers");

              if (this.ref && question.answersToDelete) {
                for (const deleted of new Set(question.answersToDelete)) {
                  if (deleted._title) {
                    transaction.delete(
                      doc(answersCollectionRef, deleted._title)
                    );
                  }
                }
              }
              transaction.set(questionRef, question.firestore.data);

              for (const answer of question.answers ?? []) {
                const hasChanged =
                  answer._title && answer._title !== answer.title;
                const answerRef = doc(
                  answersCollectionRef,
                  hasChanged ? answer._title : answer.title
                );

                if (hasChanged) {
                  transaction.delete(answerRef);
                  const newAnswerRef = doc(answersCollectionRef, answer.title);
                  transaction.set(newAnswerRef, {
                    ...answer.firestore.data,
                    count: 0,
                  });
                } else {
                  transaction.set(answerRef, {
                    ...answer.firestore.data,
                    count: 0,
                  });
                }
              }
            }
          }
        } catch (e) {
          console.error("Error adding answer: ", e);
        }

        this.ref = surveyRef;
        this.id = surveyRef.id;
      });
    } catch (error) {
      console.log(error);
    }
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
    this.questions = (await Promise.all(questionsLoaders)).toSorted(
      (a, b) => a.orderIndex - b.orderIndex
    );
  }

  async submit(form: FormData, userEmail: string) {
    if (!this.ref) return;
    const id = this.id;
    await runTransaction(db, async (transaction) => {
      this.questions?.map(async (question) => {
        const answerId = form.get(question.title!)?.toString();
        if (!answerId || !question.ref) return;
        const answerRef = doc(question.ref, "answers", answerId);
        transaction.update(answerRef, {
          count: increment(1),
        });
      });
      const participantsCollection = collection(db, "participants");
      doc(db, "participants", userEmail);
      const participantDocRef = doc(participantsCollection, userEmail);
      const surveysSubcollectionRef = collection(participantDocRef, "surveys");
      const surveyDocRef = doc(surveysSubcollectionRef, id);
      transaction.delete(surveyDocRef);
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
    // if (this.questions?.length === 0) {
    //   this.questions = [new Question()];
    // }
  }

  replacingQuestion(question: Question, newQuestion: Question) {
    const copy = this.copy;
    const questionIndex = copy.questions?.findIndex((q) => q.equals(question));
    if (questionIndex !== undefined && questionIndex !== -1) {
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

  async setActive() {
    if (!this.ref) throw new Error("No ref found");
    await Survey.setActive(this.ref);
  }

  static async setActive(ref: DocumentReference<DocumentData, DocumentData>) {
    await updateDoc(ref, { status: SurveyStatus.ACTIVE });
  }
  static async setAs(
    ref: DocumentReference<DocumentData, DocumentData>,
    status: SurveyStatus
  ) {
    await updateDoc(ref, { status });
  }
}
