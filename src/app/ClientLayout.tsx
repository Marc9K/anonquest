"use client";

import { Center, VStack } from "@chakra-ui/react";
import Header from "./_header/Header";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  );
}
