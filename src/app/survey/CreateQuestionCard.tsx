"use client";

import { Button, Card, Field, Fieldset, Stack } from "@chakra-ui/react";
import { useRef, useState } from "react";
import AnswerCard from "./AnswerCard";
import FieldInput from "@/components/FieldInput";
import FieldTextArea from "@/components/FieldTextArea";
import Question from "@/model/Question";

export default function CreateQuestionCard({
  question,
  setQuestion,
  index,
}: {
  question: Question;
  setQuestion: (question: Question | null) => void;
  index: number;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [questionState, setQuestionState] = useState(question);

  return (
    <Card.Root
      size="lg"
      onBlur={() => {
        if (!formRef.current) return;
        const formData = new FormData(formRef.current);

        questionState.title = formData.get("title")?.toString() || "";
        questionState.description =
          formData.get("description")?.toString() || "";

        setQuestion(questionState);
      }}
    >
      <form ref={formRef} data-testid={`${index}-question-card`}>
        <Fieldset.Root size="lg" maxW="md">
          <Card.Header>
            <Fieldset.Legend>Select an option</Fieldset.Legend>
          </Card.Header>
          <Fieldset.Content>
            <Card.Body>
              <Card.Title>
                <FieldInput
                  data-testid={`question-title`}
                  label="Question"
                  name="title"
                  initialValue={question.title}
                  required
                />
              </Card.Title>
              <Card.Description>
                <FieldTextArea
                  data-testid={`question-description`}
                  label="Description"
                  name="description"
                  initialValue={question.description}
                />
              </Card.Description>
              <Field.Root required>
                <Field.Label>Answer options</Field.Label>
              </Field.Root>
              <Stack>
                {questionState.answers?.map((answer, index) => (
                  <AnswerCard
                    data-testid={`question-answer-option`}
                    // ref={answer.title.length === 0 ? inputRef : undefined}
                    key={answer.title}
                    option={answer}
                    setOption={(option) => {
                      if (!option) {
                        setQuestionState((prev) => prev.deleting(answer));
                        return;
                      }
                      option.orderIndex = index;
                      setQuestionState((prev) =>
                        prev.replacing(answer, option)
                      );
                    }}
                  />
                ))}
              </Stack>
            </Card.Body>
            <Card.Footer justifyContent="space-between">
              <Button
                color="red"
                variant="subtle"
                onClick={() => {
                  setQuestion(null);
                }}
              >
                Delete question
              </Button>
              <Button
                onClick={() => {
                  setQuestionState((prev) => {
                    const copy = prev.addingOption();
                    const lastIndex = copy.answers.length - 1;
                    copy.answers[lastIndex].orderIndex = lastIndex;
                    return copy;
                  });
                  // setTimeout(() => {
                  //   inputRef.current?.focus();
                  // }, 100);
                }}
                disabled={question.hasVacantOption}
              >
                + Add an option
              </Button>
            </Card.Footer>
          </Fieldset.Content>
        </Fieldset.Root>
      </form>
    </Card.Root>
  );
}
