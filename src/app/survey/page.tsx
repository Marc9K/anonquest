"use client";

import { useAuthState } from "react-firebase-hooks/auth";

import { addDoc, collection, deleteDoc, doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useEffect, useRef, useState } from "react";
import { Button, Fieldset } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import CreateQuestionCard from "./CreateQuestionCard";
import {
  FirestoreAnswer,
  FirestoreQuestion,
  FirestoreSurvey,
} from "@/interfaces/firestore";
import FieldInput from "@/components/FieldInput";
import FieldTextArea from "@/components/FieldTextArea";

export default function CreateSurvey({
  existing,
}: {
  existing?: { survey: FirestoreSurvey; id: string };
}) {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [questions, setQuestions] = useState<FirestoreQuestion[]>(
    existing?.survey.questions?.map((question) => ({
      ...question,
      origTitle: question.title,
    })) ?? []
  );
  const [deletedQuestions, setDeletedQuestion] = useState<FirestoreQuestion[]>(
    []
  );

  const get = (name: string) => {
    if (!formRef.current) return "";
    const formData = new FormData(formRef.current);
    return formData.get(name)?.toString() || "";
  };

  const createSurvey = async () => {
    if (!user || !user.email) return;
    const title = get("title");
    const emails = get("emails");

    const surveyData: FirestoreSurvey = {
      ownerEmail: user.email,
      title,
      participants: emails.split(",").map((e) => e.trim()),
      description: "",
    };

    const surveyRef = existing?.id
      ? doc(db, "surveys", existing.id)
      : doc(collection(db, "surveys"));
    await setDoc(surveyRef, surveyData);
    const questionsCollectionRef = collection(surveyRef, "questions");

    if (existing) {
      await Promise.all(
        deletedQuestions.map(async (deleted) => {
          if (deleted.origTitle) {
            return deleteDoc(doc(surveyRef, "questions", deleted.origTitle));
          }
        })
      );
    }

    for (const question of questions) {
      const questionRef = doc(questionsCollectionRef, question.title);
      if (existing && question.deletedAnswers) {
        await Promise.all(
          question.deletedAnswers.map((deleted: FirestoreAnswer) => {
            return deleteDoc(doc(questionRef, "answers", deleted.origTitle));
          })
        );
      }

      const questionData: FirestoreQuestion = {
        description: question.description,
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
  };

  return (
    <>
      <form
        ref={formRef}
        onSubmit={async (e) => {
          e.preventDefault();
          await createSurvey();
          router.push("/account");
        }}
      >
        <Fieldset.Root size="lg" maxW="md">
          <Fieldset.Legend>New survey</Fieldset.Legend>

          <Fieldset.Content>
            <FieldInput
              label="Title"
              initialValue={existing?.survey.title ?? get("title")}
              name="title"
              required
            />

            <FieldTextArea
              placeholder="e1@mail.co, e2@mail.co, ..."
              name="emails"
              initialValue={
                existing?.survey.participants.join(", ") ?? get("emails")
              }
              label="Participants' emails"
              helper="Please provide comma separated emails"
            />
            {questions.map((question) => (
              <CreateQuestionCard
                key={question.title}
                question={question}
                setQuestion={(newQuestion) => {
                  const oldQuestions = questions.filter(
                    (q) => q.title !== question.title
                  );
                  if (!newQuestion) {
                    setDeletedQuestion((prev) => [...prev, question]);
                    setQuestions((prev) =>
                      prev.filter((q) => q.title !== question.title)
                    );
                    return;
                  }
                  if (oldQuestions.find((q) => q.title === newQuestion?.title))
                    throw new Error("Question with that title already exists");
                  const questionIndex = questions.findIndex(
                    (q) => q.title === question.title
                  );
                  console.log(newQuestion);
                  oldQuestions.splice(questionIndex, 1, newQuestion);
                  setQuestions(oldQuestions);
                }}
              />
            ))}
            <Button
              alignSelf="flex-start"
              onClick={() =>
                setQuestions((prev) => {
                  const question: FirestoreQuestion = {
                    title: "",
                    description: "",
                    answers: [],
                  };

                  return [...prev, question];
                })
              }
              disabled={
                !!questions.find(
                  (question) => question.title.trim().length === 0
                )
              }
            >
              + Add a question
            </Button>
          </Fieldset.Content>

          <Button type="submit" alignSelf="flex-start">
            Create Survey
          </Button>
        </Fieldset.Root>
      </form>
    </>
  );
}
