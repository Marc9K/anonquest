"use client";

import Survey from "@/model/Survey";
import {
  Button,
  Heading,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ManageSurvey({ survey }: { survey: Survey }) {
  const [emailsInput, setEmailsInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [closing, setClosing] = useState(false);
  const router = useRouter();

  const handleAddParticipants = async () => {
    const emails = emailsInput
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
    if (emails.length === 0) return;
    setAdding(true);
    try {
      await survey.addParticipants(emails);
      setEmailsInput("");
    } finally {
      setAdding(false);
    }
  };

  const handleClose = async () => {
    setClosing(true);
    try {
      await survey.finish();
      router.push("/yours");
    } finally {
      setClosing(false);
    }
  };

  return (
    <Stack gap={5} maxW="md">
      <Heading>{survey.title}</Heading>

      {survey.publishedAt && (
        <Text color="fg.muted" fontSize="sm">
          Published:{" "}
          {survey.publishedAt.toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Text>
      )}

      <Stack gap={1}>
        <Text fontWeight="semibold">Remaining participants</Text>
        <Text>{survey.participants?.length ?? 0}</Text>
      </Stack>

      <Stack gap={2}>
        <Text fontWeight="semibold">Add more responders</Text>
        <Textarea
          placeholder="e1@mail.co, e2@mail.co, ..."
          value={emailsInput}
          onChange={(e) => setEmailsInput(e.target.value)}
          rows={3}
        />
        <Button
          onClick={handleAddParticipants}
          loading={adding}
          disabled={!emailsInput.trim()}
          alignSelf="flex-start"
        >
          Add participants
        </Button>
      </Stack>

      <Button
        colorPalette="red"
        variant="outline"
        alignSelf="flex-start"
        onClick={handleClose}
        loading={closing}
      >
        Close survey
      </Button>
    </Stack>
  );
}
