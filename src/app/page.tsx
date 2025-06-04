import InfoCard from "@/components/InfoCard";
import InfoTop from "@/components/InfoTop";
import ResponsiveGrid from "@/components/ResponsiveGrid";
import { Mark, Stack, Text } from "@chakra-ui/react";

const valueProps = [
  {
    title: "Designed for Delicate Questions",
    description:
      "Studies about health, behavior, or identity deserve absolute discretion",
  },
  {
    title: "Define Boundaries",
    description: "Set clear parameters upfront. Collect only what's essential",
  },
  {
    title: "Automatic Protection",
    description: "Data anonymizes at collection. No undo button. No exceptions",
  },
  {
    title: "Insights Without Exposure",
    description: "See what patterns reveal - never who said what",
  },
];

export default function Home() {
  return (
    <Stack alignItems="center">
      <InfoTop
        title="Sensitive Data, Solved"
        description="Collect what you need without compromising what matters"
        goTo="Why should you care?"
        link="why"
      />
      <Text>{"Privacy by Design Isn't Optional"}</Text>
      <Text textWrap="wrap">
        {
          "This isn't another tool with privacy features bolted on. Every architectural decision begins with one question:"
        }
        <Mark variant="subtle" textWrap="wrap">
          How do we protect the people behind the data?
        </Mark>
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
    </Stack>
  );
}
