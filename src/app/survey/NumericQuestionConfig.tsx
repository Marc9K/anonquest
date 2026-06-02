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

  const baseId = `numeric-config-${question.instanceId}`;

  return (
    <Stack gap={3} onMouseDown={(e) => e.stopPropagation()}>
      <HStack>
        <Field.Root>
          <Field.Label htmlFor={`${baseId}-min`}>
            Minimum value
          </Field.Label>
          <Input
            id={`${baseId}-min`}
            type="number"
            aria-label="Minimum allowed numeric value"
            value={question.numericMin ?? ""}
            onChange={(e) =>
              update({
                numericMin:
                  e.target.value !== "" ? Number(e.target.value) : undefined,
              })
            }
          />
        </Field.Root>
        <Field.Root>
          <Field.Label htmlFor={`${baseId}-max`}>
            Maximum value
          </Field.Label>
          <Input
            id={`${baseId}-max`}
            type="number"
            aria-label="Maximum allowed numeric value"
            value={question.numericMax ?? ""}
            onChange={(e) =>
              update({
                numericMax:
                  e.target.value !== "" ? Number(e.target.value) : undefined,
              })
            }
          />
        </Field.Root>
      </HStack>
      <HStack>
        <Field.Root>
          <Field.Label htmlFor={`${baseId}-prefix`}>
            Prefix label
          </Field.Label>
          <Input
            id={`${baseId}-prefix`}
            type="text"
            placeholder="e.g. $"
            aria-label="Text displayed before the number input"
            value={question.numericPrefix ?? ""}
            onChange={(e) => update({ numericPrefix: e.target.value })}
          />
        </Field.Root>
        <Field.Root>
          <Field.Label htmlFor={`${baseId}-suffix`}>
            Suffix label
          </Field.Label>
          <Input
            id={`${baseId}-suffix`}
            type="text"
            placeholder="e.g. kg"
            aria-label="Text displayed after the number input"
            value={question.numericSuffix ?? ""}
            onChange={(e) => update({ numericSuffix: e.target.value })}
          />
        </Field.Root>
      </HStack>
    </Stack>
  );
}
