import { Button, Stack, Text } from "@chakra-ui/react";
import QuestionCard from "./QuestionCard";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import Survey from "@/model/Survey";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/firebase";

export default function AnswerSurveyForm({ survey }: { survey: Survey }) {
  const formRef = useRef(null);
  const navigate = useRouter();
  const [user] = useAuthState(auth);
  return (
    <form
      ref={formRef}
      onSubmit={async (e) => {
        e.preventDefault();
        if (!user?.email || !formRef.current) return;
        const formData = new FormData(formRef.current);
        await survey.submit(formData, user?.email);
        navigate.push("/yours");
      }}
    >
      <Stack gap={3}>
        <Text>{survey.title}</Text>
        <Text>By {survey.ownerEmail}</Text>
        {survey.questions?.map((question, index) => (
          <div key={question.title} data-testid={`question-card-${index}`}>
            <QuestionCard question={question} />
          </div>
        ))}
        <Button type="submit">Submit</Button>
      </Stack>
    </form>
  );
}
