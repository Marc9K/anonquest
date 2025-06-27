"use client";

import { Field, Textarea } from "@chakra-ui/react";
import { useState } from "react";

export default function FieldTextArea({
  name,
  initialValue,
  value,
  onChange,
  label,
  placeholder,
  helper,
}: {
  name: string;
  initialValue?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  label: string;
  placeholder?: string;
  helper?: string;
}) {
  const [text, setText] = useState(initialValue ?? "");
  const isControlled = value !== undefined;
  return (
    <Field.Root>
      <Field.Label>{label}</Field.Label>
      <Textarea
        name={name}
        value={isControlled ? value : text}
        onChange={(e) => {
          if (isControlled && onChange) {
            onChange(e);
          } else {
            setText(e.target.value);
          }
        }}
        placeholder={placeholder}
      />
      {helper && <Field.HelperText>{helper}</Field.HelperText>}
    </Field.Root>
  );
}
