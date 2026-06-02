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
// Chakra v3 uses namespace exports — Checkbox.Root / Checkbox.Control etc.
import { useState } from "react";

export default function QuestionCard({ question }: { question: Question }) {
  // Checkbox type needs local state so Yes/No behave like radio buttons
  const [checkboxValue, setCheckboxValue] = useState<string>("");

  const header = (
    <>
      <Card.Title>
        <Text>{question.title}</Text>
      </Card.Title>
      <Card.Header>
        <Text>{question.description}</Text>
      </Card.Header>
    </>
  );

  // NUMERIC
  if (question.isNumeric) {
    return (
      <Card.Root>
        {header}
        <Card.Body>
          <HStack gap={2}>
            {question.numericPrefix && (
              <Text fontSize="sm" color="fg.muted">
                {question.numericPrefix}
              </Text>
            )}
            <Input
              type="number"
              name={question.title}
              min={question.numericMin}
              max={question.numericMax}
              placeholder="Enter a number"
              data-testid={`numeric-input-${question.title}`}
            />
            {question.numericSuffix && (
              <Text fontSize="sm" color="fg.muted">
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
      <Card.Root>
        {header}
        <Card.Body>
          <Input
            type="text"
            name={question.title}
            placeholder="Your answer"
            minLength={question.textMinLength}
            maxLength={question.textMaxLength}
          />
        </Card.Body>
      </Card.Root>
    );
  }

  // DATE variants
  if (question.type === QuestionType.DATE) {
    const variant = question.dateVariant ?? "date";

    // Month-only: Jan–Dec native select
    if (variant === "month-only") {
      const months = [
        "January", "February", "March", "April",
        "May", "June", "July", "August",
        "September", "October", "November", "December",
      ];
      return (
        <Card.Root>
          {header}
          <Card.Body>
            <NativeSelect.Root>
              <NativeSelect.Field name={question.title}>
                <option value="">Select a month</option>
                {months.map((m, i) => (
                  <option
                    key={m}
                    value={String(i + 1).padStart(2, "0")}
                  >
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

    // Year: plain number input
    if (variant === "year") {
      return (
        <Card.Root>
          {header}
          <Card.Body>
            <Input
              type="number"
              name={question.title}
              placeholder="YYYY"
              min={question.dateMin}
              max={question.dateMax}
            />
          </Card.Body>
        </Card.Root>
      );
    }

    // All other date variants use a native input
    const today = new Date().toISOString().split("T")[0];
    const minAttr = question.dateFutureOnly ? today : question.dateMin;
    const maxAttr = question.datePastOnly ? today : question.dateMax;

    return (
      <Card.Root>
        {header}
        <Card.Body>
          <Input
            type={question.inputType}
            name={question.title}
            min={minAttr}
            max={maxAttr}
          />
        </Card.Body>
      </Card.Root>
    );
  }

  // MULTI_CHOICE — checkboxes, each answer is its own checkbox
  if (question.type === QuestionType.MULTI_CHOICE) {
    return (
      <Card.Root>
        {header}
        <Card.Body>
          <Stack>
            {question.answers.map((answer) => (
              <Checkbox.Root key={answer.title}>
                {/* Native hidden input so form.getAll(name) works */}
                <Checkbox.HiddenInput name={question.title} value={answer.title} />
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
      <Card.Root>
        {header}
        <Card.Body>
          {/* Hidden input carries the chosen value */}
          <input type="hidden" name={question.title} value={checkboxValue} />
          <HStack>
            <Button
              variant={checkboxValue === "Yes" ? "solid" : "outline"}
              onClick={() =>
                setCheckboxValue((v) => (v === "Yes" ? "" : "Yes"))
              }
            >
              Yes
            </Button>
            <Button
              variant={checkboxValue === "No" ? "solid" : "outline"}
              onClick={() =>
                setCheckboxValue((v) => (v === "No" ? "" : "No"))
              }
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
    <Card.Root>
      {header}
      <Card.Body>
        <NativeSelect.Root>
          <NativeSelect.Field name={question.title}>
            <option key="" value="">
              {" "}
            </option>
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
