import { FirestoreQuestion } from "@/interfaces/firestore";
import { Card, NativeSelect, Text } from "@chakra-ui/react";

export default function QuestionCard({
  question,
}: {
  question: FirestoreQuestion;
}) {
  return (
    <Card.Root>
      <Card.Title>
        <Text>{question.title}</Text>
      </Card.Title>
      <Card.Header>
        <Text>{question.description}</Text>
      </Card.Header>
      <Card.Body>
        <NativeSelect.Root>
          <NativeSelect.Field name={question.title}>
            <option key="" value="">
              {" "}
            </option>
            {question.answers?.map((answer) => (
              <option key={answer.title} value={answer.title}>
                {answer.title}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </Card.Body>
    </Card.Root>
  );
}
