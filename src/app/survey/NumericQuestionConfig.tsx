"use client";

import { Field, HStack, Input, Stack } from "@chakra-ui/react";
import Question from "@/model/Question";

export default function NumericQuestionConfig({
  question,
  onChange,
}: {
  question: Question;
  onChange: (q: Question) => void;
}) {
  const update = (patch: Partial<Question>) => {
    const updated = question.copy;
    Object.assign(updated, patch);
    onChange(updated);
  };

  return (
    <Stack gap={3} onMouseDown={(e) => e.stopPropagation()}>
      <HStack>
        <Field.Root>
          <Field.Label>Min</Field.Label>
          <Input
            type="number"
            value={question.numericMin ?? ""}
            onChange={(e) =>
              update({
                numericMin: e.target.value !== "" ? Number(e.target.value) : undefined,
              })
            }
          />
        </Field.Root>
        <Field.Root>
          <Field.Label>Max</Field.Label>
          <Input
            type="number"
            value={question.numericMax ?? ""}
            onChange={(e) =>
              update({
                numericMax: e.target.value !== "" ? Number(e.target.value) : undefined,
              })
            }
          />
        </Field.Root>
      </HStack>
      <HStack>
        <Field.Root>
          <Field.Label>Prefix</Field.Label>
          <Input
            type="text"
            placeholder="e.g. $"
            value={question.numericPrefix ?? ""}
            onChange={(e) => update({ numericPrefix: e.target.value })}
          />
        </Field.Root>
        <Field.Root>
          <Field.Label>Suffix</Field.Label>
          <Input
            type="text"
            placeholder="e.g. kg"
            value={question.numericSuffix ?? ""}
            onChange={(e) => update({ numericSuffix: e.target.value })}
          />
        </Field.Root>
      </HStack>
    </Stack>
  );
}
