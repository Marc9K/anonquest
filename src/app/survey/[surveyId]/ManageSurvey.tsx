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
    <Stack gap={5} maxW="md" role="main" aria-label={`Managing survey: ${survey.title}`}>
      <Heading>{survey.title}</Heading>

      {survey.publishedAt && (
        <Text color="fg.muted" fontSize="sm" aria-label="Survey publication date">
          Published:{" "}
          <time dateTime={survey.publishedAt.toISOString()}>
            {survey.publishedAt.toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        </Text>
      )}

      <Stack gap={1} role="status" aria-label="Remaining participants count">
        <Text fontWeight="semibold" id="remaining-label">
          Remaining participants
        </Text>
        <Text aria-labelledby="remaining-label">
          {survey.participants?.length ?? 0}
        </Text>
      </Stack>

      <Stack gap={2} role="region" aria-label="Add more survey participants">
        <Text fontWeight="semibold" id="add-label">
          Add more responders
        </Text>
        <Textarea
          placeholder="e1@mail.co, e2@mail.co, ..."
          value={emailsInput}
          onChange={(e) => setEmailsInput(e.target.value)}
          rows={3}
          aria-labelledby="add-label"
          aria-describedby="add-help"
        />
        <Text id="add-help" fontSize="xs" color="fg.muted">
          Comma-separated email addresses
        </Text>
        <Button
          onClick={handleAddParticipants}
          loading={adding}
          disabled={!emailsInput.trim()}
          alignSelf="flex-start"
          aria-label="Send survey invitations to the listed email addresses"
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
        aria-label="Close this survey and apply the minimum-response privacy rule"
      >
        Close survey
      </Button>
    </Stack>
  );
}
