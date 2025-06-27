"use client";

import { Button, Card, Field, Fieldset, Stack } from "@chakra-ui/react";
import { useRef } from "react";
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
        const updated = question.copy;
        updated.title = formData.get("title")?.toString() || "";
        updated.description = formData.get("description")?.toString() || "";
        setQuestion(updated);
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
                  value={question.title}
                  required
                  onChange={(e) => {
                    const updated = question.copy;
                    updated.title = e.target.value;
                    setQuestion(updated);
                  }}
                />
              </Card.Title>
              {!isDragging && (
                <>
                  <Card.Description>
                    <FieldTextArea
                      data-testid={`question-description`}
                      label="Description"
                      name="description"
                      value={question.description}
                      onChange={(e) => {
                        const updated = question.copy;
                        updated.description = e.target.value;
                        setQuestion(updated);
                      }}
                    />
                  </Card.Description>
                  <Field.Root required>
                    <Field.Label>Answer options</Field.Label>
                  </Field.Root>
                  <Stack onMouseDown={(e) => e.stopPropagation()}>
                    {question.answers?.map((answer, index) => (
                      <AnswerCard
                        key={index}
                        option={answer}
                        setOption={(option) => {
                          if (!option) {
                            const updatedQuestion = question.deleting(answer);
                            setQuestion(updatedQuestion);
                            return;
                          }
                          option.orderIndex = index;
                          const updatedQuestion = question.replacing(
                            answer,
                            option
                          );
                          setQuestion(updatedQuestion);
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
                    const updated = question.addingOption();
                    setQuestion(updated);
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
