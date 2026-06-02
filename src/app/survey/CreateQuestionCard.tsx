"use client";

import {
  Box,
  Button,
  ButtonGroup,
  Card,
  Collapsible,
  Field,
  Fieldset,
  HStack,
  IconButton,
  Input,
  NativeSelect,
  Stack,
  Switch,
  Text,
} from "@chakra-ui/react";
import { useRef, useState } from "react";
import AnswerCard from "./AnswerCard";
import NumericQuestionConfig from "./NumericQuestionConfig";
import FieldInput from "@/components/FieldInput";
import FieldTextArea from "@/components/FieldTextArea";
import Question, { DateVariant, QuestionType } from "@/model/Question";
import Answer from "@/model/Answer";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FaPlus } from "react-icons/fa6";
import { FiDelete } from "react-icons/fi";
import { MdDragHandle } from "react-icons/md";

const TYPE_LABELS: Record<QuestionType, string> = {
  [QuestionType.SINGLE_CHOICE]: "Single",
  [QuestionType.MULTI_CHOICE]: "Multi",
  [QuestionType.NUMERIC]: "Numeric",
  [QuestionType.TEXT]: "Text",
  [QuestionType.DATE]: "Date",
  [QuestionType.CHECKBOX]: "Checkbox",
};

const DATE_VARIANTS: DateVariant[] = [
  "date",
  "time",
  "datetime",
  "month-only",
  "year-month",
  "year",
];

/** HTML input type for the date min/max config fields */
function dateConfigInputType(variant: DateVariant | undefined): string {
  switch (variant) {
    case "time": return "time";
    case "datetime": return "datetime-local";
    case "year-month": return "month";
    case "month-only": return "month";
    case "year": return "number";
    default: return "date";
  }
}

/** Placeholder hint for the min/max config field */
function dateConfigPlaceholder(variant: DateVariant | undefined, isMin: boolean): string {
  switch (variant) {
    case "time": return isMin ? "00:00" : "23:59";
    case "datetime": return isMin ? "2020-01-01T00:00" : "2030-12-31T23:59";
    case "year-month": return isMin ? "2020-01" : "2030-12";
    case "month-only": return isMin ? "01 (Jan)" : "12 (Dec)";
    case "year": return isMin ? "2020" : "2030";
    default: return isMin ? "2020-01-01" : "2030-12-31";
  }
}

/** Whether this date variant supports a min/max bound */
function dateVariantHasMinMax(variant: DateVariant | undefined): boolean {
  return variant !== "month-only";
}

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
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setShowMore(false);
    }
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    const updated = question.copy;
    updated.title = formData.get("title")?.toString() || "";
    updated.description = formData.get("description")?.toString() || "";
    setQuestion(updated);
  };

  const changeType = (type: QuestionType) => {
    // Read latest title/description from the live form before switching
    const formData = formRef.current ? new FormData(formRef.current) : null;
    const updated = question.copy;
    if (formData) {
      updated.title = formData.get("title")?.toString() || updated.title || "";
      updated.description =
        formData.get("description")?.toString() || updated.description || "";
    }
    updated.type = type;

    // Clear config that doesn't apply to the new type
    if (type !== QuestionType.NUMERIC) {
      updated.numericMin = undefined;
      updated.numericMax = undefined;
      updated.numericPrefix = undefined;
      updated.numericSuffix = undefined;
    }
    if (type !== QuestionType.DATE) {
      updated.dateVariant = undefined;
      updated.dateMin = undefined;
      updated.dateMax = undefined;
      updated.dateFutureOnly = undefined;
      updated.datePastOnly = undefined;
    }
    if (type !== QuestionType.TEXT) {
      updated.textCaseSensitive = undefined;
      updated.textMinLength = undefined;
      updated.textMaxLength = undefined;
    }

    // Auto-populate Yes/No for checkbox
    if (type === QuestionType.CHECKBOX) {
      const yes = new Answer();
      yes.title = "Yes";
      yes._title = "Yes";
      yes.orderIndex = 0;
      const no = new Answer();
      no.title = "No";
      no._title = "No";
      no.orderIndex = 1;
      updated.answers = [yes, no];
      updated.answersToDelete = [...question.answers];
    } else if (!updated.hasAnswerOptions) {
      // Non-list types: clear existing options
      updated.answersToDelete = [...question.answers];
      updated.answers = [];
    }

    setQuestion(updated);
  };

  const alwaysVisibleAnswers = question.answers.slice(0, 3);
  const collapsibleAnswers = question.answers.slice(3);
  const [showMore, setShowMore] = useState(false);
  const padding = 5;

  return (
    <Card.Root
      {...attributes}
      size="lg"
      ref={setNodeRef}
      style={style}
      onBlur={handleBlur}
    >
      <form ref={formRef} data-testid={`${index}-question-card`}>
        <Fieldset.Root size="lg" maxW="md">
          <Fieldset.Content>
            <Card.Body>
              <Card.Title paddingBottom={padding}>
                <HStack>
                  {/* Drag handle — only this element initiates drag */}
                  <Box
                    {...listeners}
                    cursor={isQuestionDragging ? "grabbing" : "grab"}
                    color="fg.muted"
                    flexShrink={0}
                    onMouseDown={(e) => e.stopPropagation()}
                    aria-label="Drag to reorder"
                  >
                    <MdDragHandle size={20} />
                  </Box>
                  <FieldInput
                    data-testid="question-title"
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
                    onClick={() => setQuestion(null)}
                  >
                    <FiDelete />
                  </IconButton>
                </HStack>
              </Card.Title>

              {!isDragging && (
                <>
                  {/* Type selector */}
                  <Stack
                    paddingBottom={padding}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <Field.Root>
                      <Field.Label id={`type-label-${question.instanceId}`}>
                        Question type
                      </Field.Label>
                    </Field.Root>
                    <ButtonGroup
                      size="sm"
                      variant="outline"
                      attached
                      wrap="wrap"
                      role="radiogroup"
                      aria-labelledby={`type-label-${question.instanceId}`}
                    >
                      {Object.values(QuestionType).map((type) => (
                        <Button
                          key={type}
                          role="radio"
                          aria-checked={question.type === type}
                          aria-label={`Set question type to ${TYPE_LABELS[type]}`}
                          variant={
                            question.type === type ? "solid" : "outline"
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            changeType(type);
                          }}
                        >
                          {TYPE_LABELS[type]}
                        </Button>
                      ))}
                    </ButtonGroup>
                  </Stack>

                  <Card.Description paddingBottom={padding}>
                    <FieldTextArea
                      data-testid="question-description"
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

                  {/* Per-type config */}
                  {question.isNumeric && (
                    <NumericQuestionConfig
                      question={question}
                      onChange={setQuestion}
                    />
                  )}

                  {question.type === QuestionType.DATE && (
                    <Stack
                      paddingBottom={padding}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <Field.Root>
                        <Field.Label htmlFor={`date-variant-${question.instanceId}`}>
                          Date variant
                        </Field.Label>
                        <NativeSelect.Root>
                          <NativeSelect.Field
                            id={`date-variant-${question.instanceId}`}
                            aria-label="Choose which part of a date participants select"
                            value={question.dateVariant ?? "date"}
                            onChange={(e) => {
                              const updated = question.copy;
                              updated.dateVariant = e.target
                                .value as DateVariant;
                              setQuestion(updated);
                            }}
                          >
                            {DATE_VARIANTS.map((v) => (
                              <option key={v} value={v}>
                                {v}
                              </option>
                            ))}
                          </NativeSelect.Field>
                          <NativeSelect.Indicator />
                        </NativeSelect.Root>
                      </Field.Root>
                      {dateVariantHasMinMax(question.dateVariant) && (
                        <HStack>
                          <Field.Root>
                            <Field.Label>Min</Field.Label>
                            <Input
                              type={dateConfigInputType(question.dateVariant)}
                              placeholder={dateConfigPlaceholder(question.dateVariant, true)}
                              value={question.dateMin ?? ""}
                              onChange={(e) => {
                                const updated = question.copy;
                                updated.dateMin = e.target.value || undefined;
                                setQuestion(updated);
                              }}
                            />
                          </Field.Root>
                          <Field.Root>
                            <Field.Label>Max</Field.Label>
                            <Input
                              type={dateConfigInputType(question.dateVariant)}
                              placeholder={dateConfigPlaceholder(question.dateVariant, false)}
                              value={question.dateMax ?? ""}
                              onChange={(e) => {
                                const updated = question.copy;
                                updated.dateMax = e.target.value || undefined;
                                setQuestion(updated);
                              }}
                            />
                          </Field.Root>
                        </HStack>
                      )}
                      <HStack>
                        <Switch.Root
                          checked={question.dateFutureOnly ?? false}
                          onCheckedChange={(details: { checked: boolean | "indeterminate" }) => {
                            const on = details.checked === true;
                            const updated = question.copy;
                            updated.dateFutureOnly = on || undefined;
                            updated.datePastOnly = on ? undefined : updated.datePastOnly;
                            setQuestion(updated);
                          }}
                        >
                          <Switch.HiddenInput />
                          <Switch.Control><Switch.Thumb /></Switch.Control>
                          <Switch.Label>Future only</Switch.Label>
                        </Switch.Root>
                        <Switch.Root
                          checked={question.datePastOnly ?? false}
                          onCheckedChange={(details: { checked: boolean | "indeterminate" }) => {
                            const on = details.checked === true;
                            const updated = question.copy;
                            updated.datePastOnly = on || undefined;
                            updated.dateFutureOnly = on ? undefined : updated.dateFutureOnly;
                            setQuestion(updated);
                          }}
                        >
                          <Switch.HiddenInput />
                          <Switch.Control><Switch.Thumb /></Switch.Control>
                          <Switch.Label>Past only</Switch.Label>
                        </Switch.Root>
                      </HStack>
                    </Stack>
                  )}

                  {question.type === QuestionType.TEXT && (
                    <Stack
                      paddingBottom={padding}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <HStack>
                        <Field.Root>
                          <Field.Label>Min length</Field.Label>
                          <Input
                            type="number"
                            value={question.textMinLength ?? ""}
                            onChange={(e) => {
                              const updated = question.copy;
                              updated.textMinLength = e.target.value
                                ? Number(e.target.value)
                                : undefined;
                              setQuestion(updated);
                            }}
                          />
                        </Field.Root>
                        <Field.Root>
                          <Field.Label>Max length</Field.Label>
                          <Input
                            type="number"
                            value={question.textMaxLength ?? ""}
                            onChange={(e) => {
                              const updated = question.copy;
                              updated.textMaxLength = e.target.value
                                ? Number(e.target.value)
                                : undefined;
                              setQuestion(updated);
                            }}
                          />
                        </Field.Root>
                      </HStack>
                      <Switch.Root
                        checked={question.textCaseSensitive ?? false}
                        onCheckedChange={(details: { checked: boolean | "indeterminate" }) => {
                          const on = details.checked === true;
                          const updated = question.copy;
                          updated.textCaseSensitive = on || undefined;
                          setQuestion(updated);
                        }}
                      >
                        <Switch.HiddenInput />
                        <Switch.Control><Switch.Thumb /></Switch.Control>
                        <Switch.Label>Case-sensitive answers</Switch.Label>
                      </Switch.Root>
                    </Stack>
                  )}

                  {question.type === QuestionType.CHECKBOX && (
                    <Text fontSize="sm" color="fg.muted" paddingBottom={padding}>
                      Always shows Yes / No buttons — no further config needed.
                    </Text>
                  )}

                  {/* Answer options list (single / multi only) */}
                  {question.hasAnswerOptions && (
                    <>
                      <Field.Root required>
                        <Field.Label id={`opts-label-${question.instanceId}`}>
                          Answer options
                        </Field.Label>
                      </Field.Root>
                      <Stack onMouseDown={(e) => e.stopPropagation()}>
                        {alwaysVisibleAnswers.map((answer, i) => (
                          <AnswerCard
                            key={i}
                            option={answer}
                            setOption={(option) => {
                              if (!option) {
                                setQuestion(question.deleting(answer));
                                return;
                              }
                              option.orderIndex = i;
                              setQuestion(question.replacing(answer, option));
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
                                        setQuestion(
                                          question.deleting(answer)
                                        );
                                        return;
                                      }
                                      option.orderIndex = i + 3;
                                      setQuestion(
                                        question.replacing(answer, option)
                                      );
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
                </>
              )}
            </Card.Body>

            {!isDragging && question.hasAnswerOptions && (
              <Card.Footer justifyContent="flex-end">
                <IconButton
                  aria-label="Add a new answer option"
                  aria-describedby={`opts-label-${question.instanceId}`}
                  onClick={() => {
                    setQuestion(question.addingOption());
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
