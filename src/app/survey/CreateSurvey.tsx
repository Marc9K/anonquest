"use client";

import { useRef, useState } from "react";
import {
  Badge,
  Button,
  ButtonGroup,
  Card,
  Checkbox,
  Field,
  Fieldset,
  HStack,
  IconButton,
  Menu,
  NativeSelect,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import CreateQuestionCard from "./CreateQuestionCard";
import FieldInput from "@/components/FieldInput";
import FieldTextArea from "@/components/FieldTextArea";
import Survey, { Intersection } from "@/model/Survey";
import { auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis, snapCenterToCursor } from "@dnd-kit/modifiers";
import { useConstrainedSensors } from "./useConstrainedSensors";
import { LuChevronDown } from "react-icons/lu";
import { FiDelete } from "react-icons/fi";
import { Tooltip } from "@/components/ui/tooltip";
import { QuestionPrefilled } from "@/model/Question";
import Answer from "@/model/Answer";
import { getPrefilledOptions } from "@/constants/prefilledOptions";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Toggle a question into/out of an intersection, maintaining the
 * same display order as the survey's question list and keeping
 * the operators array in sync.
 */
function toggleIntersectionQuestion(
  intersection: Intersection,
  questionTitle: string,
  on: boolean,
  surveyOrder: string[]
): Intersection {
  if (on) {
    // Insert in survey order
    const newTitles = surveyOrder.filter(
      (t) => t === questionTitle || intersection.questionTitles.includes(t)
    );
    const insertPos = newTitles.indexOf(questionTitle);
    const newOps = [...intersection.operators];
    // splice "and" at insertPos — this places one operator between each consecutive pair
    newOps.splice(insertPos, 0, "and");
    return { ...intersection, questionTitles: newTitles, operators: newOps };
  } else {
    const removeIdx = intersection.questionTitles.indexOf(questionTitle);
    const newTitles = intersection.questionTitles.filter(
      (t) => t !== questionTitle
    );
    const newOps = [...intersection.operators];
    if (newOps.length > 0) {
      // Remove the operator closest to the removed position
      newOps.splice(Math.min(removeIdx, newOps.length - 1), 1);
    }
    return { ...intersection, questionTitles: newTitles, operators: newOps };
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CreateSurvey({ existing }: { existing?: Survey }) {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [survey, setSurvey] = useState(
    existing ?? new Survey(undefined, user?.email)
  );
  const [isDragging, setIsDragging] = useState(false);

  const get = (name: string) => {
    if (!formRef.current) return "";
    const formData = new FormData(formRef.current);
    return formData.get(name)?.toString() || "";
  };

  async function deleteSurvey() {
    if (!process.env.NEXT_PUBLIC_IS_TEST) {
      if (!confirm("Are you sure you want to delete this survey?")) return;
    }
    await survey.delete();
    router.push("/yours");
  }

  const sensors = useConstrainedSensors();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setIsDragging(false);

    if (over && active.id !== over.id) {
      setSurvey((prev) => {
        const oldIndex =
          prev.questions?.findIndex((q) => q.title === active.id) ?? -1;
        const newIndex =
          prev.questions?.findIndex((q) => q.title === over.id) ?? -1;

        if (oldIndex === -1 || newIndex === -1) return prev;

        const newQuestions = [...(prev.questions ?? [])];
        const [movedQuestion] = newQuestions.splice(oldIndex, 1);
        newQuestions.splice(newIndex, 0, movedQuestion);
        newQuestions.forEach((q, idx) => {
          q.orderIndex = idx;
        });

        const newSurvey = prev.copy;
        newSurvey.questions = newQuestions;
        return newSurvey;
      });
    }
  };

  const addQuestion = () => {
    setSurvey((prev) => {
      const newSurvey = prev.addingQuestion();
      if (!newSurvey.questions) return newSurvey;
      const lastIndex = newSurvey.questions.length - 1;
      newSurvey.questions[lastIndex].orderIndex = lastIndex;
      return newSurvey;
    });
  };

  const addPrefilledQuestion = (questionType: QuestionPrefilled) => {
    const prefilledAnswers = getPrefilledOptions(questionType);
    setSurvey((prev) => {
      if (prev.questions?.some((q) => q.title === "..." + questionType))
        return prev;
      const newSurvey = prev.addingQuestion();
      if (!newSurvey.questions) return newSurvey;
      const lastIndex = newSurvey.questions.length - 1;
      const newQuestion = newSurvey.questions[lastIndex];
      newQuestion.title = "..." + questionType;
      newQuestion.orderIndex = lastIndex;
      newQuestion.answers = prefilledAnswers.map((answer, idx) => {
        const a = new Answer();
        a.title = answer;
        a.orderIndex = idx;
        return a;
      });
      return newSurvey;
    });
  };

  const addIntersection = () => {
    setSurvey((prev) => {
      const c = prev.copy;
      c.intersections = [
        ...c.intersections,
        { label: "", questionTitles: [], operators: [] } satisfies Intersection,
      ];
      return c;
    });
  };

  const updateIntersection = (idx: number, patch: Partial<Intersection>) => {
    setSurvey((prev) => {
      const c = prev.copy;
      c.intersections = c.intersections.map((inter, i) =>
        i === idx ? { ...inter, ...patch } : inter
      );
      return c;
    });
  };

  const removeIntersection = (idx: number) => {
    setSurvey((prev) => {
      const c = prev.copy;
      c.intersections = c.intersections.filter((_, i) => i !== idx);
      return c;
    });
  };

  const surveyOrder = (survey.questions ?? [])
    .map((q) => q.title!)
    .filter(Boolean);

  return (
    <>
      <form
        ref={formRef}
        aria-label={survey.isLocal ? "New survey form" : "Edit survey form"}
        onSubmit={async (e) => {
          e.preventDefault();
          if (formRef.current && user?.email) {
            await survey.save(new FormData(formRef.current));
          }
          router.push("/yours");
        }}
      >
        <Fieldset.Root size="lg" maxW="md">
          {survey.isLocal && (
            <Fieldset.Legend>New survey</Fieldset.Legend>
          )}

          <Fieldset.Content>
            <FieldInput
              label="Title"
              initialValue={existing?.title ?? get("title")}
              name="title"
              required
            />

            <FieldTextArea
              placeholder="e1@mail.co, e2@mail.co, ..."
              name="emails"
              initialValue={
                existing?.participants?.join(", ") ?? get("emails")
              }
              label="Participants' emails"
              helper="Please provide comma-separated email addresses"
            />

            {/* ── Questions ── */}
            <DndContext
              onDragStart={() => setIsDragging(true)}
              onDragEnd={handleDragEnd}
              modifiers={[snapCenterToCursor, restrictToVerticalAxis]}
              sensors={sensors}
            >
              <SortableContext
                items={survey.questions?.map((q) => q.title ?? "") ?? []}
                strategy={verticalListSortingStrategy}
              >
                {survey.questions?.map((question, index) => (
                  <CreateQuestionCard
                    index={index}
                    key={question.instanceId}
                    question={question}
                    isDragging={isDragging}
                    setQuestion={(newQuestion) => {
                      if (!newQuestion) {
                        setSurvey((prev) =>
                          prev.deletingQuestion(question)
                        );
                        return;
                      }
                      newQuestion.orderIndex = index;
                      setSurvey((prev) =>
                        prev.replacingQuestion(question, newQuestion)
                      );
                    }}
                  />
                ))}
              </SortableContext>
            </DndContext>

            <Tooltip
              content={
                survey.hasVacantQuestion
                  ? "Please fill in all questions or delete empty ones"
                  : undefined
              }
            >
              <ButtonGroup attached>
                <Button
                  onClick={addQuestion}
                  disabled={survey.hasVacantQuestion}
                  aria-label="Add a new blank question"
                >
                  + Add a question
                </Button>
                <Menu.Root
                  onSelect={({ value }) => {
                    if (value && (value as QuestionPrefilled)) {
                      addPrefilledQuestion(value as QuestionPrefilled);
                    }
                  }}
                >
                  <Menu.Trigger disabled={survey.hasVacantQuestion}>
                    <IconButton
                      variant="outline"
                      disabled={survey.hasVacantQuestion}
                      aria-label="Add a pre-filled question template"
                    >
                      <LuChevronDown />
                    </IconButton>
                  </Menu.Trigger>
                  <Portal>
                    <Menu.Positioner>
                      <Menu.Content>
                        <Menu.ItemGroup>
                          <Menu.ItemGroupLabel>
                            Pre-filled question templates
                          </Menu.ItemGroupLabel>
                          {Object.values(QuestionPrefilled).map((prefill) => (
                            <Menu.Item key={prefill} value={prefill}>
                              {prefill}
                            </Menu.Item>
                          ))}
                        </Menu.ItemGroup>
                      </Menu.Content>
                    </Menu.Positioner>
                  </Portal>
                </Menu.Root>
              </ButtonGroup>
            </Tooltip>

            {/* ── Intersections ── */}
            <Stack
              gap={3}
              role="region"
              aria-label="Intersection definitions"
            >
              <Field.Root>
                <Field.Label>Intersections</Field.Label>
                <Field.HelperText>
                  Track how answers to different questions combine. Select 2 or
                  more questions and choose AND / OR between each pair.
                </Field.HelperText>
              </Field.Root>

              {survey.intersections.map((intersection, idx) => {
                const isInvalid = intersection.questionTitles.length < 2;
                return (
                  <Card.Root
                    key={intersection.id ?? idx}
                    variant="outline"
                    borderColor={isInvalid ? "red.300" : undefined}
                    aria-label={`Intersection ${idx + 1}: ${intersection.label || "untitled"}`}
                  >
                    <Card.Body>
                      {/* Label row */}
                      <HStack marginBottom={3}>
                        <Field.Root flex={1}>
                          <Field.Label htmlFor={`int-label-${idx}`}>
                            Intersection label
                          </Field.Label>
                          <input
                            id={`int-label-${idx}`}
                            name={`intersection-label-${idx}`}
                            placeholder="e.g. Gender × Age"
                            aria-label={`Label for intersection ${idx + 1}`}
                            value={intersection.label}
                            onChange={(e) =>
                              updateIntersection(idx, {
                                label: e.target.value,
                              })
                            }
                            style={{
                              width: "100%",
                              padding: "6px 12px",
                              border: "1px solid var(--chakra-colors-border)",
                              borderRadius: "var(--chakra-radii-md)",
                              background: "var(--chakra-colors-bg)",
                              color: "inherit",
                            }}
                          />
                        </Field.Root>
                        <IconButton
                          aria-label={`Remove intersection ${idx + 1}`}
                          colorPalette="red"
                          variant="ghost"
                          size="sm"
                          alignSelf="flex-end"
                          onClick={() => removeIntersection(idx)}
                        >
                          <FiDelete />
                        </IconButton>
                      </HStack>

                      {/* Question checkboxes */}
                      <fieldset aria-label="Questions to include in this intersection">
                        <legend
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: 500,
                            marginBottom: "8px",
                          }}
                        >
                          Include questions
                        </legend>
                        <Stack direction="row" wrap="wrap" gap={2}>
                          {(survey.questions ?? [])
                            .filter((q) => q.title)
                            .map((q) => (
                              <Checkbox.Root
                                key={q.title}
                                checked={intersection.questionTitles.includes(
                                  q.title!
                                )}
                                onCheckedChange={(details: {
                                  checked: boolean | "indeterminate";
                                }) => {
                                  const on = details.checked === true;
                                  const updated = toggleIntersectionQuestion(
                                    intersection,
                                    q.title!,
                                    on,
                                    surveyOrder
                                  );
                                  updateIntersection(idx, updated);
                                }}
                              >
                                <Checkbox.HiddenInput
                                  aria-label={`Include question "${q.title}" in this intersection`}
                                />
                                <Checkbox.Control />
                                <Checkbox.Label>{q.title}</Checkbox.Label>
                              </Checkbox.Root>
                            ))}
                        </Stack>
                      </fieldset>

                      {/* Logic preview — selected questions + operator selectors */}
                      {intersection.questionTitles.length >= 2 && (
                        <Stack
                          direction="row"
                          wrap="wrap"
                          align="center"
                          gap={2}
                          marginTop={3}
                          role="group"
                          aria-label="Intersection logic preview"
                        >
                          {intersection.questionTitles.flatMap((title, i) => {
                            const items = [
                              <Badge
                                key={`q-${title}`}
                                aria-label={`Question: ${title}`}
                              >
                                {title}
                              </Badge>,
                            ];
                            if (i < intersection.questionTitles.length - 1) {
                              items.push(
                                <NativeSelect.Root
                                  key={`op-${i}`}
                                  size="xs"
                                  minW="80px"
                                  aria-label={`Operator between "${title}" and "${intersection.questionTitles[i + 1]}"`}
                                >
                                  <NativeSelect.Field
                                    value={
                                      intersection.operators[i] ?? "and"
                                    }
                                    onChange={(e) => {
                                      const newOps = [
                                        ...intersection.operators,
                                      ];
                                      newOps[i] = e.target.value as
                                        | "and"
                                        | "or";
                                      updateIntersection(idx, {
                                        operators: newOps,
                                      });
                                    }}
                                    aria-label={`Logical operator between question ${i + 1} and question ${i + 2}`}
                                  >
                                    <option value="and">AND</option>
                                    <option value="or">OR</option>
                                  </NativeSelect.Field>
                                  <NativeSelect.Indicator />
                                </NativeSelect.Root>
                              );
                            }
                            return items;
                          })}
                        </Stack>
                      )}

                      {isInvalid && (
                        <Text
                          color="red.500"
                          fontSize="sm"
                          marginTop={2}
                          role="alert"
                        >
                          Select at least 2 questions
                        </Text>
                      )}
                    </Card.Body>
                  </Card.Root>
                );
              })}

              <Button
                variant="outline"
                alignSelf="flex-start"
                onClick={addIntersection}
                aria-label="Add a new intersection"
              >
                + Add intersection
              </Button>
            </Stack>
          </Fieldset.Content>

          <HStack justify="space-between">
            {!survey.isLocal && (
              <Button
                variant="subtle"
                color="red"
                alignSelf="flex-start"
                marginBottom={50}
                aria-label="Delete this survey permanently"
                onClick={deleteSurvey}
              >
                Delete
              </Button>
            )}
            <Button
              type="submit"
              alignSelf="flex-start"
              marginBottom={50}
              aria-label={survey.isLocal ? "Save new survey" : "Update survey"}
            >
              {survey.isLocal ? "Save" : "Update"}
            </Button>
          </HStack>
        </Fieldset.Root>
      </form>
    </>
  );
}
