"use client";

import { Field, Textarea } from "@chakra-ui/react";
import { useState } from "react";

export default function FieldTextArea({
  name,
  initialValue,
  label,
  placeholder,
  helper,
}: {
  name: string;
  initialValue?: string;
  label: string;
  placeholder?: string;
  helper?: string;
}) {
  const [text, setText] = useState(initialValue ?? "");
  return (
    <Field.Root>
      <Field.Label>{label}</Field.Label>
      <Textarea
        name={name}
        value={text}
        onChange={({ target: { value } }) => setText(value)}
        placeholder={placeholder}
      />
      {helper && <Field.HelperText>{helper}</Field.HelperText>}
    </Field.Root>
  );
}
