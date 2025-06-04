import { SimpleGrid } from "@chakra-ui/react";

export default function ResponsiveGrid({
  children,
}: {
  children: React.ReactNode[];
}) {
  return (
    <SimpleGrid
      gap={3}
      columns={{ base: 1, smToLg: 2, lgTo2xl: children?.length ?? 4 }}
      marginY={4}
    >
      {children}
    </SimpleGrid>
  );
}
