import Link from "next/link";
import { Button, Card, Link as ChakraLink, List } from "@chakra-ui/react";
import { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { FirestoreSurvey } from "@/interfaces/firestore";

export default function SurveyLink({
  doc,
}: {
  doc: QueryDocumentSnapshot<DocumentData, DocumentData>;
}) {
  const data = doc.data() as FirestoreSurvey;
  return (
    <ChakraLink asChild>
      <Link href={`/survey/${doc.id}`}>
        <Card.Root>
          <Card.Title>{data.title}</Card.Title>
          <Card.Footer>{data.participants.length}</Card.Footer>
        </Card.Root>
      </Link>
    </ChakraLink>
  );
}
