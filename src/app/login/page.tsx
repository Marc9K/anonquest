"use client";

import { auth } from "../firebase";
import { useRouter } from "next/navigation";
import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { AbsoluteCenter, Button, HStack, Stack } from "@chakra-ui/react";

export default function LogIn() {
  // const [logedUser, ,] = useAuthState(auth);
  const router = useRouter();

  return (
    <AbsoluteCenter>
      <Stack>
        <GoogleLogin
          onSuccess={async (response: CredentialResponse) => {
            if (!response.credential) return;
            const credential = GoogleAuthProvider.credential(
              response.credential
            );
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
          <HStack gap={3}>
            <Button
              onClick={async () => {
                await signInWithEmailAndPassword(
                  auth,
                  "test@test.org",
                  "testpass"
                );
                router.replace("/yours");
              }}
            >
              test sign in
            </Button>
            <Button
              onClick={async () => {
                await signInWithEmailAndPassword(
                  auth,
                  "2test@test.com",
                  "testpass"
                );
                router.replace("/yours");
              }}
            >
              test2 sign in
            </Button>
          </HStack>
        )}
      </Stack>
    </AbsoluteCenter>
  );
}
