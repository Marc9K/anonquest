import Link from "@/app/_header/Link";
import { Button, Heading, Stack } from "@chakra-ui/react";

export default function InfoTop({
  title,
  description,
  goTo,
  link,
}: {
  title: string;
  description: string;
  goTo: string;
  link: string;
}) {
  return (
    <Stack alignItems="center" gap={8} marginY={8}>
      <Heading>{title}</Heading>
      <Heading>{description}</Heading>
      <Link href={link}>{goTo}</Link>
    </Stack>
  );
}
