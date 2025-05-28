"use client";

import { useAuthState } from "react-firebase-hooks/auth";

import { addDoc, collection, doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useRef, useState } from "react";
import {
  Button,
  Field,
  Fieldset,
  Group,
  Icon,
  Input,
  Stack,
  Textarea,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { TbCsv } from "react-icons/tb";
import CreateQuestionCard from "./CreateQuestionCard";
import { FirestoreQuestion, FirestoreSurvey } from "@/interfaces/firestore";
import FieldInput from "@/components/FieldInput";

export default function CreateSurvey() {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [questions, setQuestions] = useState<FirestoreQuestion[]>([]);
  console.log(questions);

  const get = (name: string) => {
    if (!formRef || !formRef.current) return "";
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

    const surveyRef = doc(collection(db, "surveys"));
    await setDoc(surveyRef, surveyData);
    const questionsCollectionRef = collection(surveyRef, "questions");

    for (const question of questions) {
      const questionRef = doc(questionsCollectionRef, question.title);

      const questionData: FirestoreQuestion = {
        description: question.description,
      };
      try {
        await setDoc(questionRef, questionData);

        const answersCollectionRef = collection(questionRef, "answers");
        for (const answer of question.answers ?? []) {
          console.log(answer);
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
              initialValue={get("title")}
              name="title"
              required
            />

            <Field.Root>
              <Field.Label>Participants' emails</Field.Label>
              <Group attached>
                <Textarea
                  name="emails"
                  placeholder="e1@mail.co, e2@mail.co, ..."
                />
                <Button bg="bg.subtle" variant="outline">
                  Upload
                  <Icon>
                    <TbCsv />
                  </Icon>
                </Button>
              </Group>
              <Field.HelperText>
                Please provide comma separated emails
              </Field.HelperText>
            </Field.Root>
            {questions.map((question) => (
              <CreateQuestionCard
                key={question.title}
                question={question}
                setQuestion={(newQuestion) => {
                  const oldQuestions = questions.filter(
                    (q) => q.title !== question.title
                  );
                  if (oldQuestions.find((q) => q.title === newQuestion?.title))
                    throw new Error("Question with that title already exists");
                  if (newQuestion) {
                    console.log(newQuestion);
                    oldQuestions.push(newQuestion);
                  }
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
