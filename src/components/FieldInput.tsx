"use client";

import { Field, Input } from "@chakra-ui/react";
import { Ref, useState } from "react";

export default function FieldInput({
  name,
  initialValue,
  label,
  required = false,
  ref,
}: {
  name: string;
  initialValue?: string;
  label: string;
  required?: boolean;
  ref?: Ref<HTMLInputElement>;
}) {
  const [text, setText] = useState(initialValue ?? "");
  return (
    <Field.Root required={required}>
      <Field.Label>
        {label}
        {required && <Field.RequiredIndicator />}
      </Field.Label>
      <Input
        ref={ref}
        name={name}
        type="text"
        value={text}
        onChange={({ target: { value } }) => {
          setText(value);
        }}
      />
    </Field.Root>
  );
}
