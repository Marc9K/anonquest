"use client";

import { Field, Input } from "@chakra-ui/react";
import { Ref, useState } from "react";

export default function FieldInput({
  name,
  initialValue,
  value,
  onChange,
  label,
  required = false,
  ref,
}: {
  name: string;
  initialValue?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  required?: boolean;
  ref?: Ref<HTMLInputElement>;
}) {
  const [text, setText] = useState(initialValue ?? "");
  const isControlled = value !== undefined;
  return (
    <Field.Root required={required}>
      {label && (
        <Field.Label>
          {label}
          {required && <Field.RequiredIndicator />}
        </Field.Label>
      )}
      <Input
        ref={ref}
        name={name}
        type="text"
        value={isControlled ? value : text}
        onChange={(e) => {
          if (isControlled && onChange) {
            onChange(e);
          } else {
            setText(e.target.value);
          }
        }}
      />
    </Field.Root>
  );
}
