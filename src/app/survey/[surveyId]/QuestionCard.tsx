import Question from "@/model/Question";
import { Card, NativeSelect, Text, Input, HStack } from "@chakra-ui/react";

export default function QuestionCard({ question }: { question: Question }) {
  if (question.isNumeric) {
    return (
      <Card.Root>
        <Card.Title>
          <Text>{question.title}</Text>
        </Card.Title>
        <Card.Header>
          <Text>{question.description}</Text>
        </Card.Header>
        <Card.Body>
          <HStack gap={2}>
            {question.numericPrefix && (
              <Text fontSize="sm" color="fg.muted">
                {question.numericPrefix}
              </Text>
            )}
            <Input
              type="number"
              name={question.title}
              min={question.numericMin}
              max={question.numericMax}
              placeholder="Enter a number"
              data-testid={`numeric-input-${question.title}`}
            />
            {question.numericSuffix && (
              <Text fontSize="sm" color="fg.muted">
                {question.numericSuffix}
              </Text>
            )}
          </HStack>
        </Card.Body>
      </Card.Root>
    );
  }

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
