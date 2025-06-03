"use client";

import { auth } from "../firebase";
import { useRouter } from "next/navigation";
import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { AbsoluteCenter } from "@chakra-ui/react";

export default function LogIn() {
  // const [logedUser, ,] = useAuthState(auth);
  const router = useRouter();

  return (
    <AbsoluteCenter>
      <GoogleLogin
        onSuccess={async (response: CredentialResponse) => {
          if (!response.credential) return;
          const credential = GoogleAuthProvider.credential(response.credential);
          await signInWithCredential(auth, credential);
          router.replace("/yours");
        }}
        onError={() => {
          console.log("Login Failed");
        }}
        useOneTap
        auto_select
      />
      {process.env.NEXT_PUBLIC_IS_TEST && (
        <button
          onClick={() => {
            signInWithEmailAndPassword(auth, "test@test.org", "testpass");
            router.replace("/yours");
          }}
        >
          test sign in
        </button>
      )}
    </AbsoluteCenter>
  );
}
