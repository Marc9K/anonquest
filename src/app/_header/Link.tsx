import NextLink from "next/link";
import { Button, Link as ChakraLink } from "@chakra-ui/react";

export default function Link({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode | React.ReactNode[];
}) {
  return (
    <Button asChild variant="subtle" size="lg" margin={1}>
      <ChakraLink asChild>
        <NextLink href={href}>{children}</NextLink>
      </ChakraLink>
    </Button>
  );
}
