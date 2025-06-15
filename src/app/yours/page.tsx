"use client";
import { useRouter } from "next/navigation";
import { useAuthState, useSignOut } from "react-firebase-hooks/auth";
import { useCollection, useDocument } from "react-firebase-hooks/firestore";
import { auth, db } from "../firebase";
import { Button, HStack, Spinner, Stack, Tabs } from "@chakra-ui/react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  QueryDocumentSnapshot,
  DocumentData,
  QuerySnapshot,
} from "firebase/firestore";
import OptionalGrid from "./OptionalGrid";
import { useState, useEffect } from "react";

export default function Account() {
  const [signOut, loadingOut, errorOut] = useSignOut(auth);
  const [user] = useAuthState(auth);
  const router = useRouter();

  const surveysRef = collection(db, "surveys");
  const queryOwned = user
    ? query(surveysRef, where("ownerEmail", "==", user.email))
    : null;

  // New schema: Fetch participant's surveys from the participants collection
  const [participantSurveys, setParticipantSurveys] = useState<
    QueryDocumentSnapshot<DocumentData, DocumentData>[]
  >([]);
  useEffect(() => {
    if (!user?.email) return;
    const fetchParticipantSurveys = async () => {
      const participantDocRef = doc(db, "participants", user.email);
      const surveysSubcollectionRef = collection(participantDocRef, "surveys");
      const surveysSnapshot = await getDocs(surveysSubcollectionRef);
      const surveyIds = surveysSnapshot.docs.map((doc) => doc.id);
      const surveys: QueryDocumentSnapshot<DocumentData, DocumentData>[] = [];
      for (const surveyId of surveyIds) {
        const surveyDocRef = doc(db, "surveys", surveyId);
        try {
          const surveyDoc = await getDoc(surveyDocRef);
          if (surveyDoc.exists()) {
            surveys.push(surveyDoc);
          }
        } catch (error) {
          console.log(error);
        }
      }
      setParticipantSurveys(surveys);
    };
    fetchParticipantSurveys();
  }, [user?.email]);

  const [snapshotOwned] = useCollection(queryOwned);
  // const [snapshotAssigned] = useCollection(queryAssigned); // Removed old query

  console.log(participantSurveys);

  if (errorOut) {
    return (
      <div>
        <p>Error: {errorOut.message}</p>
      </div>
    );
  }
  if (loadingOut) {
    return <Spinner />;
  }

  return (
    <Stack gap={3}>
      <HStack justify="space-between">
        <p>Hello {user?.displayName}</p>
        <Button
          variant="outline"
          onClick={async () => {
            await signOut();
            router.push("/");
          }}
        >
          Sign Out
        </Button>
      </HStack>
      <Tabs.Root defaultValue={"research"}>
        <Tabs.List>
          <Tabs.Trigger value="participant">as participant</Tabs.Trigger>
          <Tabs.Trigger value="research">as researcher</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="participant">
          <OptionalGrid
            title="Take part in Surveys:"
            data={
              { docs: participantSurveys } as QuerySnapshot<
                DocumentData,
                DocumentData
              >
            }
          />
        </Tabs.Content>
        <Tabs.Content value="research">
          <OptionalGrid title="Manage Surveys:" isAdmin data={snapshotOwned} />
          <Button
            onClick={async () => {
              router.push("/survey");
            }}
          >
            New survey
          </Button>
        </Tabs.Content>
      </Tabs.Root>
    </Stack>
  );
}
