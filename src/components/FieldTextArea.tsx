"use client";

import { Field, Textarea } from "@chakra-ui/react";
import { useState } from "react";

export default function FieldTextArea({
  name,
  initialValue,
  label,
}: {
  name: string;
  initialValue: string;
  label: string;
}) {
  const [text, setText] = useState(initialValue);
  return (
    <Field.Root>
      <Field.Label>{label}</Field.Label>
      <Textarea
        name={name}
        value={text}
        onChange={({ target: { value } }) => setText(value)}
      />
    </Field.Root>
  );
}
