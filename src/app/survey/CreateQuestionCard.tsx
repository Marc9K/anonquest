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
import Question from "@/model/Question";
import Answer from "@/model/Answer";

export default function CreateQuestionCard({
  question,
  setQuestion,
}: {
  question: Question;
  setQuestion: (question: Question | null) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef(null);
  const [questionState, setQuestionState] = useState(question);

  return (
    <Card.Root
      size="lg"
      onBlur={() => {
        const formData = new FormData(formRef.current);

        questionState.title = formData.get("title")?.toString() || "";
        questionState.description =
          formData.get("description")?.toString() || "";

        setQuestion(questionState);
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
                {questionState.answers?.map((answer) => (
                  <AnswerCard
                    ref={answer.title.length === 0 ? inputRef : undefined}
                    key={answer.title}
                    option={answer}
                    setOption={(option) => {
                      if (!option) {
                        setQuestionState((prev) => prev.deleting(answer));
                        return;
                      }

                      setQuestionState((prev) =>
                        prev.replacing(answer, option)
                      );
                    }}
                  />
                ))}
              </Stack>
            </Card.Body>
            <Card.Footer>
              <Button
                alignSelf="flex-start"
                onClick={() => {
                  setQuestionState((prev) => prev.addingOption());
                  // setTimeout(() => {
                  //   inputRef.current?.focus();
                  // }, 100);
                }}
                disabled={question.hasVacantOption}
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
