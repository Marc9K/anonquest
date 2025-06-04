import { Card, Heading, Text } from "@chakra-ui/react";

export default function InfoCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card.Root>
      <Card.Header>
        <Heading size="md">{title}</Heading>
      </Card.Header>
      <Card.Body>
        <Text>{description}</Text>
      </Card.Body>
    </Card.Root>
  );
}
