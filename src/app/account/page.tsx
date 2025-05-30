"use client";
import { useRouter } from "next/navigation";

import { useAuthState, useSignOut } from "react-firebase-hooks/auth";
import { useCollection } from "react-firebase-hooks/firestore";
import { auth, db } from "../firebase";
import {
  Button,
  Link as ChakraLink,
  Flex,
  List,
  Stack,
  Text,
} from "@chakra-ui/react";
import { collection, query, where } from "firebase/firestore";
import Link from "next/link";
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
      <p>Hello {user?.displayName}</p>
      {snapshotOwned?.docs.length > 0 && (
        <>
          <Text>Your Surveys:</Text>
          <List.Root gap="2">
            {snapshotOwned?.docs.map((doc) => (
              <List.Item key={doc.id}>
                <SurveyLink doc={doc} />
              </List.Item>
            ))}
          </List.Root>
        </>
      )}

      <Button
        onClick={async () => {
          router.push("/survey");
        }}
      >
        New survey
      </Button>

      {snapshotAssigned?.docs.length > 0 && (
        <>
          <Text>Take part in Surveys:</Text>
          <List.Root gap="2">
            {snapshotAssigned?.docs.map((doc) => (
              <List.Item key={doc.id}>
                <SurveyLink doc={doc} />
              </List.Item>
            ))}
          </List.Root>
        </>
      )}
      <Button
        variant="outline"
        onClick={async () => {
          await signOut();
          router.push("/");
        }}
      >
        Sign Out
      </Button>
    </Stack>
  );
}
