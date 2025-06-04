import InfoCard from "@/components/InfoCard";
import InfoTop from "@/components/InfoTop";
import ResponsiveGrid from "@/components/ResponsiveGrid";
import { Heading, List, Stack, Text, Timeline } from "@chakra-ui/react";

const timeline = [
  {
    title: "Define What You Actually Need",
    points: [
      "Build surveys with intersecting answer columns",
      "Set analysis parameters upfront",
      "Lock in privacy requirements before collection begins",
    ],
    description:
      "This is your last chance to add questions. Once live, the structure is fixed.",
  },
  {
    title: "Anonymization Happens at the Door",
    points: [
      "Responses are stripped of identifiers immediately",
      "Raw data never touches your servers",
      "No 'view original' option exists",
    ],
    description: "Not even system administrators can reverse this process.",
  },
  {
    title: "Work With Patterns, Not People",
    points: [
      "Extract insights from column intersections",
      "Visualize trends across groups",
      "Never access individual responses",
    ],
    description: `Example: "35% of respondents who answered X to Q1 also answered Y to Q2" Not: "John Smith (age 32) said X and Y"`,
  },
];

export default function HowItWorks() {
  return (
    <Stack>
      <InfoTop
        title="No Tricks, No Trade-offs"
        description="A system where privacy isn’t a feature—it’s the foundation."
        goTo="Get Started"
        link="/login"
      />
      <Heading>If You Can’t Abuse It, Neither Can Anyone Else</Heading>
      <Text>
        This isn’t about limiting you—it’s about protecting everyone. By
        designing constraints into the architecture, we ensure:
      </Text>

      <ResponsiveGrid>
        {[
          "No accidental exposure",
          "No backdoor access",
          "No ethical gray areas",
        ].map((point) => (
          <InfoCard key={point} title={point} description="🙅" />
        ))}
      </ResponsiveGrid>

      <Heading>Step-by-Step Process</Heading>
      <Timeline.Root maxW="400px">
        {timeline.map(({ title, points, description }, index) => (
          <Timeline.Item key={title}>
            <Timeline.Connector>
              <Timeline.Separator />
              <Timeline.Indicator>{index}</Timeline.Indicator>
            </Timeline.Connector>
            <Timeline.Content>
              <Timeline.Title>{title}</Timeline.Title>
              <Timeline.Description>
                <List.Root>
                  {points.map((point) => (
                    <List.Item key={point}>{point}</List.Item>
                  ))}
                </List.Root>
              </Timeline.Description>
              <Text>{description}</Text>
            </Timeline.Content>
          </Timeline.Item>
        ))}
      </Timeline.Root>
    </Stack>
  );
}
