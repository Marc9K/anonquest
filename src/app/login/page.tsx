"use client";

import { useSignInWithGoogle } from "react-firebase-hooks/auth";
import { auth } from "../firebase";
import { useRouter } from "next/navigation";

export default function LogIn() {
  const [signInWithGoogle, user, loadingIn, errorIn] =
    useSignInWithGoogle(auth);
  const router = useRouter();

  if (errorIn) {
    return (
      <div>
        <p>Error: {errorIn?.message}</p>
      </div>
    );
  }
  if (loadingIn) {
    return <p>Loading...</p>;
  }
  if (user) {
    return (
      <div>
        <p>Signed In User: {user.providerId}</p>
        <p>Signed In User: {user.user.email}</p>
        <p>Signed In User: {user.user.displayName}</p>
      </div>
    );
  }
  return (
    <div>
      <button
        onClick={async () => {
          await signInWithGoogle();
          router.push("/account");
        }}
      >
        Sign in with Google
      </button>
    </div>
  );
}
