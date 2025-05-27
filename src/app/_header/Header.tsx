"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";
import Link from "./Link";
import { Flex } from "@chakra-ui/react";

export default function Header() {
  const [user, ,] = useAuthState(auth);
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
