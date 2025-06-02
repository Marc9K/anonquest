"use client";
import { auth, db } from "@/app/firebase";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import CreateSurvey from "../page";
import AnswerSurveyForm from "./AnswerSurveyForm";
import Survey from "@/model/Survey";

export default function EditingSurvey() {
  const surveyId = useParams()?.surveyId as string;
  const [user] = useAuthState(auth);
  const [survey, setSurvey] = useState<Survey | null | undefined>(null);

  useEffect(() => {
    const survey = new Survey(surveyId);
    survey.load().then(() => {
      setSurvey(survey);
    });
  }, []);

  if (!survey) {
    return <>Loading...</>;
  }
  if (user?.email === survey.ownerEmail) {
    return <CreateSurvey existing={survey} />;
  } else {
    return <AnswerSurveyForm survey={survey} />;
  }
}
