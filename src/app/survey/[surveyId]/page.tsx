"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import CreateSurvey from "../CreateSurvey";
import AnswerSurveyForm from "./AnswerSurveyForm";
import Survey from "@/model/Survey";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/firebase";

export default function EditingSurvey() {
  const surveyId = useParams()?.surveyId as string;
  const [user] = useAuthState(auth);
  const [survey, setSurvey] = useState<Survey | null | undefined>(null);

  useEffect(() => {
    const survey = new Survey(surveyId);
    survey.load().then(() => {
      setSurvey(survey);
    });
  }, [surveyId]);

  if (!survey) {
    return <>Loading...</>;
  }
  if (user?.email === survey.ownerEmail) {
    return <CreateSurvey existing={survey} />;
  } else {
    return <AnswerSurveyForm survey={survey} />;
  }
}
