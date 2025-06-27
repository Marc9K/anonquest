"use client";

import { useRef, useState } from "react";
import {
  Button,
  ButtonGroup,
  Fieldset,
  HStack,
  IconButton,
  Menu,
  Portal,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import CreateQuestionCard from "./CreateQuestionCard";
import FieldInput from "@/components/FieldInput";
import FieldTextArea from "@/components/FieldTextArea";
import Survey from "@/model/Survey";
import { auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis, snapCenterToCursor } from "@dnd-kit/modifiers";
import { useConstrainedSensors } from "./useConstrainedSensors";
import { LuChevronDown } from "react-icons/lu";
import { Tooltip } from "@/components/ui/tooltip";
import { QuestionPrefilled } from "@/model/Question";
import Answer from "@/model/Answer";

const getPrefilledOptions = (questionType: QuestionPrefilled): string[] => {
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
      return [
        "Afghanistan",
        "Albania",
        "Algeria",
        "Andorra",
        "Angola",
        "Antigua and Barbuda",
        "Argentina",
        "Armenia",
        "Australia",
        "Austria",
        "Azerbaijan",
        "Bahamas (The)",
        "Bahrain",
        "Bangladesh",
        "Barbados",
        "Belarus",
        "Belgium",
        "Belize",
        "Benin",
        "Bhutan",
        "Bolivia (Plurinational State of)",
        "Bosnia and Herzegovina",
        "Botswana",
        "Brazil",
        "Brunei Darussalam",
        "Bulgaria",
        "Burkina Faso",
        "Burundi",
        "Cabo Verde",
        "Cambodia",
        "Cameroon",
        "Canada",
        "Central African Republic",
        "Chad",
        "Chile",
        "China",
        "Colombia",
        "Comoros",
        "Congo",
        "Costa Rica",
        "Côte D'Ivoire",
        "Croatia",
        "Cuba",
        "Cyprus",
        "Czechia",
        "Democratic People's Republic of Korea",
        "Democratic Republic of the Congo",
        "Denmark",
        "Djibouti",
        "Dominica",
        "Dominican Republic",
        "Ecuador",
        "Egypt",
        "El Salvador",
        "Equatorial Guinea",
        "Eritrea",
        "Estonia",
        "Eswatini",
        "Ethiopia",
        "Fiji",
        "Finland",
        "France",
        "Gabon",
        "Gambia (Republic of The)",
        "Georgia",
        "Germany",
        "Ghana",
        "Greece",
        "Grenada",
        "Guatemala",
        "Guinea",
        "Guinea Bissau",
        "Guyana",
        "Haiti",
        "Honduras",
        "Hungary",
        "Iceland",
        "India",
        "Indonesia",
        "Iran (Islamic Republic of)",
        "Iraq",
        "Ireland",
        "Israel",
        "Italy",
        "Jamaica",
        "Japan",
        "Jordan",
        "Kazakhstan",
        "Kenya",
        "Kiribati",
        "Kuwait",
        "Kyrgyzstan",
        "Lao People’s Democratic Republic",
        "Latvia",
        "Lebanon",
        "Lesotho",
        "Liberia",
        "Libya",
        "Liechtenstein",
        "Lithuania",
        "Luxembourg",
        "Madagascar",
        "Malawi",
        "Malaysia",
        "Maldives",
        "Mali",
        "Malta",
        "Marshall Islands",
        "Mauritania",
        "Mauritius",
        "Mexico",
        "Micronesia (Federated States of)",
        "Monaco",
        "Mongolia",
        "Montenegro",
        "Morocco",
        "Mozambique",
        "Myanmar",
        "Namibia",
        "Nauru",
        "Nepal",
        "Netherlands (Kingdom of the)",
        "New Zealand",
        "Nicaragua",
        "Niger",
        "Nigeria",
        "North Macedonia",
        "Norway",
        "Oman",
        "Pakistan",
        "Palau",
        "Panama",
        "Papua New Guinea",
        "Paraguay",
        "Peru",
        "Philippines",
        "Poland",
        "Portugal",
        "Qatar",
        "Republic of Korea",
        "Republic of Moldova",
        "Romania",
        "Russian Federation",
        "Rwanda",
        "Saint Kitts and Nevis",
        "Saint Lucia",
        "Saint Vincent and the Grenadines",
        "Samoa",
        "San Marino",
        "Sao Tome and Principe",
        "Saudi Arabia",
        "Senegal",
        "Serbia",
        "Seychelles",
        "Sierra Leone",
        "Singapore",
        "Slovakia",
        "Slovenia",
        "Solomon Islands",
        "Somalia",
        "South Africa",
        "South Sudan",
        "Spain",
        "Sri Lanka",
        "Sudan",
        "Suriname",
        "Sweden",
        "Switzerland",
        "Syrian Arab Republic",
        "Tajikistan",
        "Thailand",
        "Timor-Leste",
        "Togo",
        "Tonga",
        "Trinidad and Tobago",
        "Tunisia",
        "Türkiye",
        "Turkmenistan",
        "Tuvalu",
        "Uganda",
        "Ukraine",
        "United Arab Emirates",
        "United Kingdom of Great Britain and Northern Ireland",
        "United Republic of Tanzania",
        "United States of America",
        "Uruguay",
        "Uzbekistan",
        "Vanuatu",
        "Venezuela, Bolivarian Republic of",
        "Viet Nam",
        "Yemen",
        "Zambia",
        "Zimbabwe",
      ];

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

export default function CreateSurvey({ existing }: { existing?: Survey }) {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [survey, setSurvey] = useState(
    existing ?? new Survey(undefined, user?.email)
  );
  const [isDragging, setIsDragging] = useState(false);

  const get = (name: string) => {
    if (!formRef.current) return "";
    const formData = new FormData(formRef.current);
    return formData.get(name)?.toString() || "";
  };

  async function deleteSurvey() {
    if (!process.env.NEXT_PUBLIC_IS_TEST) {
      if (!confirm("Are you sure you want to delete this survey?")) return;
    }
    await survey.delete();
    router.push("/yours");
  }

  const sensors = useConstrainedSensors();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setIsDragging(false);

    if (over && active.id !== over.id) {
      setSurvey((prev) => {
        const oldIndex =
          prev.questions?.findIndex((q) => q.title === active.id) ?? -1;
        const newIndex =
          prev.questions?.findIndex((q) => q.title === over.id) ?? -1;

        if (oldIndex === -1 || newIndex === -1) return prev;

        const newQuestions = [...(prev.questions ?? [])];
        const [movedQuestion] = newQuestions.splice(oldIndex, 1);
        newQuestions.splice(newIndex, 0, movedQuestion);

        newQuestions.forEach((q, index) => {
          q.orderIndex = index;
        });

        const newSurvey = prev.copy;
        newSurvey.questions = newQuestions;
        return newSurvey;
      });
    }
  };

  const addQuestion = () => {
    setSurvey((prev) => {
      const newSurvey = prev.addingQuestion();
      if (!newSurvey.questions) return newSurvey;
      const lastIndex = newSurvey.questions.length - 1;
      newSurvey.questions[lastIndex].orderIndex = lastIndex;
      return newSurvey;
    });
  };

  const addPrefilledQuestion = (questionType: QuestionPrefilled) => {
    const prefilledAnswers = getPrefilledOptions(questionType);

    setSurvey((prev) => {
      if (prev.questions?.some((q) => q.title === "..." + questionType))
        return prev;
      const newSurvey = prev.addingQuestion();
      if (!newSurvey.questions) return newSurvey;
      const lastIndex = newSurvey.questions.length - 1;
      const newQuestion = newSurvey.questions[lastIndex];

      newQuestion.title = "..." + questionType;
      newQuestion.orderIndex = lastIndex;
      newQuestion.answers = prefilledAnswers.map((answer, index) => {
        const answerObj = new Answer();
        answerObj.title = answer;
        answerObj.orderIndex = index;
        return answerObj;
      });

      return newSurvey;
    });
  };

  return (
    <>
      <form
        ref={formRef}
        onSubmit={async (e) => {
          e.preventDefault();
          if (formRef.current && user?.email) {
            await survey.save(new FormData(formRef.current));
          }
          router.push("/yours");
        }}
      >
        <Fieldset.Root size="lg" maxW="md">
          {survey.isLocal && <Fieldset.Legend>New survey</Fieldset.Legend>}

          <Fieldset.Content>
            <FieldInput
              label="Title"
              initialValue={existing?.title ?? get("title")}
              name="title"
              required
            />

            <FieldTextArea
              placeholder="e1@mail.co, e2@mail.co, ..."
              name="emails"
              initialValue={existing?.participants?.join(", ") ?? get("emails")}
              label="Participants' emails"
              helper="Please provide comma separated emails"
            />
            <DndContext
              onDragStart={() => setIsDragging(true)}
              onDragEnd={handleDragEnd}
              modifiers={[snapCenterToCursor, restrictToVerticalAxis]}
              sensors={sensors}
            >
              <SortableContext
                items={survey.questions?.map((q) => q.title ?? "") ?? []}
                strategy={verticalListSortingStrategy}
              >
                {survey.questions?.map((question, index) => (
                  <CreateQuestionCard
                    index={index}
                    key={question.title ?? "" + "-with-index-" + index}
                    question={question}
                    isDragging={isDragging}
                    setQuestion={(newQuestion) => {
                      if (!newQuestion) {
                        setSurvey((prev) => prev.deletingQuestion(question));
                        return;
                      }
                      newQuestion.orderIndex = index;
                      setSurvey((prev) =>
                        prev.replacingQuestion(question, newQuestion)
                      );
                    }}
                  />
                ))}
              </SortableContext>
            </DndContext>
            <Tooltip
              content={
                survey.hasVacantQuestion
                  ? "Please fill in all questions or delete empty ones"
                  : undefined
              }
            >
              <ButtonGroup attached>
                <Button
                  onClick={addQuestion}
                  disabled={survey.hasVacantQuestion}
                >
                  + Add a question
                </Button>

                <Menu.Root
                  onSelect={({ value }) => {
                    if (value && (value as QuestionPrefilled)) {
                      addPrefilledQuestion(value as QuestionPrefilled);
                    }
                  }}
                >
                  <Menu.Trigger disabled={survey.hasVacantQuestion}>
                    <IconButton
                      variant="outline"
                      disabled={survey.hasVacantQuestion}
                    >
                      <LuChevronDown />
                    </IconButton>
                  </Menu.Trigger>
                  <Portal>
                    <Menu.Positioner>
                      <Menu.Content>
                        <Menu.ItemGroup>
                          <Menu.ItemGroupLabel>about</Menu.ItemGroupLabel>
                          {Object.values(QuestionPrefilled).map((prefill) => (
                            <Menu.Item value={prefill}>{prefill}</Menu.Item>
                          ))}
                        </Menu.ItemGroup>
                      </Menu.Content>
                    </Menu.Positioner>
                  </Portal>
                </Menu.Root>
              </ButtonGroup>
            </Tooltip>
          </Fieldset.Content>
          <HStack justify="space-between">
            {!survey.isLocal && (
              <Button
                variant="subtle"
                color="red"
                alignSelf="flex-start"
                marginBottom={50}
                onClick={deleteSurvey}
              >
                Delete
              </Button>
            )}
            <Button type="submit" alignSelf="flex-start" marginBottom={50}>
              {survey.isLocal ? "Save" : "Update"}
            </Button>
          </HStack>
        </Fieldset.Root>
      </form>
    </>
  );
}
