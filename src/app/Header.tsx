"use client";

import Link from "next/link";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase";

export default function Header() {
  const [user, loading, error] = useAuthState(auth);
  return (
    <header>
      <nav>
        <Link href="/">Home</Link>
        {user ? (
          <Link href="/account">Account</Link>
        ) : (
          <Link href="/login">Log In</Link>
        )}
      </nav>
    </header>
  );
}
