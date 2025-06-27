"use client";

import Link from "./Link";
import { Button, CloseButton, Drawer, HStack, Portal } from "@chakra-ui/react";
import { auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { CiMenuBurger } from "react-icons/ci";
import { usePathname } from "next/navigation";

export default function Header() {
  const [user] = useAuthState(auth);

  const path = usePathname();
  const isYoursPage = path?.includes("/yours");
  const smallScreen = false;

  const account =
    smallScreen && isYoursPage ? (
      <></>
    ) : user ? (
      <Link href="/yours">Yours</Link>
    ) : (
      <Link href="/login">Log In</Link>
    );

  return (
    <header>
      <nav>
        <HStack hideBelow="lg" justify="space-around" margin={5}>
          <Link href="/">Home</Link>
          <Link href="/why">Why This Matters</Link>
          <Link href="/how">How It Works</Link>
          <Link href="/protections">Your Protection</Link>
          <Link href="/faq">FAQ</Link>
          {account}
        </HStack>
        <HStack hideFrom="lg" justify="space-between">
          <Drawer.Root>
            <Drawer.Trigger asChild>
              <Button variant="outline" size="sm">
                <CiMenuBurger />
              </Button>
            </Drawer.Trigger>
            <Portal>
              <Drawer.Backdrop />
              <Drawer.Positioner>
                <Drawer.Content>
                  <Drawer.Body>
                    <Link href="/">Home</Link>
                    <Link href="/why">Why This Matters</Link>
                    <Link href="/how">How It Works</Link>
                    <Link href="/protections">Your Protection</Link>
                    <Link href="/faq">FAQ</Link>
                  </Drawer.Body>
                  <Drawer.CloseTrigger asChild>
                    <CloseButton size="sm" />
                  </Drawer.CloseTrigger>
                </Drawer.Content>
              </Drawer.Positioner>
            </Portal>
          </Drawer.Root>
          {account}
        </HStack>
      </nav>
    </header>
  );
}
