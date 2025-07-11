"use client";

import Survey from "@/model/Survey";
import { DataList, Heading, Stack } from "@chakra-ui/react";

export default function ViewResults({ survey }: { survey: Survey }) {
  return (
    <Stack>
      <Heading>{survey.title}</Heading>
      <DataList.Root variant="bold" divideY="1px" maxW="md">
        {survey.questions?.map((question) => (
          <DataList.Item key={question.id}>
            <DataList.ItemLabel fontSize="md">
              {question.title}
            </DataList.ItemLabel>

            <DataList.ItemValue>
              <DataList.Root orientation="horizontal">
                {question.answers.map((answer) => (
                  <DataList.Item key={answer.title}>
                    <DataList.ItemLabel>{answer.title}</DataList.ItemLabel>
                    <DataList.ItemValue>{answer.count}</DataList.ItemValue>
                  </DataList.Item>
                ))}
              </DataList.Root>
            </DataList.ItemValue>
          </DataList.Item>
        ))}
      </DataList.Root>
    </Stack>
  );
}
