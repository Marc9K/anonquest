"use client";
import { useRouter } from "next/navigation";

import { useAuthState, useSignOut } from "react-firebase-hooks/auth";
import { useCollection } from "react-firebase-hooks/firestore";
import { auth, db } from "../firebase";
import { Button, Link as ChakraLink, List } from "@chakra-ui/react";
import { collection, query, where } from "firebase/firestore";
import Link from "next/link";
import SurveyLink from "./SurveyLink";

export default function Account() {
  const [signOut, loadingOut, errorOut] = useSignOut(auth);
  const [user] = useAuthState(auth);
  const router = useRouter();

  const surveysRef = collection(db, "surveys");

  const q = user
    ? query(surveysRef, where("ownerEmail", "==", user.email))
    : null;

  const [snapshot, loading, error] = useCollection(q);

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
    <div>
      <p>Hello {user?.displayName}</p>
      <List.Root gap="2">
        {snapshot?.docs.map((doc) => (
          <List.Item key={doc.id}>
            <SurveyLink doc={doc} />
          </List.Item>
        ))}
      </List.Root>
      <Button
        onClick={async () => {
          router.push("/survey");
        }}
      >
        New survey
      </Button>
      <Button
        variant="outline"
        onClick={async () => {
          await signOut();
          router.push("/");
        }}
      >
        Sign Out
      </Button>
    </div>
  );
}
