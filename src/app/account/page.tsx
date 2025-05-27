"use client";
import { useRouter } from "next/navigation";

import { useAuthState, useSignOut } from "react-firebase-hooks/auth";
import { auth } from "../firebase";
import { Button } from "@chakra-ui/react";

export default function Account() {
  const [signOut, loadingOut, errorOut] = useSignOut(auth);
  const [user, ,] = useAuthState(auth);
  const router = useRouter();

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
