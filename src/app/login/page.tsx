"use client";

import { auth } from "../firebase";
import { useRouter } from "next/navigation";
import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
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
          router.replace("/account");
        }}
        onError={() => {
          console.log("Login Failed");
        }}
        useOneTap
        auto_select
      />
    </AbsoluteCenter>
  );
}
