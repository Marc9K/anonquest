"use client";

import { useRef, useState } from "react";
import {
  Badge,
  Button,
  ButtonGroup,
  Card,
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
import Survey, { Intersection, IntersectionGroup } from "@/model/Survey";
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

// (no module-level helpers needed — logic lives in Survey.ts)

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
        {
          label: "",
          groups: [{ questionTitles: [], operator: "and" }],
          outerOperator: "or",
        } satisfies Intersection,
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
            <Stack gap={3} role="region" aria-label="Intersection definitions">
              <Field.Root>
                <Field.Label>Intersections</Field.Label>
                <Field.HelperText>
                  Track how combinations of answers occur together. Add groups
                  of questions, set AND / OR within each group, and choose
                  whether groups combine with AND or OR.
                </Field.HelperText>
              </Field.Root>

              {survey.intersections.map((intersection, intIdx) => {
                // all question titles already used in any group of this intersection
                const usedTitles = new Set(
                  intersection.groups.flatMap((g) => g.questionTitles)
                );
                const availableTitles = (survey.questions ?? [])
                  .map((q) => q.title!)
                  .filter((t) => t && !usedTitles.has(t));

                const totalQuestions = intersection.groups.reduce(
                  (n, g) => n + g.questionTitles.length,
                  0
                );
                const isInvalid = totalQuestions < 2;

                return (
                  <Card.Root
                    key={intersection.id ?? intIdx}
                    variant="outline"
                    borderColor={isInvalid ? "red.300" : undefined}
                    aria-label={`Intersection ${intIdx + 1}: ${intersection.label || "untitled"}`}
                  >
                    <Card.Body>
                      {/* Label + remove */}
                      <HStack marginBottom={3}>
                        <Field.Root flex={1}>
                          <Field.Label htmlFor={`int-label-${intIdx}`}>
                            Intersection label
                          </Field.Label>
                          <input
                            id={`int-label-${intIdx}`}
                            placeholder="e.g. Gender × Age"
                            aria-label={`Label for intersection ${intIdx + 1}`}
                            value={intersection.label}
                            onChange={(e) =>
                              updateIntersection(intIdx, { label: e.target.value })
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
                          aria-label={`Remove intersection ${intIdx + 1}`}
                          colorPalette="red"
                          variant="ghost"
                          size="sm"
                          alignSelf="flex-end"
                          onClick={() => removeIntersection(intIdx)}
                        >
                          <FiDelete />
                        </IconButton>
                      </HStack>

                      {/* Groups */}
                      <Stack gap={2}>
                        {intersection.groups.map((group, gIdx) => (
                          <Stack key={gIdx} gap={1}>
                            {/* Between-group outer operator — shown above every group except the first */}
                            {gIdx > 0 && (
                              <HStack gap={1} paddingY={1}>
                                <Text fontSize="xs" color="fg.muted">
                                  between groups:
                                </Text>
                                <NativeSelect.Root size="xs" minW="80px">
                                  <NativeSelect.Field
                                    value={intersection.outerOperator}
                                    aria-label="Operator connecting the groups"
                                    onChange={(e) =>
                                      updateIntersection(intIdx, {
                                        outerOperator: e.target.value as "and" | "or",
                                      })
                                    }
                                  >
                                    <option value="or">OR</option>
                                    <option value="and">AND</option>
                                  </NativeSelect.Field>
                                  <NativeSelect.Indicator />
                                </NativeSelect.Root>
                              </HStack>
                            )}

                            {/* Group card */}
                            <Card.Root
                              variant="subtle"
                              role="group"
                              aria-label={`Group ${gIdx + 1} of intersection ${intIdx + 1}`}
                            >
                              <Card.Body paddingY={2}>
                                <HStack justify="space-between" marginBottom={2}>
                                  <HStack gap={1}>
                                    <Text fontSize="xs" fontWeight="semibold">
                                      Group {gIdx + 1}
                                    </Text>
                                    <Text fontSize="xs" color="fg.muted">
                                      — connect questions with:
                                    </Text>
                                    <NativeSelect.Root size="xs" minW="80px">
                                      <NativeSelect.Field
                                        value={group.operator}
                                        aria-label={`Inner operator for group ${gIdx + 1}`}
                                        onChange={(e) => {
                                          const newGroups = intersection.groups.map(
                                            (g, i) =>
                                              i === gIdx
                                                ? { ...g, operator: e.target.value as "and" | "or" }
                                                : g
                                          );
                                          updateIntersection(intIdx, { groups: newGroups });
                                        }}
                                      >
                                        <option value="and">AND</option>
                                        <option value="or">OR</option>
                                      </NativeSelect.Field>
                                      <NativeSelect.Indicator />
                                    </NativeSelect.Root>
                                  </HStack>
                                  <IconButton
                                    size="xs"
                                    variant="ghost"
                                    colorPalette="red"
                                    aria-label={`Remove group ${gIdx + 1}`}
                                    onClick={() => {
                                      const newGroups = intersection.groups.filter(
                                        (_, i) => i !== gIdx
                                      );
                                      updateIntersection(intIdx, { groups: newGroups });
                                    }}
                                  >
                                    <FiDelete />
                                  </IconButton>
                                </HStack>

                                {/* Questions in this group */}
                                <Stack direction="row" wrap="wrap" gap={1} marginBottom={2}>
                                  {group.questionTitles.length === 0 && (
                                    <Text fontSize="xs" color="fg.muted" fontStyle="italic">
                                      No questions added yet
                                    </Text>
                                  )}
                                  {group.questionTitles.map((title) => (
                                    <Badge
                                      key={title}
                                      display="inline-flex"
                                      alignItems="center"
                                      gap={1}
                                      cursor="default"
                                      aria-label={`Question in group: ${title}`}
                                    >
                                      {title}
                                      <button
                                        aria-label={`Remove question "${title}" from group ${gIdx + 1}`}
                                        style={{
                                          marginLeft: "4px",
                                          cursor: "pointer",
                                          background: "none",
                                          border: "none",
                                          padding: 0,
                                          lineHeight: 1,
                                          color: "inherit",
                                        }}
                                        onClick={() => {
                                          const newGroups = intersection.groups.map(
                                            (g, i) =>
                                              i === gIdx
                                                ? {
                                                    ...g,
                                                    questionTitles: g.questionTitles.filter(
                                                      (t) => t !== title
                                                    ),
                                                  }
                                                : g
                                          );
                                          updateIntersection(intIdx, { groups: newGroups });
                                        }}
                                      >
                                        ×
                                      </button>
                                    </Badge>
                                  ))}
                                </Stack>

                                {/* Add a question to this group */}
                                {availableTitles.length > 0 && (
                                  <NativeSelect.Root size="xs">
                                    <NativeSelect.Field
                                      aria-label={`Add a question to group ${gIdx + 1}`}
                                      value=""
                                      onChange={(e) => {
                                        const title = e.target.value;
                                        if (!title) return;
                                        const newGroups = intersection.groups.map(
                                          (g, i) =>
                                            i === gIdx
                                              ? {
                                                  ...g,
                                                  questionTitles: [...g.questionTitles, title],
                                                }
                                              : g
                                        );
                                        updateIntersection(intIdx, { groups: newGroups });
                                      }}
                                    >
                                      <option value="">+ Add question…</option>
                                      {availableTitles.map((t) => (
                                        <option key={t} value={t}>
                                          {t}
                                        </option>
                                      ))}
                                    </NativeSelect.Field>
                                    <NativeSelect.Indicator />
                                  </NativeSelect.Root>
                                )}
                              </Card.Body>
                            </Card.Root>
                          </Stack>
                        ))}

                        {/* Add group */}
                        <Button
                          size="xs"
                          variant="ghost"
                          alignSelf="flex-start"
                          aria-label={`Add a new group to intersection ${intIdx + 1}`}
                          onClick={() => {
                            const newGroups: IntersectionGroup[] = [
                              ...intersection.groups,
                              { questionTitles: [], operator: "and" },
                            ];
                            updateIntersection(intIdx, { groups: newGroups });
                          }}
                        >
                          + Add group
                        </Button>
                      </Stack>

                      {isInvalid && (
                        <Text color="red.500" fontSize="sm" marginTop={2} role="alert">
                          Add at least 2 questions across all groups
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
