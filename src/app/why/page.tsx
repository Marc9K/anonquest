import InfoCard from "@/components/InfoCard";
import InfoTop from "@/components/InfoTop";
import ResponsiveGrid from "@/components/ResponsiveGrid";
import { Card, List, ListIndicator, SimpleGrid, Text } from "@chakra-ui/react";

const valueProps = [
  {
    title: "For You",
    description: "No compliance nightmares. Built-in ethical safeguards",
  },
  {
    title: "For Participants",
    description: "Genuine anonymity. No fear of exposure",
  },
  {
    title: "For The Data",
    description: "No contamination risk. Pure, unbiased patterns",
  },
];

export default function WhyThisMatters() {
  return (
    <>
      <InfoTop
        title="When Answers Require Trust"
        description="This isn't just another survey tool - it's a privacy ecosystem"
        link="/how"
        goTo="How does it work?"
      />
      <List.Root gap={3}>
        <Text>Some questions need asking:</Text>
        {[
          "Do my employees feel safe reporting issues?",
          "Are patients following treatment plans?",
          "What barriers keep communities from services?",
        ].map((point) => (
          <List.Item key={point}>
            <ListIndicator>⌗</ListIndicator>
            {point}
          </List.Item>
        ))}
      </List.Root>

      <Text>
        The answers change lives - but only if people believe their truth won't
        hurt them.
      </Text>
      <ResponsiveGrid>
        {valueProps.map((prop) => (
          <InfoCard
            key={prop.title}
            title={prop.title}
            description={prop.description}
          />
        ))}
      </ResponsiveGrid>
    </>
  );
}
