"use client";

import Answer from "@/model/Answer";
import { Button, Group, Input } from "@chakra-ui/react";
import { Ref } from "react";
import { FiDelete } from "react-icons/fi";

export default function AnswerCard({
  option,
  setOption,
  ref,
}: {
  option: Answer;
  setOption: (option: Answer | null) => void;
  ref?: Ref<HTMLInputElement>;
}) {
  return (
    <Group attached data-testid={`question-answer-option`}>
      <Input
        ref={ref}
        name="option"
        placeholder="Option"
        value={option.title}
        onChange={({ target: { value } }) => {
          setOption(option.renaming(value));
        }}
      />
      <Button
        aria-label="Delete"
        bg="bg.subtle"
        variant="outline"
        onClick={() => {
          setOption(null);
        }}
      >
        <FiDelete />
      </Button>
    </Group>
  );
}
