import { QuestionPrefilled } from "@/model/Question";

export const getPrefilledOptions = (questionType: QuestionPrefilled): string[] => {
  switch (questionType) {
    case QuestionPrefilled.ETHNICITY:
      return [
        "Asian or Asian British",
        "Black, Black British, Caribbean or African",
        "Mixed or multiple ethnic groups",
        "White",
        "Other",
      ];
    case QuestionPrefilled.RELIGION:
      return [
        "Christian",
        "Muslim",
        "Hindu",
        "Buddhist",
        "Jewish",
        "Sikh",
        "None",
        "Other",
      ];
    case QuestionPrefilled.COUNTRY:
      // TODO: paste the 248-country list from the old CreateSurvey.tsx here
      return [];
    case QuestionPrefilled.SEXUAL_ORIENTATION:
      return [
        "Heterosexual",
        "Homosexual",
        "Bisexual",
        "Pansexual",
        "Asexual",
        "Queer",
        "Other",
      ];
    default:
      return [];
  }
};
