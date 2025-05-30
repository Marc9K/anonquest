import {
  FirestoreAnswer,
  FirestoreQuestion,
  FirestoreSurvey,
} from "@/interfaces/firestore";
import { Button, Stack, Text } from "@chakra-ui/react";
import QuestionCard from "./QuestionCard";
import { useRef } from "react";
import {
  arrayRemove,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/app/firebase";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";

async function submit(
  snap: { id: string; survey: FirestoreSurvey },
  formData: FormData,
  byEmail: string | undefined
) {
  try {
    const surveyRef = doc(db, "surveys", snap.id);
    const docSnap = await getDoc(surveyRef);
    if (docSnap.exists() && byEmail) {
      const questionsRef = collection(surveyRef, "questions");
      const questionsSnap = await getDocs(questionsRef);
      await Promise.all(
        questionsSnap.docs.map(async (question) => {
          const answerId = formData.get(question.id)?.toString();
          console.log(answerId);
          if (!answerId) return;
          const answerRef = doc(question.ref, "answers", answerId);
          await updateDoc(answerRef, {
            count: increment(1),
          });
        })
      );
      await updateDoc(surveyRef, {
        participants: arrayRemove(byEmail),
      });
    }
  } catch (error) {
    console.log(error);
  }
}

export default function AnswerSurveyForm({
  snap,
}: {
  snap: { id: string; survey: FirestoreSurvey };
}) {
  const formRef = useRef(null);
  const navigate = useRouter();
  const [user] = useAuthState(auth);
  return (
    <form
      ref={formRef}
      onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(formRef.current);
        await submit(snap, formData, user?.email);
        navigate.push("/account");
      }}
    >
      <Stack gap={3}>
        <Text>{snap.survey.title}</Text>
        <Text>By {snap.survey.ownerEmail}</Text>
        {snap.survey.questions?.map((question) => (
          <QuestionCard key={question.title} question={question} />
        ))}
        <Button type="submit">Submit</Button>
      </Stack>
    </form>
  );
}
