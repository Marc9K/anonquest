import InfoTop from "@/components/InfoTop";
import { Stack, Text } from "@chakra-ui/react";

export default function YourProtections() {
  return (
    <Stack>
      <InfoTop
        title="Your Identity Stays Yours"
        description={
          "Your responses are anonymized before researchers see them."
        }
        goTo={"How?"}
        link={"/how"}
      />
      <Text>
        No one—not even the researchers—can trace answers back to you. This
        isn’t an add-on. It’s how the system was built. No hidden "show original
        responses" button exists Researchers only see grouped patterns (never
        your individual answers) We physically can't reveal what you said - the
        system won't allow it
      </Text>
    </Stack>
  );
}
