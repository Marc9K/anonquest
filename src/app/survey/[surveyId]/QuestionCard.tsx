import Question, { QuestionType } from "@/model/Question";
import {
  Button,
  Card,
  Checkbox,
  HStack,
  Input,
  NativeSelect,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";

export default function QuestionCard({ question }: { question: Question }) {
  const [checkboxValue, setCheckboxValue] = useState<string>("");

  const questionId = `question-${question.title?.replace(/\s+/g, "-")}`;

  const header = (
    <>
      <Card.Title>
        <Text id={`${questionId}-title`}>{question.title}</Text>
      </Card.Title>
      <Card.Header>
        <Text id={`${questionId}-desc`}>{question.description}</Text>
      </Card.Header>
    </>
  );

  // NUMERIC
  if (question.isNumeric) {
    return (
      <Card.Root role="group" aria-labelledby={`${questionId}-title`}>
        {header}
        <Card.Body>
          <HStack gap={2}>
            {question.numericPrefix && (
              <Text
                fontSize="sm"
                color="fg.muted"
                aria-hidden="true"
                id={`${questionId}-prefix`}
              >
                {question.numericPrefix}
              </Text>
            )}
            <Input
              type="number"
              name={question.title}
              min={question.numericMin}
              max={question.numericMax}
              placeholder="Enter a number"
              aria-label={[
                question.title,
                question.numericMin !== undefined
                  ? `minimum ${question.numericMin}`
                  : "",
                question.numericMax !== undefined
                  ? `maximum ${question.numericMax}`
                  : "",
              ]
                .filter(Boolean)
                .join(", ")}
              aria-describedby={
                [
                  question.numericPrefix ? `${questionId}-prefix` : "",
                  question.numericSuffix ? `${questionId}-suffix` : "",
                  question.description ? `${questionId}-desc` : "",
                ]
                  .filter(Boolean)
                  .join(" ") || undefined
              }
              data-testid={`numeric-input-${question.title}`}
            />
            {question.numericSuffix && (
              <Text
                fontSize="sm"
                color="fg.muted"
                aria-hidden="true"
                id={`${questionId}-suffix`}
              >
                {question.numericSuffix}
              </Text>
            )}
          </HStack>
        </Card.Body>
      </Card.Root>
    );
  }

  // TEXT
  if (question.type === QuestionType.TEXT) {
    return (
      <Card.Root role="group" aria-labelledby={`${questionId}-title`}>
        {header}
        <Card.Body>
          <Input
            type="text"
            name={question.title}
            placeholder="Your answer"
            minLength={question.textMinLength}
            maxLength={question.textMaxLength}
            aria-label={question.title}
            aria-describedby={
              question.description ? `${questionId}-desc` : undefined
            }
          />
        </Card.Body>
      </Card.Root>
    );
  }

  // DATE variants
  if (question.type === QuestionType.DATE) {
    const variant = question.dateVariant ?? "date";

    if (variant === "month-only") {
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      return (
        <Card.Root role="group" aria-labelledby={`${questionId}-title`}>
          {header}
          <Card.Body>
            <NativeSelect.Root>
              <NativeSelect.Field
                name={question.title}
                aria-label={`Select a month for: ${question.title}`}
                aria-describedby={
                  question.description ? `${questionId}-desc` : undefined
                }
              >
                <option value="">Select a month</option>
                {months.map((m, i) => (
                  <option key={m} value={String(i + 1).padStart(2, "0")}>
                    {m}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Card.Body>
        </Card.Root>
      );
    }

    if (variant === "year") {
      return (
        <Card.Root role="group" aria-labelledby={`${questionId}-title`}>
          {header}
          <Card.Body>
            <Input
              type="number"
              name={question.title}
              placeholder="YYYY"
              min={question.dateMin}
              max={question.dateMax}
              aria-label={`Year for: ${question.title}`}
              aria-describedby={
                question.description ? `${questionId}-desc` : undefined
              }
            />
          </Card.Body>
        </Card.Root>
      );
    }

    const today = new Date().toISOString().split("T")[0];
    const minAttr = question.dateFutureOnly ? today : question.dateMin;
    const maxAttr = question.datePastOnly ? today : question.dateMax;

    return (
      <Card.Root role="group" aria-labelledby={`${questionId}-title`}>
        {header}
        <Card.Body>
          <Input
            type={question.inputType}
            name={question.title}
            min={minAttr}
            max={maxAttr}
            aria-label={question.title}
            aria-describedby={
              question.description ? `${questionId}-desc` : undefined
            }
          />
        </Card.Body>
      </Card.Root>
    );
  }

  // MULTI_CHOICE
  if (question.type === QuestionType.MULTI_CHOICE) {
    return (
      <Card.Root role="group" aria-labelledby={`${questionId}-title`}>
        {header}
        <Card.Body>
          <Stack
            role="group"
            aria-label={`Select all that apply for: ${question.title}`}
          >
            {question.answers.map((answer) => (
              <Checkbox.Root key={answer.title}>
                <Checkbox.HiddenInput
                  name={question.title}
                  value={answer.title}
                  aria-label={answer.title}
                />
                <Checkbox.Control />
                <Checkbox.Label>{answer.title}</Checkbox.Label>
              </Checkbox.Root>
            ))}
          </Stack>
        </Card.Body>
      </Card.Root>
    );
  }

  // CHECKBOX — two distinct buttons; neither = skip
  if (question.type === QuestionType.CHECKBOX) {
    return (
      <Card.Root role="group" aria-labelledby={`${questionId}-title`}>
        {header}
        <Card.Body>
          <input type="hidden" name={question.title} value={checkboxValue} />
          <HStack
            role="group"
            aria-label={`Yes or No for: ${question.title}`}
          >
            <Button
              variant={checkboxValue === "Yes" ? "solid" : "outline"}
              aria-pressed={checkboxValue === "Yes"}
              onClick={() => setCheckboxValue((v) => (v === "Yes" ? "" : "Yes"))}
            >
              Yes
            </Button>
            <Button
              variant={checkboxValue === "No" ? "solid" : "outline"}
              aria-pressed={checkboxValue === "No"}
              onClick={() => setCheckboxValue((v) => (v === "No" ? "" : "No"))}
            >
              No
            </Button>
          </HStack>
        </Card.Body>
      </Card.Root>
    );
  }

  // SINGLE_CHOICE (default)
  return (
    <Card.Root role="group" aria-labelledby={`${questionId}-title`}>
      {header}
      <Card.Body>
        <NativeSelect.Root>
          <NativeSelect.Field
            name={question.title}
            aria-label={question.title}
            aria-describedby={
              question.description ? `${questionId}-desc` : undefined
            }
          >
            <option value=""> </option>
            {question.answers?.map((answer) => (
              <option key={answer.title} value={answer.title}>
                {answer.title}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </Card.Body>
    </Card.Root>
  );
}
