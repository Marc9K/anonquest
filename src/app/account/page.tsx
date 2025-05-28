"use client";
import { useRouter } from "next/navigation";

import { useAuthState, useSignOut } from "react-firebase-hooks/auth";
import { useCollection } from "react-firebase-hooks/firestore";
import { auth, db } from "../firebase";
import { Button } from "@chakra-ui/react";
import { collection, query, where } from "firebase/firestore";

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
      <ul>
        {snapshot?.docs.map((doc) => (
          <li key={doc.id}>{doc.data().title}</li>
        ))}
      </ul>
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
