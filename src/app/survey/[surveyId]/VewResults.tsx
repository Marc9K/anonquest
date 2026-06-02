"use client";

import Survey from "@/model/Survey";
import { DataList, Heading, Stack, Text } from "@chakra-ui/react";

export default function ViewResults({ survey }: { survey: Survey }) {
  return (
    <Stack gap={6}>
      <Heading>{survey.title}</Heading>

      {/* Response summary */}
      {survey.responseCount !== undefined &&
        survey.totalParticipants !== undefined && (
          <Text color="fg.muted" fontSize="sm">
            {survey.responseCount} response
            {survey.responseCount !== 1 ? "s" : ""} out of{" "}
            {survey.totalParticipants} invited
          </Text>
        )}

      {/* Per-question results */}
      <DataList.Root variant="bold" divideY="1px" maxW="md">
        {survey.questions?.map((question) => (
          <DataList.Item key={question.id}>
            <DataList.ItemLabel fontSize="md">
              {question.title}
            </DataList.ItemLabel>
            <DataList.ItemValue>
              <DataList.Root orientation="horizontal">
                {question.answers
                  .filter((a) => a.count !== -1)
                  .map((answer) => (
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

      {/* Intersections */}
      {survey.intersections && survey.intersections.length > 0 && (
        <Stack gap={4}>
          <Heading size="md">Intersections</Heading>
          {survey.intersections.map((intersection) => (
            <Stack key={intersection.id} gap={2}>
              <Text fontWeight="semibold">{intersection.label}</Text>
              <DataList.Root orientation="horizontal" maxW="md">
                {Object.entries(intersection.counts ?? {}).map(
                  ([combinationKey, count]) => (
                    <DataList.Item key={combinationKey}>
                      <DataList.ItemLabel>
                        {combinationKey.replace(/\|/g, " × ")}
                      </DataList.ItemLabel>
                      <DataList.ItemValue color={count === -1 ? "fg.muted" : undefined}>
                        {count === -1 ? "< 3" : count}
                      </DataList.ItemValue>
                    </DataList.Item>
                  )
                )}
              </DataList.Root>
            </Stack>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
