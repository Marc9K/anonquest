"use client";
import { auth, db } from "@/app/firebase";
import {
  FirestoreAnswer,
  FirestoreQuestion,
  FirestoreSurvey,
} from "@/interfaces/firestore";
import {
  collection,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  query,
  QueryDocumentSnapshot,
  where,
} from "firebase/firestore";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useCollection } from "react-firebase-hooks/firestore";
import CreateSurvey from "../page";

async function fetch(surveyId: string) {
  try {
    const surveyRef = doc(db, "surveys", surveyId);
    const docSnap = await getDoc(surveyRef);
    if (docSnap.exists()) {
      const questionsRef = collection(surveyRef, "questions");
      const questionsSnap = await getDocs(questionsRef);
      const questions = await Promise.all(
        questionsSnap.docs.map(async (question) => {
          const answersRef = collection(question.ref, "answers");
          const answersSnap = await getDocs(answersRef);
          const answers: FirestoreAnswer[] = answersSnap.docs.map((doc) => ({
            title: doc.id,
            count: 0,
          }));
          const q: FirestoreQuestion = {
            title: question.id,
            answers,
            description: question.data().description,
          };

          return q;
        })
      );
      const result = {
        survey: { ...docSnap.data(), questions } as FirestoreSurvey,
        id: docSnap.id,
      };
      return result;
    }
  } catch (error) {
    console.log(error);
  }
}

export default function EditingSurvey() {
  const surveyId = useParams()?.surveyId as string;
  const [snap, setSnap] = useState<
    | {
        survey: FirestoreSurvey;
        id: string;
      }
    | null
    | undefined
  >(null);

  useEffect(() => {
    fetch(surveyId).then((result) => {
      setSnap(result);
    });
  }, []);

  if (!snap) {
    return <>Loading...</>;
  }

  return (
    <CreateSurvey
      existing={{
        survey: snap.survey,
        id: snap.id,
      }}
    />
  );
}
