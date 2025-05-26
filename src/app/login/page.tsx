"use client";

import { useAuthState, useSignInWithGoogle } from "react-firebase-hooks/auth";
import { auth } from "../firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LogIn() {
  const [signInWithGoogle, user, loadingIn, errorIn] =
    useSignInWithGoogle(auth);
  const [logedUser, _loading, _error] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (user || logedUser) {
      router.replace("/account");
    }
  }, [user]);

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
  if (user || logedUser) {
    return null;
    //   (
    //   <div>
    //     <p>Signed In User: {user?.providerId ?? logedUser?.providerId}</p>
    //     <p>Signed In User: {user?.user.email ?? logedUser?.email}</p>
    //     <p>Signed In User: {user?.user.displayName}</p>
    //   </div>
    // );
  }
  return (
    <div>
      <button
        onClick={async () => {
          await signInWithGoogle();
        }}
      >
        Sign in with Google
      </button>
    </div>
  );
}
