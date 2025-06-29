"use client";

import Answer from "@/model/Answer";
import { Group, IconButton, Input } from "@chakra-ui/react";
import { Ref, useState, useRef } from "react";
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
  const [showDelete, setShowDelete] = useState(false);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  return (
    <Group
      attached
      data-testid={`question-answer-option`}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <Input
        ref={ref}
        name="option"
        placeholder="Option"
        value={option.title}
        onFocus={() => setShowDelete(true)}
        onBlur={(e) => {
          if (
            deleteButtonRef.current &&
            e.relatedTarget === deleteButtonRef.current
          ) {
            return;
          }
          setShowDelete(false);
        }}
        onChange={({ target: { value } }) => {
          setOption(option.renaming(value));
        }}
      />
      {showDelete && (
        <IconButton
          ref={deleteButtonRef}
          aria-label="Delete"
          bg="bg.subtle"
          variant="outline"
          tabIndex={0}
          onBlur={(e) => {
            if (
              ref &&
              typeof ref !== "function" &&
              ref.current &&
              e.relatedTarget === ref.current
            ) {
              return;
            }
            setShowDelete(false);
          }}
          onClick={() => {
            setOption(null);
          }}
        >
          <FiDelete />
        </IconButton>
      )}
    </Group>
  );
}
