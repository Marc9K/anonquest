"use client";
import { useRouter } from "next/navigation";

import { useAuthState, useSignOut } from "react-firebase-hooks/auth";
import { useCollection } from "react-firebase-hooks/firestore";
import { auth, db } from "../firebase";
import { Button, HStack, Spinner, Stack, Tabs } from "@chakra-ui/react";
import { collection, query, where } from "firebase/firestore";
import OptionalGrid from "./OptionalGrid";

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
    return <Spinner />;
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
          <OptionalGrid title="Take part in Surveys:" data={snapshotAssigned} />
        </Tabs.Content>
        <Tabs.Content value="research">
          <OptionalGrid title="Your Surveys:" isAdmin data={snapshotOwned} />
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
