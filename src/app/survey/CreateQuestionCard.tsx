"use client";

import { FirestoreAnswer, FirestoreQuestion } from "@/interfaces/firestore";
import {
  Button,
  Card,
  Field,
  Fieldset,
  Group,
  Input,
  Stack,
  Textarea,
  Wrap,
} from "@chakra-ui/react";
import { useRef, useState } from "react";
import AnswerCard from "./AnswerCard";
import FieldInput from "@/components/FieldInput";
import FieldTextArea from "@/components/FieldTextArea";

export default function CreateQuestionCard({
  question,
  setQuestion,
}: {
  question: FirestoreQuestion;
  setQuestion: (question: FirestoreQuestion | null) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [answers, setAnswers] = useState(question.answers);
  const inputRef = useRef(null);
  return (
    <Card.Root
      size="lg"
      onBlur={() => {
        const formData = new FormData(formRef.current);
        const title = formData.get("title")?.toString() || "";
        const description = formData.get("description")?.toString() || "";
        setQuestion({ title, description, answers });
      }}
    >
      <form ref={formRef}>
        <Fieldset.Root size="lg" maxW="md">
          <Card.Header>
            <Fieldset.Legend>Select an option</Fieldset.Legend>
          </Card.Header>
          <Fieldset.Content>
            <Card.Body>
              <Card.Title>
                <FieldInput
                  label="Question"
                  name="title"
                  initialValue={question.title}
                  required
                />
              </Card.Title>
              <Card.Description>
                <FieldTextArea
                  label="Description"
                  name="description"
                  initialValue={question.description}
                />
              </Card.Description>
              <Field.Root required>
                <Field.Label>Answer options</Field.Label>
              </Field.Root>
              <Stack>
                {answers.map((answer) => (
                  <AnswerCard
                    ref={answer.title.length === 0 ? inputRef : undefined}
                    key={answer.title}
                    option={answer}
                    setOption={(option) => {
                      if (
                        answers.find((answer) => answer.title === option?.title)
                      )
                        throw new Error("This option already exists");
                      const oldAnswers = answers.filter(
                        (prev) => prev.title !== answer.title
                      );
                      if (option) {
                        oldAnswers.push(option);
                      }
                      console.log(oldAnswers);
                      setAnswers(oldAnswers);
                    }}
                  />
                ))}
              </Stack>
            </Card.Body>
            <Card.Footer>
              <Button
                alignSelf="flex-start"
                onClick={() => {
                  const answer: FirestoreAnswer = {
                    title: "",
                    count: 0,
                  };
                  setAnswers((prev) => [...prev, answer]);
                  setTimeout(() => {
                    inputRef.current?.focus();
                  }, 100);
                }}
                disabled={
                  !!answers.find((answer) => answer.title.trim().length === 0)
                }
              >
                + Add an option
              </Button>
              <Button
                alignSelf="flex-start"
                onClick={() => {
                  setQuestion(null);
                }}
              >
                Delete question
              </Button>
            </Card.Footer>
          </Fieldset.Content>
        </Fieldset.Root>
      </form>
    </Card.Root>
  );
}
