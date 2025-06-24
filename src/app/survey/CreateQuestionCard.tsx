"use client";

import { Button, Card, Field, Fieldset, Stack } from "@chakra-ui/react";
import { useRef, useState } from "react";
import AnswerCard from "./AnswerCard";
import FieldInput from "@/components/FieldInput";
import FieldTextArea from "@/components/FieldTextArea";
import Question from "@/model/Question";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function CreateQuestionCard({
  question,
  setQuestion,
  index,
  isDragging,
}: {
  question: Question;
  setQuestion: (question: Question | null) => void;
  index: number;
  isDragging: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [questionState, setQuestionState] = useState(question);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isQuestionDragging,
  } = useSortable({ id: question.title ?? "" });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isQuestionDragging ? 0.5 : 1,
    cursor: isQuestionDragging ? "grabbing" : "grab",
  };

  return (
    <Card.Root
      {...attributes}
      {...listeners}
      cursor="grab"
      size="lg"
      ref={setNodeRef}
      style={style}
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
          {/* {!isDragging && (
            <Card.Header>
              <Fieldset.Legend>Select an option</Fieldset.Legend>
            </Card.Header>
          )} */}
          <Fieldset.Content>
            <Card.Body>
              <Card.Title>
                <FieldInput
                  data-testid={`question-title`}
                  label={!isDragging ? "Question" : undefined}
                  name="title"
                  initialValue={question.title}
                  required
                />
              </Card.Title>
              {!isDragging && (
                <>
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
                  <Stack onMouseDown={(e) => e.stopPropagation()}>
                    {questionState.answers?.map((answer, index) => (
                      <AnswerCard
                        key={answer.title}
                        option={answer}
                        setOption={(option) => {
                          if (!option) {
                            setQuestion(questionState.deleting(answer));
                            setQuestionState((prev) => prev.deleting(answer));
                            return;
                          }
                          option.orderIndex = index;
                          setQuestionState((prev) =>
                            prev.replacing(answer, option)
                          );
                          setQuestion(questionState.replacing(answer, option));
                        }}
                      />
                    ))}
                  </Stack>
                </>
              )}
            </Card.Body>
            {!isDragging && (
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
                  }}
                  disabled={question.hasVacantOption}
                >
                  + Add an option
                </Button>
              </Card.Footer>
            )}
          </Fieldset.Content>
        </Fieldset.Root>
      </form>
    </Card.Root>
  );
}
