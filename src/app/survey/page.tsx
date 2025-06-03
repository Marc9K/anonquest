"use client";

import { auth } from "../firebase";
import { useRef, useState } from "react";
import { Button, Fieldset } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import CreateQuestionCard from "./CreateQuestionCard";
import FieldInput from "@/components/FieldInput";
import FieldTextArea from "@/components/FieldTextArea";
import Survey from "@/model/Survey";
import Question from "@/model/Question";
import useAuth from "@/hooks/useAuth";

export default function CreateSurvey({ existing }: { existing?: Survey }) {
  const [user] = useAuth();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [survey, setSurvey] = useState(existing ?? new Survey());

  const get = (name: string) => {
    if (!formRef.current) return "";
    const formData = new FormData(formRef.current);
    return formData.get(name)?.toString() || "";
  };

  return (
    <>
      <form
        ref={formRef}
        onSubmit={async (e) => {
          e.preventDefault();
          if (formRef.current && user?.email) {
            await survey.save(new FormData(formRef.current), user?.email);
          }
          router.push("/yours");
        }}
      >
        <Fieldset.Root size="lg" maxW="md">
          <Fieldset.Legend>New survey</Fieldset.Legend>

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
                  setSurvey((prev) =>
                    prev.replacingQuestion(question, newQuestion)
                  );
                }}
              />
            ))}
            <Button
              alignSelf="flex-start"
              onClick={() => setSurvey((prev) => prev.addingQuestion())}
              disabled={survey.hasVacantQuestion}
            >
              + Add a question
            </Button>
          </Fieldset.Content>

          <Button type="submit" alignSelf="flex-start" marginBottom={50}>
            {survey.isLocal ? "Create Survey" : "Update Survey"}
          </Button>
        </Fieldset.Root>
      </form>
    </>
  );
}
