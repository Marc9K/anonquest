"use client";
import { useRouter } from "next/navigation";

import { useAuthState, useSignOut } from "react-firebase-hooks/auth";
import { useCollection } from "react-firebase-hooks/firestore";
import { auth, db } from "../firebase";
import {
  Button,
  HStack,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
} from "@chakra-ui/react";
import { collection, query, where } from "firebase/firestore";
import SurveyLink from "./SurveyLink";

export default function Account() {
  const [signOut, loadingOut, errorOut] = useSignOut(auth);
  const [user] = useAuthState(auth);
  const router = useRouter();

  const surveysRef = collection(db, "surveys");

  const queryOwned = user
    ? query(surveysRef, where("ownerEmail", "==", user.email))
    : null;

  const queryAssigned = user
    ? query(surveysRef, where("participants", "array-contains", user.email))
    : null;

  const [snapshotOwned] = useCollection(queryOwned);
  const [snapshotAssigned] = useCollection(queryAssigned);

  if (errorOut) {
    return (
      <div>
        <p>Error: {errorOut.message}</p>
      </div>
    );
  }
  if (loadingOut) {
    return <p>Loading...</p>;
  }

  return (
    <Stack gap={3}>
      <HStack justify="space-between">
        <p>Hello {user?.displayName}</p>
        <Button
          variant="outline"
          onClick={async () => {
            await signOut();
            router.push("/");
          }}
        >
          Sign Out
        </Button>
      </HStack>
      <Tabs.Root defaultValue={"research"}>
        <Tabs.List>
          <Tabs.Trigger value="participant">as participant</Tabs.Trigger>
          <Tabs.Trigger value="research">as researcher</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="participant">
          {(snapshotAssigned?.docs.length ?? 0) > 0 && (
            <>
              <Text>Take part in Surveys:</Text>
              <SimpleGrid gap={2}>
                {snapshotAssigned?.docs.map((doc) => (
                  <SurveyLink key={doc.id} doc={doc} />
                ))}
              </SimpleGrid>
            </>
          )}
        </Tabs.Content>
        <Tabs.Content value="research">
          {snapshotOwned && snapshotOwned.docs.length > 0 && (
            <>
              <Text>Your Surveys:</Text>
              <SimpleGrid gap={2}>
                {snapshotOwned?.docs.map((doc) => (
                  <SurveyLink
                    admin={user?.email === doc.data().ownerEmail}
                    key={doc.id}
                    doc={doc}
                  />
                ))}
              </SimpleGrid>
            </>
          )}

          <Button
            onClick={async () => {
              router.push("/survey");
            }}
          >
            New survey
          </Button>
        </Tabs.Content>
      </Tabs.Root>
    </Stack>
  );
}
