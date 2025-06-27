"use client";

import {
  Button,
  Card,
  Collapsible,
  Field,
  Fieldset,
  HStack,
  IconButton,
  Stack,
} from "@chakra-ui/react";
import { useRef, useState } from "react";
import AnswerCard from "./AnswerCard";
import FieldInput from "@/components/FieldInput";
import FieldTextArea from "@/components/FieldTextArea";
import Question from "@/model/Question";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FaPlus } from "react-icons/fa6";
import { FiDelete } from "react-icons/fi";

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

  const handleBlur = (e: React.FocusEvent) => {
    // Check if the focus is moving to an element outside the card
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setShowMore(false);
    }

    // Update form data
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    const updated = question.copy;
    updated.title = formData.get("title")?.toString() || "";
    updated.description = formData.get("description")?.toString() || "";
    setQuestion(updated);
  };

  // Split answers into always-visible and collapsible
  const alwaysVisibleAnswers = question.answers.slice(0, 3);
  const collapsibleAnswers = question.answers.slice(3);

  const [showMore, setShowMore] = useState(false);

  const padding = 5;

  return (
    <Card.Root
      {...attributes}
      {...listeners}
      cursor="grab"
      size="lg"
      ref={setNodeRef}
      style={style}
      onBlur={handleBlur}
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
              <Card.Title paddingBottom={padding}>
                <HStack>
                  <FieldInput
                    data-testid={`question-title`}
                    // label={!isDragging ? "Question" : undefined}
                    placeholder="Question"
                    name="title"
                    value={question.title}
                    required
                    onChange={(e) => {
                      const updated = question.copy;
                      updated.title = e.target.value;
                      setQuestion(updated);
                    }}
                  />
                  <IconButton
                    aria-label="Delete question"
                    colorPalette="red"
                    variant="surface"
                    onClick={() => {
                      setQuestion(null);
                    }}
                  >
                    <FiDelete />
                  </IconButton>
                </HStack>
              </Card.Title>
              {!isDragging && (
                <>
                  <Card.Description paddingBottom={padding}>
                    <FieldTextArea
                      data-testid={`question-description`}
                      placeholder="Description"
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
                    {alwaysVisibleAnswers.map((answer, index) => (
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
                  {collapsibleAnswers.length > 0 && (
                    <>
                      {!showMore && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowMore(true)}
                        >
                          ...
                        </Button>
                      )}
                      <Collapsible.Root open={showMore} paddingTop="8px">
                        <Collapsible.Content>
                          <Stack onMouseDown={(e) => e.stopPropagation()}>
                            {collapsibleAnswers.map((answer, i) => (
                              <AnswerCard
                                key={i + 3}
                                option={answer}
                                setOption={(option) => {
                                  if (!option) {
                                    const updatedQuestion =
                                      question.deleting(answer);
                                    setQuestion(updatedQuestion);
                                    return;
                                  }
                                  option.orderIndex = i + 3;
                                  const updatedQuestion = question.replacing(
                                    answer,
                                    option
                                  );
                                  setQuestion(updatedQuestion);
                                }}
                              />
                            ))}
                          </Stack>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowMore(false)}
                          >
                            Show less
                          </Button>
                        </Collapsible.Content>
                      </Collapsible.Root>
                    </>
                  )}
                </>
              )}
            </Card.Body>
            {!isDragging && (
              <Card.Footer justifyContent="flex-end">
                <IconButton
                  aria-label="Add an option"
                  onClick={() => {
                    const updated = question.addingOption();
                    setQuestion(updated);
                    setShowMore(true);
                  }}
                  disabled={question.hasVacantOption}
                >
                  <FaPlus />
                </IconButton>
              </Card.Footer>
            )}
          </Fieldset.Content>
        </Fieldset.Root>
      </form>
    </Card.Root>
  );
}
