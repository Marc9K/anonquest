"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import CreateSurvey from "../page";
import AnswerSurveyForm from "./AnswerSurveyForm";
import Survey from "@/model/Survey";
import useAuth from "@/hooks/useAuth";

export default function EditingSurvey() {
  const surveyId = useParams()?.surveyId as string;
  const [user] = useAuth();
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
