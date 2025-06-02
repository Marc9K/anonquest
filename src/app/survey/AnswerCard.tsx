"use client";

import { FirestoreAnswer } from "@/interfaces/firestore";
import Answer from "@/model/Answer";
import { Button, Flex, Group, Input } from "@chakra-ui/react";
import { Ref, useState } from "react";

export default function AnswerCard({
  option,
  setOption,
  ref,
}: {
  option: Answer;
  setOption: (option: Answer | null) => void;
  ref?: Ref<HTMLInputElement>;
}) {
  const [text, setText] = useState(option.title);

  const handleFinish = () => {
    try {
      setOption(option.renaming(text));
    } catch (error) {
      setText(option.title);
    }
  };

  return (
    <Group attached>
      <Input
        ref={ref}
        name="option"
        placeholder="Option"
        value={text}
        onSubmit={handleFinish}
        onBlur={handleFinish}
        onChange={({ target: { value } }) => {
          setText(value);
        }}
      />
      <Button
        bg="bg.subtle"
        variant="outline"
        onClick={() => {
          setOption(null);
        }}
      >
        Delete
      </Button>
    </Group>
  );
}
