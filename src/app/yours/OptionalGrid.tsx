import { GridItem, SimpleGrid, Text } from "@chakra-ui/react";
import SurveyLink from "./SurveyLink";
import { DocumentData, QuerySnapshot } from "firebase/firestore";

export default function OptionalGrid({
  title,
  data,
  isAdmin = false,
}: {
  title: string;
  data?: QuerySnapshot<DocumentData, DocumentData>;
  isAdmin?: boolean;
}) {
  if (!data || !(data.docs.length > 0)) return <></>;
  return (
    <>
      <Text>{title}</Text>
      <SimpleGrid gap={2} columns={[1, 2, 3]}>
        {data.docs.map((doc) => (
          <GridItem colSpan={1} key={doc.id} width="100%">
            <SurveyLink admin={isAdmin} doc={doc} />
          </GridItem>
        ))}
      </SimpleGrid>
    </>
  );
}
