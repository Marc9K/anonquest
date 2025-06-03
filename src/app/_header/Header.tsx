"use client";

import useAuth from "@/hooks/useAuth";
import Link from "./Link";
import { Flex } from "@chakra-ui/react";
import { auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";

export default function Header() {
  const [user] = useAuthState(auth);
  console.log(user);
  return (
    <header>
      <nav>
        <Flex wrap="wrap" justify="space-around">
          <Link href="/">Home</Link>
          {user ? (
            <Link href="/account">Account</Link>
          ) : (
            <Link href="/login">Log In</Link>
          )}
        </Flex>
      </nav>
    </header>
  );
}
