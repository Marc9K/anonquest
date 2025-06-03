import { Accordion, Tabs, Text } from "@chakra-ui/react";

function questions(qs: any[]) {
  return (
    <Accordion.Root collapsible>
      {qs.map((item, index) => (
        <Accordion.Item key={index} value={item.question}>
          <Accordion.ItemTrigger>
            <Text>{item.question}</Text>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Accordion.ItemBody>
              <Text>{item.answer}</Text>
            </Accordion.ItemBody>
          </Accordion.ItemContent>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}

export default function FAQ() {
  const participant = [
    {
      question: "What stops hackers?",
      answer:
        "There's nothing valuable to steal - we don't store identifiable data.",
    },
    {
      question: "Can researchers see if I skipped questions?",
      answer: "They'll know how many people skipped, but never who.",
    },
    {
      question: "What if I change my mind?",
      answer:
        "There is no way to extract and change your data so there's nothing to do. Please read all the questions and answer them carefully before submitting.",
    },
    {
      question: "Are my answers really anonymous?",
      answer:
        "More than anonymous - they're mathematically impossible to trace.",
    },
  ];

  const researcher = [
    {
      question: "Why can't I do post-hoc analysis?",
      answer:
        'Because privacy-preserving analytics require upfront design - this prevents accidental exposure through "quick checks."',
    },
    {
      question: "How do I verify data quality?",
      answer:
        "Through consistency checks across answer intersections, not individual auditing.",
    },
  ];

  return (
    <Tabs.Root defaultValue="participant">
      <Tabs.List>
        <Tabs.Trigger value="participant">as participant</Tabs.Trigger>
        <Tabs.Trigger value="research">as researcher</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="participant">{questions(participant)}</Tabs.Content>
      <Tabs.Content value="research">{questions(researcher)}</Tabs.Content>
    </Tabs.Root>
  );
}
