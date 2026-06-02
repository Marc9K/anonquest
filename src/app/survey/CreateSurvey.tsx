"use client";

import { useRef, useState } from "react";
import {
  Button,
  ButtonGroup,
  Card,
  Checkbox,
  Field,
  Fieldset,
  HStack,
  IconButton,
  Menu,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import CreateQuestionCard from "./CreateQuestionCard";
import FieldInput from "@/components/FieldInput";
import FieldTextArea from "@/components/FieldTextArea";
import Survey from "@/model/Survey";
import { Intersection } from "@/model/Survey";
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
        newQuestions.forEach((q, idx) => { q.orderIndex = idx; });

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
        { label: "", questionTitles: [] } as Intersection,
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
        onSubmit={async (e) => {
          e.preventDefault();
          if (formRef.current && user?.email) {
            await survey.save(new FormData(formRef.current));
          }
          router.push("/yours");
        }}
      >
        <Fieldset.Root size="lg" maxW="md">
          {survey.isLocal && <Fieldset.Legend>New survey</Fieldset.Legend>}

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
              initialValue={existing?.participants?.join(", ") ?? get("emails")}
              label="Participants' emails"
              helper="Please provide comma separated emails"
            />

            {/* Questions */}
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
                        setSurvey((prev) => prev.deletingQuestion(question));
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
                    >
                      <LuChevronDown />
                    </IconButton>
                  </Menu.Trigger>
                  <Portal>
                    <Menu.Positioner>
                      <Menu.Content>
                        <Menu.ItemGroup>
                          <Menu.ItemGroupLabel>about</Menu.ItemGroupLabel>
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

            {/* Intersections */}
            <Field.Root>
              <Field.Label>Intersections</Field.Label>
            </Field.Root>
            <Stack gap={3}>
              {survey.intersections.map((intersection, idx) => {
                const isInvalid = intersection.questionTitles.length < 2;
                return (
                  <Card.Root
                    key={intersection.id ?? idx}
                    variant="outline"
                    borderColor={isInvalid ? "red.300" : undefined}
                  >
                    <Card.Body>
                      <HStack marginBottom={2}>
                        <FieldInput
                          name={`intersection-label-${idx}`}
                          placeholder="Intersection label"
                          value={intersection.label}
                          onChange={(e) =>
                            updateIntersection(idx, {
                              label: e.target.value,
                            })
                          }
                        />
                        <IconButton
                          aria-label="Remove intersection"
                          colorPalette="red"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeIntersection(idx)}
                        >
                          <FiDelete />
                        </IconButton>
                      </HStack>
                      <Stack direction="row" wrap="wrap" gap={2}>
                        {survey.questions
                          ?.filter((q) => q.title)
                          .map((q) => (
                            <Checkbox.Root
                              key={q.title}
                              checked={intersection.questionTitles.includes(q.title!)}
                              onCheckedChange={(details: { checked: boolean | "indeterminate" }) => {
                                const on = details.checked === true;
                                const newTitles = on
                                  ? [...intersection.questionTitles, q.title!]
                                  : intersection.questionTitles.filter((t) => t !== q.title);
                                updateIntersection(idx, { questionTitles: newTitles });
                              }}
                            >
                              <Checkbox.HiddenInput />
                              <Checkbox.Control />
                              <Checkbox.Label>{q.title}</Checkbox.Label>
                            </Checkbox.Root>
                          ))}
                      </Stack>
                      {isInvalid && (
                        <Text color="red.500" fontSize="sm" marginTop={1}>
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
                onClick={deleteSurvey}
              >
                Delete
              </Button>
            )}
            <Button type="submit" alignSelf="flex-start" marginBottom={50}>
              {survey.isLocal ? "Save" : "Update"}
            </Button>
          </HStack>
        </Fieldset.Root>
      </form>
    </>
  );
}
