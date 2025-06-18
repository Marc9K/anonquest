"use client";

import { useRef, useState } from "react";
import { Button, Fieldset, HStack } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import CreateQuestionCard from "./CreateQuestionCard";
import FieldInput from "@/components/FieldInput";
import FieldTextArea from "@/components/FieldTextArea";
import Survey from "@/model/Survey";
import { auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";

export default function CreateSurvey({ existing }: { existing?: Survey }) {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [survey, setSurvey] = useState(
    existing ?? new Survey(undefined, user?.email)
  );

  const get = (name: string) => {
    if (!formRef.current) return "";
    const formData = new FormData(formRef.current);
    return formData.get(name)?.toString() || "";
  };

  async function deleteSurvey() {
    if (!process.env.NEXT_PUBLIC_IS_TEST) {
      if (!confirm("Are you sure you want to delete this survey?")) return;
    }
    await survey.delete();
    router.push("/yours");
  }

  return (
    <>
      <form
        ref={formRef}
        onSubmit={async (e) => {
          e.preventDefault();
          if (formRef.current && user?.email) {
            await survey.save(new FormData(formRef.current));
          }
          router.push("/yours");
        }}
      >
        <Fieldset.Root size="lg" maxW="md">
          {survey.isLocal && <Fieldset.Legend>New survey</Fieldset.Legend>}

          <Fieldset.Content>
            <FieldInput
              label="Title"
              initialValue={existing?.title ?? get("title")}
              name="title"
              required
            />

            <FieldTextArea
              placeholder="e1@mail.co, e2@mail.co, ..."
              name="emails"
              initialValue={existing?.participants?.join(", ") ?? get("emails")}
              label="Participants' emails"
              helper="Please provide comma separated emails"
            />
            {survey.questions?.map((question, index) => (
              <CreateQuestionCard
                index={index}
                key={question.title}
                question={question}
                setQuestion={(newQuestion) => {
                  if (!newQuestion) {
                    setSurvey((prev) => prev.deletingQuestion(question));
                    return;
                  }
                  newQuestion.orderIndex = index;
                  setSurvey((prev) =>
                    prev.replacingQuestion(question, newQuestion)
                  );
                }}
              />
            ))}
            <Button
              onClick={() => {
                setSurvey((prev) => {
                  const newSurvey = prev.addingQuestion();
                  if (!newSurvey.questions) return newSurvey;
                  const lastIndex = newSurvey.questions.length - 1;
                  newSurvey.questions[lastIndex].orderIndex = lastIndex;
                  return newSurvey;
                });
              }}
              disabled={survey.hasVacantQuestion}
            >
              + Add a question
            </Button>
          </Fieldset.Content>
          <HStack justify="space-between">
            {!survey.isLocal && (
              <Button
                variant="subtle"
                color="red"
                alignSelf="flex-start"
                marginBottom={50}
                onClick={deleteSurvey}
              >
                Delete
              </Button>
            )}
            <Button type="submit" alignSelf="flex-start" marginBottom={50}>
              {survey.isLocal ? "Save" : "Update"}
            </Button>
          </HStack>
        </Fieldset.Root>
      </form>
    </>
  );
}
