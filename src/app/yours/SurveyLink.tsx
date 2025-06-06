import Link from "next/link";
import {
  Button,
  Card,
  Link as ChakraLink,
  HStack,
  Text,
} from "@chakra-ui/react";
import { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { FirestoreSurvey } from "@/interfaces/firestore";
import { SurveyStatus } from "@/model/Survey";
import { IoStop } from "react-icons/io5";
import { CiEdit } from "react-icons/ci";
import { AiOutlineEye } from "react-icons/ai";

export default function SurveyLink({
  doc,
  admin = false,
  ...args
}: {
  doc: QueryDocumentSnapshot<DocumentData, DocumentData>;
  admin?: boolean;
}) {
  const data = doc.data() as FirestoreSurvey;
  return (
    <ChakraLink asChild {...args} padding={3} width="100%" display="block">
      <Link href={`/survey/${doc.id}`}>
        <Card.Root>
          <Card.Title margin={3}>{data.title}</Card.Title>
          <Card.Body>
            {admin ? (
              <HStack>
                {data.status === SurveyStatus.PENDING && (
                  <Button direction="row">
                    <Text>edit</Text>
                    <CiEdit />
                  </Button>
                )}
                {data.status === SurveyStatus.ACTIVE && (
                  <HStack>
                    <Button direction="row">
                      Close and view results <IoStop />
                    </Button>
                    <Text>awaits {data.participants.length} submitions</Text>
                  </HStack>
                )}
                {data.status === SurveyStatus.CLOSED && (
                  <Button direction="row">
                    <Text>View results</Text>
                    <AiOutlineEye />
                  </Button>
                )}
              </HStack>
            ) : (
              <Button>Refuse</Button>
            )}
          </Card.Body>
          {!admin && <Card.Footer>By {data.ownerEmail}</Card.Footer>}
        </Card.Root>
      </Link>
    </ChakraLink>
  );
}
