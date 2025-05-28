"use client";

import { useAuthState } from "react-firebase-hooks/auth";

import { collection, doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useRef } from "react";
import { Button, Field, Fieldset, Input, Stack } from "@chakra-ui/react";
import { useRouter } from "next/navigation";

export default function CreateSurvey() {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const createSurvey = async () => {
    if (!user) return;
    const formData = new FormData(formRef.current);
    const title = formData.get("title")?.toString() || "";
    const emails = formData.get("emails")?.toString() || "";

    const data = {
      ownerId: user.uid,
      title,
      participants: emails.split(",").map((e) => e.trim()),
    };

    // surveySchema.parse(data);

    const surveyRef = doc(collection(db, "surveys"));
    await setDoc(surveyRef, data);
  };

  return (
    <>
      <form
        ref={formRef}
        onSubmit={async (e) => {
          e.preventDefault();
          await createSurvey();
          router.push("/account");
        }}
      >
        <Fieldset.Root size="lg" maxW="md">
          <Stack>
            <Fieldset.Legend>New survey</Fieldset.Legend>
            <Fieldset.HelperText>
              Please provide your survey details below.
            </Fieldset.HelperText>
          </Stack>

          <Fieldset.Content>
            <Field.Root>
              <Field.Label>Title</Field.Label>
              <Input name="title" type="text" />
            </Field.Root>

            <Field.Root>
              <Field.Label>Participants' emails</Field.Label>
              <Input name="emails" type="text" />
            </Field.Root>
          </Fieldset.Content>

          <Button type="submit" alignSelf="flex-start">
            Create Survey
          </Button>
        </Fieldset.Root>
      </form>
    </>
  );
}
