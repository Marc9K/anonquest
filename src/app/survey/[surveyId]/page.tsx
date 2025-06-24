"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import CreateSurvey from "../CreateSurvey";
import AnswerSurveyForm from "./AnswerSurveyForm";
import Survey from "@/model/Survey";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/firebase";
import { Spinner } from "@chakra-ui/react";
import ViewResults from "./VewResults";
import { SurveyStatus } from "@/model/SurveyStatus";

export default function EditingSurvey() {
  const surveyId = useParams()?.surveyId as string;
  const [user] = useAuthState(auth);
  const [survey, setSurvey] = useState<Survey | null | undefined>(null);

  useEffect(() => {
    const load = async () => {
      const survey = new Survey(surveyId);
      await survey.load();
      setSurvey(survey);
    };
    load();
  }, [surveyId]);

  if (!survey) {
    return (
      <div data-testid="spinner">
        <Spinner />
      </div>
    );
  }
  if (user?.email === survey.ownerEmail) {
    if (survey.status === SurveyStatus.CLOSED) {
      return <ViewResults survey={survey} />;
    }
    return <CreateSurvey existing={survey} />;
  } else {
    return <AnswerSurveyForm survey={survey} />;
  }
}
