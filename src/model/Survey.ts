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
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import Question, { QuestionType } from "./Question";
import Answer from "./Answer";
import { SurveyStatus } from "./SurveyStatus";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Intersection {
  id?: string;
  label: string;
  questionTitles: string[];
  /**
   * One operator per adjacent pair of questions (length = questionTitles.length - 1).
   * "and" → both answers must be present; key segment = "&&".
   * "or"  → missing answer is allowed (stored as ""); key segment = "||".
   */
  operators: ("and" | "or")[];
  counts?: Record<string, number>;
}

interface AnswerToProcess {
  question: Question;
  answerId: string;
  numericValue?: number;
  needsCreation: boolean;
}

// ---------------------------------------------------------------------------
// Module-level helpers
// ---------------------------------------------------------------------------

/** Cartesian product of string arrays. */
function cartesianProduct(sets: string[][]): string[][] {
  return sets.reduce<string[][]>(
    (acc, set) => acc.flatMap((combo) => set.map((item) => [...combo, item])),
    [[]]
  );
}

/**
 * Strip reserved intersection-key tokens from a free-text answer so it can
 * safely be used as a Firestore document-field name.
 */
function sanitizeKeyPart(s: string): string {
  return s.replace(/&&/g, "").replace(/\|\|/g, "").replace(/\|/g, "").trim();
}

/**
 * Build the combination key for one intersection given the submitted answers.
 * Returns null when an AND constraint is violated (missing required answer).
 */
function buildCombinationKey(
  intersection: Intersection,
  submittedAnswers: Map<string, string>
): string | null {
  const values = intersection.questionTitles.map(
    (qt) => sanitizeKeyPart(submittedAnswers.get(qt) ?? "")
  );

  // Validate AND constraints
  for (let i = 0; i < intersection.operators.length; i++) {
    if (
      intersection.operators[i] === "and" &&
      (values[i] === "" || values[i + 1] === "")
    ) {
      return null;
    }
  }

  // At least one non-empty answer required
  if (values.every((v) => v === "")) return null;

  let key = values[0];
  for (let i = 1; i < values.length; i++) {
    const sep = intersection.operators[i - 1] === "or" ? "||" : "&&";
    key += sep + values[i];
  }
  return key;
}

// ---------------------------------------------------------------------------
// Survey class
// ---------------------------------------------------------------------------

export default class Survey implements Loadable {
  static fireCollection = "surveys";

  id?: string;
  title?: string;
  description?: string;
  participants?: string[];
  ownerEmail?: string;

  questions?: Question[];
  deletedQuestions: Question[] = [];
  intersections: Intersection[] = [];

  totalParticipants?: number;
  responseCount?: number;
  publishedAt?: Date;

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
      this.intersections = [];
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
    survey.intersections = of.intersections ?? [];
    survey.totalParticipants = of.totalParticipants;
    survey.responseCount = of.responseCount;
    survey.publishedAt = of.publishedAt;
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
    this.totalParticipants = data.totalParticipants;
    this.responseCount = data.responseCount;
    this.publishedAt = data.publishedAt?.toDate();
    await this.loadQuestions();

    try {
      this.participants = await this.participantsList();
    } catch {
      this.participants = [];
    }

    try {
      const intersectionsRef = collection(surveyRef, "intersections");
      const intersectionsSnap = await getDocs(intersectionsRef);
      this.intersections = intersectionsSnap.docs.map((d) => {
        const counts: Record<string, number> = {};
        for (const [key, val] of Object.entries(d.data())) {
          if (
            !["label", "questionTitles", "operators", "operator"].includes(
              key
            ) &&
            typeof val === "number"
          ) {
            counts[key] = val;
          }
        }
        return {
          id: d.id,
          label: d.data().label ?? "",
          questionTitles: d.data().questionTitles ?? [],
          operators: d.data().operators ?? [],
          counts,
        };
      });
    } catch {
      this.intersections = [];
    }

    this.loaded = true;
  }

  async participantsList() {
    if (!this.ref) return [];
    const participantsRef = collection(this.ref, "participants");
    const participantsSnap = await getDocs(participantsRef);
    return participantsSnap.docs.map((doc) => doc.id);
  }

  /**
   * Publish the survey.
   * - Sets status ACTIVE, records timestamps and participant count.
   * - Pre-populates all discrete combination keys in each intersection at count 0,
   *   so participants only ever INCREMENT existing docs (no creates needed at submit time).
   *   Intersections containing TEXT or DATE questions are skipped (unbounded answer space).
   */
  async start() {
    const surveyRef = this.ref ?? doc(db, "surveys", this.id!);

    const [participantsSnap, intersectionsSnap, questionsSnap] =
      await Promise.all([
        getDocs(collection(surveyRef, "participants")),
        getDocs(collection(surveyRef, "intersections")),
        getDocs(collection(surveyRef, "questions")),
      ]);

    // Load answers for each question (needed for combination key pre-population)
    const questionsWithAnswers = await Promise.all(
      questionsSnap.docs.map(async (qDoc) => {
        const q = new Question(qDoc);
        await q.load();
        return q;
      })
    );

    const totalParticipants = participantsSnap.size;
    const storedIntersections: Intersection[] = intersectionsSnap.docs.map(
      (d) => ({
        id: d.id,
        label: d.data().label ?? "",
        questionTitles: d.data().questionTitles ?? [],
        operators: d.data().operators ?? [],
      })
    );

    const batch = writeBatch(db);
    let batchWrites = 0;

    batch.update(surveyRef, {
      status: SurveyStatus.ACTIVE,
      publishedAt: serverTimestamp(),
      totalParticipants,
      responseCount: 0,
    });
    batchWrites++;

    for (const intersection of storedIntersections) {
      const interRef = doc(
        collection(surveyRef, "intersections"),
        intersection.id!
      );

      // Confirm intersection metadata
      batch.set(
        interRef,
        {
          label: intersection.label,
          questionTitles: intersection.questionTitles,
          operators: intersection.operators,
        },
        { merge: true }
      );
      batchWrites++;

      // Pre-calculate combination keys for fully-discrete intersections
      const answerSets: string[][] = [];
      let hasUnboundedType = false;

      for (const qt of intersection.questionTitles) {
        const q = questionsWithAnswers.find((q) => q.title === qt);
        if (
          !q ||
          q.type === QuestionType.TEXT ||
          q.type === QuestionType.DATE
        ) {
          hasUnboundedType = true;
          break;
        }
        const answers = q.answers.map((a) => a.title).filter((t) => t.trim());
        if (answers.length === 0) {
          hasUnboundedType = true;
          break;
        }
        answerSets.push(answers);
      }

      if (!hasUnboundedType && answerSets.length >= 2) {
        const combinations = cartesianProduct(answerSets);
        // Guard against exceeding Firestore batch limit (500 ops total)
        if (combinations.length <= 400 - batchWrites) {
          for (const combo of combinations) {
            let key = combo[0];
            for (let i = 1; i < combo.length; i++) {
              const sep =
                (intersection.operators[i - 1] ?? "and") === "or"
                  ? "||"
                  : "&&";
              key += sep + combo[i];
            }
            batch.set(interRef, { [key]: 0 }, { merge: true });
            batchWrites++;
          }
        }
      }
    }

    await batch.commit();
    this.ref = surveyRef;
    this.totalParticipants = totalParticipants;
  }

  /**
   * Close the survey:
   * 1. Set answer counts 1–2 to -1 (privacy: fewer than 3 responses hidden).
   * 2. Same for intersection combination counts.
   * 3. Delete all participants from both subcollections.
   * 4. Mark survey CLOSED.
   */
  async finish() {
    if (!this.ref) throw new Error("No ref found");

    const batch = writeBatch(db);

    for (const question of this.questions ?? []) {
      if (!question.ref) continue;
      const answersSnap = await getDocs(collection(question.ref, "answers"));
      for (const answerDoc of answersSnap.docs) {
        const count = answerDoc.data().count as number;
        if (count > 0 && count < 3) {
          batch.update(answerDoc.ref, { count: -1 });
        }
      }
    }

    const intersectionsSnap = await getDocs(
      collection(this.ref, "intersections")
    );
    for (const interDoc of intersectionsSnap.docs) {
      const data = interDoc.data();
      const updates: Record<string, number> = {};
      for (const [key, val] of Object.entries(data)) {
        if (
          ["label", "questionTitles", "operators", "operator"].includes(key)
        )
          continue;
        if (typeof val === "number" && val > 0 && val < 3) {
          updates[key] = -1;
        }
      }
      if (Object.keys(updates).length > 0) {
        batch.update(interDoc.ref, updates);
      }
    }

    const participantsSnap = await getDocs(
      collection(this.ref, "participants")
    );
    for (const participantDoc of participantsSnap.docs) {
      batch.delete(participantDoc.ref);
      batch.delete(
        doc(db, "participants", participantDoc.id, "surveys", this.id!)
      );
    }

    batch.update(this.ref, {
      status: SurveyStatus.CLOSED,
      totalParticipantsAtClose:
        this.totalParticipants ?? participantsSnap.size,
    });

    await batch.commit();
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

  async addParticipants(emails: string[]) {
    if (!this.ref) throw new Error("No ref found");
    const participantsCollectionRef = collection(this.ref, "participants");
    const participantsCollection = collection(db, "participants");

    await runTransaction(db, async (transaction) => {
      for (const email of emails) {
        const participantRef = doc(participantsCollectionRef, email);
        const existing = await transaction.get(participantRef);
        if (existing.exists() && existing.data().status) continue;
        transaction.set(participantRef, { status: "added" });
        transaction.set(
          doc(
            collection(doc(participantsCollection, email), "surveys"),
            this.id!
          ),
          {}
        );
      }
    });

    if (!this.participants) this.participants = [];
    for (const email of emails) {
      if (!this.participants.includes(email)) this.participants.push(email);
    }

    const newCount = (this.totalParticipants ?? 0) + emails.length;
    await updateDoc(this.ref, { totalParticipants: newCount });
    this.totalParticipants = newCount;
  }

  async save(form: FormData) {
    const title = form.get("title")?.toString() || "";
    const emails = form.get("emails")?.toString() || "";

    this.title = title;
    this.participants = emails
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean);

    try {
      const surveyRef = this.id
        ? doc(db, "surveys", this.id)
        : doc(collection(db, "surveys"));
      await setDoc(surveyRef, this.firestore.data);

      const questionsCollectionRef = collection(surveyRef, "questions");
      const participants = await this.participantsList();

      const intersectionsRef = collection(surveyRef, "intersections");
      const existingIntersectionsSnap = await getDocs(intersectionsRef);
      const existingIntersectionIds = new Set(
        existingIntersectionsSnap.docs.map((d) => d.id)
      );
      const newIntersectionIds = new Set(
        this.intersections.filter((i) => i.id).map((i) => i.id!)
      );

      await runTransaction(db, async (transaction) => {
        try {
          // --- Participants ---
          const toAdd = this.difference(this.participants ?? [], participants);
          const toDelete = this.difference(
            participants,
            this.participants ?? []
          );
          const participantsCollectionRef = collection(
            surveyRef,
            "participants"
          );
          const participantAdders = toAdd.map((p) =>
            transaction.get(doc(participantsCollectionRef, p))
          );
          const resolved = (await Promise.allSettled(participantAdders)).filter(
            (r) => r.status === "fulfilled"
          );
          const participantsCollection = collection(db, "participants");
          for (const participant of toAdd) {
            const participantRef = doc(participantsCollectionRef, participant);
            try {
              const existing = resolved.find((r) => r.value.id)?.value;
              if (existing && existing.exists() && existing.data().status)
                continue;
              transaction.set(participantRef, { status: "added" });
              transaction.set(
                doc(
                  collection(
                    doc(participantsCollection, participant),
                    "surveys"
                  ),
                  surveyRef.id
                ),
                {}
              );
            } catch (error) {
              console.log(error);
            }
          }
          for (const participant of toDelete) {
            transaction.update(
              doc(participantsCollectionRef, participant),
              { status: "removed" }
            );
            transaction.delete(
              doc(
                collection(
                  doc(participantsCollection, participant),
                  "surveys"
                ),
                surveyRef.id
              )
            );
          }

          // --- Deleted questions ---
          if (this.ref) {
            for (const deleted of this.deletedQuestions) {
              if (deleted._title) {
                transaction.delete(
                  doc(surveyRef, "questions", deleted._title)
                );
              }
            }
          }

          // --- Questions & answers ---
          for (const question of this.questions ?? []) {
            const isRenamed =
              question._title && question._title !== question.title;
            const questionRef = doc(
              questionsCollectionRef,
              isRenamed ? question._title! : question.title!
            );

            if (isRenamed) {
              transaction.delete(questionRef);
              const newRef = doc(questionsCollectionRef, question.title!);
              transaction.set(newRef, question.firestore.data);
              const answersRef = collection(newRef, "answers");
              for (const answer of question.answers ?? []) {
                transaction.set(doc(answersRef, answer.title), {
                  ...answer.firestore.data,
                  count: 0,
                });
              }
            } else {
              const answersRef = collection(questionRef, "answers");
              if (this.ref && question.answersToDelete) {
                for (const deleted of new Set(question.answersToDelete)) {
                  if (deleted._title) {
                    transaction.delete(doc(answersRef, deleted._title));
                  }
                }
              }
              transaction.set(questionRef, question.firestore.data);
              for (const answer of question.answers ?? []) {
                const hasChanged =
                  answer._title && answer._title !== answer.title;
                const answerRef = doc(
                  answersRef,
                  hasChanged ? answer._title! : answer.title
                );
                if (hasChanged) {
                  transaction.delete(answerRef);
                  transaction.set(doc(answersRef, answer.title), {
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
              if (question.isNumeric && question.hasNumericLimits) {
                for (
                  let i = question.numericMin!;
                  i <= question.numericMax!;
                  i++
                ) {
                  transaction.set(doc(answersRef, i.toString()), {
                    count: 0,
                    orderIndex: i - question.numericMin!,
                    numericValue: i,
                  });
                }
              }
            }
          }

          // --- Intersections ---
          for (const idToDelete of existingIntersectionIds) {
            if (!newIntersectionIds.has(idToDelete)) {
              transaction.delete(doc(intersectionsRef, idToDelete));
            }
          }
          for (const intersection of this.intersections) {
            const interRef = intersection.id
              ? doc(intersectionsRef, intersection.id)
              : doc(intersectionsRef);
            transaction.set(interRef, {
              label: intersection.label,
              questionTitles: intersection.questionTitles,
              operators: intersection.operators,
            });
            if (!intersection.id) intersection.id = interRef.id;
          }
        } catch (e) {
          console.error("Error in save transaction: ", e);
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

    const answersToProcess: AnswerToProcess[] = [];
    const multiAnswers: { question: Question; answerIds: string[] }[] = [];
    const submittedAnswers = new Map<string, string>();

    for (const question of this.questions ?? []) {
      if (!question.ref) continue;

      if (question.type === QuestionType.MULTI_CHOICE) {
        const selected = (form.getAll(question.title!) as string[]).filter(
          Boolean
        );
        if (selected.length > 0)
          multiAnswers.push({ question, answerIds: selected });
      } else if (question.type === QuestionType.TEXT) {
        const raw = form.get(question.title!)?.toString();
        if (!raw) continue;
        // Normalise and strip intersection-key tokens
        const answerId = sanitizeKeyPart(question.normalizeAnswer(raw));
        if (!answerId) continue;
        submittedAnswers.set(question.title!, answerId);
        answersToProcess.push({ question, answerId, needsCreation: true });
      } else if (question.type === QuestionType.DATE) {
        const answerId = form.get(question.title!)?.toString();
        if (!answerId) continue;
        submittedAnswers.set(question.title!, answerId);
        answersToProcess.push({ question, answerId, needsCreation: true });
      } else if (question.isNumeric) {
        const answerId = form.get(question.title!)?.toString();
        if (!answerId) continue;
        const numericValue = Number(answerId);
        if (isNaN(numericValue)) continue;
        if (
          question.numericMin !== undefined &&
          numericValue < question.numericMin
        )
          continue;
        if (
          question.numericMax !== undefined &&
          numericValue > question.numericMax
        )
          continue;
        const existingAnswer = question.answers.find(
          (a) => a.numericValue === numericValue
        );
        submittedAnswers.set(question.title!, answerId);
        answersToProcess.push({
          question,
          answerId,
          numericValue,
          needsCreation: !existingAnswer,
        });
      } else {
        // SINGLE_CHOICE and CHECKBOX
        const answerId = form.get(question.title!)?.toString();
        if (!answerId) continue;
        const existingAnswer = question.answers.find(
          (a) => a.title === answerId
        );
        submittedAnswers.set(question.title!, answerId);
        answersToProcess.push({
          question,
          answerId,
          needsCreation: !existingAnswer,
        });
      }
    }

    await runTransaction(db, async (transaction) => {
      for (const {
        question,
        answerId,
        numericValue,
        needsCreation,
      } of answersToProcess) {
        if (!question.ref) continue;
        const answersRef = collection(question.ref, "answers");
        const answerRef = doc(answersRef, answerId);
        if (needsCreation) {
          const answerDoc = await transaction.get(answerRef);
          if (answerDoc.exists()) {
            transaction.update(answerRef, { count: increment(1) });
          } else {
            transaction.set(answerRef, {
              count: 1,
              orderIndex: question.answers.length,
              ...(numericValue !== undefined && { numericValue }),
            });
          }
        } else {
          transaction.update(answerRef, { count: increment(1) });
        }
      }

      for (const { question, answerIds } of multiAnswers) {
        if (!question.ref) continue;
        for (const answerId of answerIds) {
          const answersRef = collection(question.ref, "answers");
          const answerRef = doc(answersRef, answerId);
          const existing = question.answers.find((a) => a.title === answerId);
          if (!existing) {
            const answerDoc = await transaction.get(answerRef);
            if (answerDoc.exists()) {
              transaction.update(answerRef, { count: increment(1) });
            } else {
              transaction.set(answerRef, {
                count: 1,
                orderIndex: question.answers.length,
              });
            }
          } else {
            transaction.update(answerRef, { count: increment(1) });
          }
        }
      }

      // Intersection combination counts
      for (const intersection of this.intersections ?? []) {
        if (!intersection.id || intersection.questionTitles.length < 2)
          continue;
        const combinationKey = buildCombinationKey(
          intersection,
          submittedAnswers
        );
        if (!combinationKey) continue;
        transaction.set(
          doc(collection(this.ref!, "intersections"), intersection.id),
          { [combinationKey]: increment(1) },
          { merge: true }
        );
      }

      // Remove participant from participants/{email}/surveys/{id}
      transaction.delete(doc(db, "participants", userEmail, "surveys", id!));

      // Remove participant from surveys/{id}/participants/{email}
      transaction.delete(
        doc(collection(this.ref!, "participants"), userEmail)
      );

      transaction.update(this.ref!, { responseCount: increment(1) });
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
    // Remove question from each intersection and trim the matching operator
    copy.intersections = copy.intersections.map((intersection) => {
      const removeIdx = intersection.questionTitles.indexOf(
        question.title ?? ""
      );
      if (removeIdx === -1) return intersection;

      const newTitles = intersection.questionTitles.filter(
        (t) => t !== question.title
      );
      const newOps = [...intersection.operators];
      // Remove the operator to the left (or right for the first element)
      const opIdx = Math.min(removeIdx, newOps.length - 1);
      if (newOps.length > 0) newOps.splice(opIdx, 1);

      return { ...intersection, questionTitles: newTitles, operators: newOps };
    });
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

  static createCopy(of: Survey, ownerEmail: string): Survey {
    const newSurvey = new Survey(undefined, ownerEmail);
    newSurvey.title = (of.title ?? "") + " (copy)";
    newSurvey.description = of.description;
    newSurvey.questions =
      of.questions?.map((q) => {
        const newQ = new Question();
        newQ.title = q.title;
        newQ._title = undefined;
        newQ.description = q.description;
        newQ.type = q.type;
        newQ.numericPrefix = q.numericPrefix;
        newQ.numericSuffix = q.numericSuffix;
        newQ.numericMin = q.numericMin;
        newQ.numericMax = q.numericMax;
        newQ.dateVariant = q.dateVariant;
        newQ.dateMin = q.dateMin;
        newQ.dateMax = q.dateMax;
        newQ.dateFutureOnly = q.dateFutureOnly;
        newQ.datePastOnly = q.datePastOnly;
        newQ.textCaseSensitive = q.textCaseSensitive;
        newQ.textMinLength = q.textMinLength;
        newQ.textMaxLength = q.textMaxLength;
        newQ.orderIndex = q.orderIndex;
        newQ.answers = q.answers.map((a) => {
          const newA = new Answer();
          newA.title = a.title;
          newA._title = a.title;
          newA.count = 0;
          newA.orderIndex = a.orderIndex;
          return newA;
        });
        return newQ;
      }) ?? [new Question()];
    newSurvey.intersections =
      of.intersections?.map((i) => ({
        label: i.label,
        questionTitles: [...i.questionTitles],
        operators: [...(i.operators ?? [])],
      })) ?? [];
    newSurvey.participants = [];
    return newSurvey;
  }
}
