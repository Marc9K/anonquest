"use client";
import { useRouter } from "next/navigation";

import { useAuthState, useSignOut } from "react-firebase-hooks/auth";
import { auth } from "../firebase";

export default function Account() {
  const [signOut, loadingOut, errorOut] = useSignOut(auth);
  const [user, loading, error] = useAuthState(auth);
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
      <p>Signed In User: {user?.email}</p>
      <button
        onClick={async () => {
          await signOut();
          router.push("/");
        }}
      >
        Sign Out
      </button>
    </div>
  );
}
