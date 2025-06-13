import { FirestoreSurvey } from "@/interfaces/firestore";
import { SurveyStatus } from "../src/model/SurveyStatus";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestContext,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import firebase from "firebase/compat/app";
import {
  arrayRemove,
  arrayUnion,
  deleteDoc,
  getDoc,
  getDocs,
  increment,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import * as fs from "fs";
import { get } from "http";
import { title } from "process";
import Survey from "../src/model/Survey";
import Question from "../src/model/Question";
import Answer from "../src/model/Answer";

let testEnv: RulesTestEnvironment | null = null;
let creatorContext: RulesTestContext | null = null;
let participantContext: RulesTestContext | null = null;
let creatorFirestore: firebase.firestore.Firestore | null = null;

const creator = {
  id: "test_creator_id",
  options: {
    email: "creator@test.net",
    email_verified: true,
  },
};

const participant = {
  id: "test_participant_id",
  options: {
    email: "participant@test.net",
    email_verified: true,
  },
};

const testSurveyObj = new Survey();
testSurveyObj.title = "Test title";
testSurveyObj.description = "Test description";
testSurveyObj.ownerEmail = creator.options.email;

for (let index = 0; index < 3; index++) {
  const question = new Question();
  question.title = "Test question " + index;
  for (let indexA = 0; indexA < 2; indexA++) {
    const answer = new Answer();
    answer.title = "Test answer " + indexA;
    question.answers.push(answer);
  }
  testSurveyObj.questions?.push(question);
}

const testSurvey: FirestoreSurvey = {
  ownerEmail: creator.options.email,
  title: "test title",
  status: SurveyStatus.PENDING,
  description: "test description",
};

// afterEach(async () => {
//   try {
//     await testEnv?.cleanup();
//   } catch (error) {
//     console.log(error);
//   }
// });

afterAll(async () => {
  try {
    await testEnv?.clearFirestore();
  } catch (error) {
    console.log(error);
  }
});

beforeAll(async () => {
  const MY_PROJECT_ID = "anonquest-c3f3b";

  testEnv = await initializeTestEnvironment({
    projectId: MY_PROJECT_ID,
    firestore: {
      host: "127.0.0.1",
      port: 8080,
      rules: fs.readFileSync("firestore.rules", "utf8"),
    },
  });

  creatorContext = testEnv.authenticatedContext(creator.id, creator.options);
  participantContext = testEnv.authenticatedContext(
    participant.id,
    participant.options
  );

  creatorFirestore = creatorContext.firestore();
});

function surveyRef(id: string, firestore = creatorFirestore) {
  return firestore!.collection(Survey.fireCollection).doc(id);
}

async function createSurvey(id: string, data: any) {
  await testEnv?.withSecurityRulesDisabled(async (context) => {
    const survey = surveyRef(id, context.firestore());
    console.log(data);
    await setDoc(survey, data);
    await setDoc(
      survey.collection("participants").doc(participant.options.email),
      {}
    );
  });
}

async function addQuestion(surveyId: string, questionId: string, data: any) {
  await testEnv?.withSecurityRulesDisabled(async (context) => {
    const survey = surveyRef(surveyId, context.firestore());
    await setDoc(
      survey.collection(Question.fireCollection).doc(questionId),
      data
    );
  });
}

async function addAnswer(
  surveyId: string,
  questionId: string,
  info: { id: string; data: any }
) {
  await testEnv?.withSecurityRulesDisabled(async (context) => {
    const survey = surveyRef(surveyId, context.firestore());
    await updateDoc(
      survey.collection(Question.fireCollection).doc(questionId),
      {
        answers: arrayUnion(info.id),
      }
    );
    await setDoc(
      survey
        .collection(Question.fireCollection)
        .doc(questionId)
        .collection(Answer.fireCollection)
        .doc(info.id),
      info.data
    );
  });
}

async function deleteSurvey(id: string) {
  await testEnv?.withSecurityRulesDisabled(async (context) => {
    await surveyRef(id, context.firestore()).delete();
  });
}

function surveys(firestore: RulesTestContext | null) {
  return firestore!.firestore().collection("surveys");
}

// create, read, update, delete
// test.skip("", async () => {});

describe("when creating a survey", () => {
  test("any authed can", async () => {
    await assertSucceeds(setDoc(surveyRef(crypto.randomUUID()), testSurvey));
  });
  test("only with their email", async () => {
    await assertFails(
      setDoc(surveyRef(crypto.randomUUID()), {
        ...testSurvey,
        ownerEmail: "different@mail.com",
      })
    );
  });
});

describe("in general", () => {
  describe("cannot", () => {
    describe("read", () => {
      test("survey's where you are not the owner nor participant", async () => {
        const id = crypto.randomUUID();
        await createSurvey(id, { ...testSurvey, ownerEmail: "different" });

        await assertFails(getDoc(surveyRef(id)));
      });
    });
  });
});

describe("when editing a survey", () => {
  describe("owner", () => {
    describe("can", () => {
      describe("read their survey", () => {
        test("survey", async () => {
          const id = crypto.randomUUID();
          await createSurvey(id, testSurvey);

          await assertSucceeds(getDoc(surveyRef(id)));
        });
      });

      test("update their survey", async () => {
        const id = crypto.randomUUID();
        await createSurvey(id, testSurvey);
        await assertSucceeds(
          updateDoc(surveyRef(id), {
            title: "updated",
            description: "writing description",
            status: SurveyStatus.ACTIVE,
            ownerEmail: "different",
          })
        );
      });

      test("delete their survey", async () => {
        const id = crypto.randomUUID();
        await createSurvey(id, testSurvey);
        await assertSucceeds(surveyRef(id).delete());
      });
      test("add questions", async () => {
        const id = crypto.randomUUID();
        await createSurvey(id, testSurveyObj.firestore.data);
        await assertSucceeds(
          setDoc(
            surveyRef(id).collection("questions").doc("new_question"),
            testSurveyObj.questions?.[0].firestore.data
          )
        );
      });
      test("update questions", async () => {
        const id = crypto.randomUUID();
        await createSurvey(id, testSurveyObj.firestore.data);
        const questionId = crypto.randomUUID();
        await addQuestion(
          id,
          questionId,
          testSurveyObj.questions?.[0].firestore.data
        );
        await assertSucceeds(
          updateDoc(
            surveyRef(id).collection(Question.fireCollection).doc(questionId),
            testSurveyObj.questions![1].firestore.data
          )
        );
      });
      test("delete a question", async () => {
        const id = crypto.randomUUID();
        await createSurvey(id, testSurveyObj.firestore.data);
        const questionId = crypto.randomUUID();
        await addQuestion(
          id,
          questionId,
          testSurveyObj.questions?.[0].firestore.data
        );
        await assertSucceeds(
          surveyRef(id)
            .collection(Question.fireCollection)
            .doc(questionId)
            .delete()
        );
      });
      test("add answer", async () => {
        const id = crypto.randomUUID();
        await createSurvey(id, testSurvey);
        const questionId = crypto.randomUUID();
        await addQuestion(
          id,
          questionId,
          testSurveyObj.questions?.[0].firestore.data
        );
        await assertSucceeds(
          setDoc(
            surveyRef(id)
              .collection(Question.fireCollection)
              .doc(questionId)
              .collection(Answer.fireCollection)
              .doc("new_answer"),
            testSurveyObj.questions![0].answers[0].firestore.data
          )
        );
        await assertSucceeds(
          updateDoc(
            surveyRef(id).collection(Question.fireCollection).doc(questionId),
            {
              answers: arrayUnion(
                testSurveyObj.questions![0].answers[1].firestore.id
              ),
            }
          )
        );
      });
      test("delete answer", async () => {
        const id = crypto.randomUUID();
        await createSurvey(id, testSurvey);
        const questionId = crypto.randomUUID();
        await addQuestion(
          id,
          questionId,
          testSurveyObj.questions?.[0].firestore.data
        );
        await addAnswer(
          id,
          questionId,
          testSurveyObj.questions![0].answers[0].firestore
        );
        await assertSucceeds(
          surveyRef(id)
            .collection(Question.fireCollection)
            .doc(questionId)
            .collection(Answer.fireCollection)
            .doc(testSurveyObj.questions![0].answers[0].firestore.id)
            .delete()
        );
        await assertSucceeds(
          updateDoc(
            surveyRef(id).collection(Question.fireCollection).doc(questionId),
            {
              answers: arrayRemove(
                testSurveyObj.questions![0].answers[0].firestore.id
              ),
            }
          )
        );
      });
      test("start the survey (set active)", async () => {
        const id = crypto.randomUUID();
        await createSurvey(id, testSurvey);
        await assertSucceeds(
          updateDoc(surveyRef(id), {
            status: SurveyStatus.ACTIVE,
          })
        );
      });
    });
    describe("cannot", () => {
      test("set answer count to anything but 0", async () => {
        const id = crypto.randomUUID();
        await createSurvey(id, testSurvey);
        const questionId = crypto.randomUUID();
        await addQuestion(
          id,
          questionId,
          testSurveyObj.questions?.[0].firestore.data
        );
        [-5, -1, 1, 5].forEach(async (number) => {
          await assertFails(
            setDoc(
              surveyRef(id)
                .collection(Question.fireCollection)
                .doc(questionId)
                .collection(Answer.fireCollection)
                .doc("new_answer"),
              {
                ...testSurveyObj.questions![0].answers[0].firestore.data,
                count: number,
              }
            )
          );
        });
        await addAnswer(
          id,
          questionId,
          testSurveyObj.questions![0].answers[0].firestore
        );
        [-5, -1, 1, 5].forEach(async (number) => {
          await assertFails(
            updateDoc(
              surveyRef(id)
                .collection(Question.fireCollection)
                .doc(questionId)
                .collection(Answer.fireCollection)
                .doc(testSurveyObj.questions![0].answers[0].firestore.id),
              {
                count: number,
              }
            )
          );
        });
      });
      test("close the survey", async () => {
        const id = crypto.randomUUID();
        await createSurvey(id, testSurvey);
        await assertFails(
          updateDoc(surveyRef(id), {
            status: SurveyStatus.CLOSED,
          })
        );
      });
    });
  });
  test("participant cannot read it yet", async () => {
    const id = crypto.randomUUID();
    await createSurvey(id, { ...testSurvey });

    await assertFails(getDoc(surveyRef(id, participantContext!.firestore())));
  });
});

describe("when running a survey", () => {
  describe("owner", () => {
    describe("can", () => {
      describe("update their survey", () => {
        test("to add participants to active survey", async () => {
          const id = crypto.randomUUID();
          await createSurvey(id, {
            ...testSurvey,
            status: SurveyStatus.ACTIVE,
          });
          await assertSucceeds(
            setDoc(
              surveyRef(id).collection("participants").doc("added_participant"),
              {}
            )
          );
        });
      });
      test("close the survey", async () => {
        const id = crypto.randomUUID();
        await createSurvey(id, {
          ...testSurvey,
          status: SurveyStatus.ACTIVE,
        });
        await assertSucceeds(
          updateDoc(surveyRef(id), {
            status: SurveyStatus.CLOSED,
          })
        );
      });
      test("read the survey", async () => {
        const id = crypto.randomUUID();
        await createSurvey(id, {
          ...testSurvey,
          status: SurveyStatus.ACTIVE,
        });
        await assertSucceeds(getDoc(surveyRef(id)));
      });
      test("read questions", async () => {
        const id = crypto.randomUUID();
        await createSurvey(id, {
          ...testSurvey,
          status: SurveyStatus.ACTIVE,
        });
        await assertSucceeds(getDocs(surveyRef(id).collection("questions")));
      });
    });
    describe("cannot", () => {
      describe("read", () => {
        test("participants", async () => {
          const id = crypto.randomUUID();
          await createSurvey(id, {
            ...testSurvey,
            status: SurveyStatus.ACTIVE,
          });

          await assertFails(getDocs(surveyRef(id).collection("participants")));
        });
        test("answers", async () => {
          const id = crypto.randomUUID();
          await createSurvey(id, {
            ...testSurvey,
            status: SurveyStatus.ACTIVE,
          });
          await assertFails(
            getDocs(
              surveyRef(id)
                .collection("questions")
                .doc(crypto.randomUUID())
                .collection("answers")
            )
          );
        });
      });
      test("write to the survey", async () => {
        const id = crypto.randomUUID();
        await createSurvey(id, {
          ...testSurvey,
          status: SurveyStatus.ACTIVE,
        });
        await assertFails(
          setDoc(surveyRef(id), {
            participants: [
              participant.options.email,
              participant.options.email,
              participant.options.email,
            ],
            status: SurveyStatus.CLOSED,
            description: "writing description",
          })
        );
      });
      test("update the survey", async () => {
        const id = crypto.randomUUID();
        await createSurvey(id, {
          ...testSurvey,
          status: SurveyStatus.ACTIVE,
        });
        await assertFails(
          setDoc(surveyRef(id), {
            participants: [
              participant.options.email,
              participant.options.email,
              participant.options.email,
            ],
            status: SurveyStatus.CLOSED,
            description: "writing description",
          })
        );
      });
    });
  });
  describe("participant", () => {
    describe("can", () => {
      test("read questions", async () => {
        const id = crypto.randomUUID();
        await createSurvey(id, {
          ...testSurvey,
          status: SurveyStatus.ACTIVE,
        });
        await assertSucceeds(getDocs(surveyRef(id).collection("questions")));
      });
      test("update answers to questions by +1", async () => {
        const id = crypto.randomUUID();
        await createSurvey(id, {
          ...testSurvey,
          status: SurveyStatus.ACTIVE,
        });
        await assertFails(
          updateDoc(
            surveyRef(id)
              .collection("questions")
              .doc("any")
              .collection("answers")
              .doc("any"),
            {
              count: increment(1),
            }
          )
        );
      });
      test("read assigned to them active surveys", async () => {
        const id = crypto.randomUUID();
        await createSurvey(id, { ...testSurvey, status: SurveyStatus.ACTIVE });
        await assertSucceeds(
          getDoc(surveyRef(id, participantContext!.firestore()))
        );
      });
      test("update themselves out of participants", async () => {
        const id = crypto.randomUUID();
        await createSurvey(id, { ...testSurvey, status: SurveyStatus.ACTIVE });
        await assertSucceeds(
          surveyRef(id, participantContext!.firestore())
            .collection("participants")
            .doc(participant.options.email)
            .delete()
        );
      });
    });
    describe("cannot", () => {
      describe("read", () => {
        test("participants", async () => {
          const id = crypto.randomUUID();
          await createSurvey(id, {
            ...testSurvey,
            status: SurveyStatus.ACTIVE,
          });

          await assertFails(getDocs(surveyRef(id).collection("participants")));
        });
        test("answers", async () => {
          const id = crypto.randomUUID();
          await createSurvey(id, {
            ...testSurvey,
            status: SurveyStatus.ACTIVE,
          });
          await assertFails(
            getDocs(
              surveyRef(id)
                .collection("questions")
                .doc(crypto.randomUUID())
                .collection("answers")
            )
          );
        });
      });
      describe("update answers", () => {
        test("by +2", async () => {
          const id = crypto.randomUUID();
          await createSurvey(id, {
            ...testSurvey,
            status: SurveyStatus.ACTIVE,
          });
          await assertFails(
            updateDoc(
              surveyRef(id)
                .collection("questions")
                .doc("any")
                .collection("answers")
                .doc("any"),
              {
                count: increment(2),
              }
            )
          );
        });
        test("by -1", async () => {
          const id = crypto.randomUUID();
          await createSurvey(id, {
            ...testSurvey,
            status: SurveyStatus.ACTIVE,
          });
          await assertFails(
            updateDoc(
              surveyRef(id)
                .collection("questions")
                .doc("any")
                .collection("answers")
                .doc("any"),
              {
                count: increment(-1),
              }
            )
          );
        });
      });
    });
  });
});

describe("when survey has completed", () => {
  describe("owner", () => {
    describe("can", () => {
      test("read the survey", async () => {
        const id = crypto.randomUUID();
        await createSurvey(id, {
          ...testSurvey,
          status: SurveyStatus.CLOSED,
        });

        await assertSucceeds(getDoc(surveyRef(id)));
      });
      test("delete the survey", async () => {
        const id = crypto.randomUUID();
        await createSurvey(id, {
          ...testSurvey,
          status: SurveyStatus.CLOSED,
        });
        await assertSucceeds(surveyRef(id).delete());
      });
      test("read the questions", async () => {
        const id = crypto.randomUUID();
        await createSurvey(id, {
          ...testSurvey,
          status: SurveyStatus.CLOSED,
        });
        await assertSucceeds(getDocs(surveyRef(id).collection("questions")));
      });
      test("read the answers", async () => {
        const id = crypto.randomUUID();
        await createSurvey(id, {
          ...testSurvey,
          status: SurveyStatus.CLOSED,
        });
        await assertSucceeds(
          getDocs(
            surveyRef(id)
              .collection("questions")
              .doc(crypto.randomUUID())
              .collection("answers")
          )
        );
      });
    });
    describe("cannot", () => {
      test("write to it", async () => {
        const id = crypto.randomUUID();
        await createSurvey(id, {
          ...testSurvey,
          status: SurveyStatus.CLOSED,
        });
        await assertFails(
          setDoc(surveyRef(id), {
            participants: [
              participant.options.email,
              participant.options.email,
              participant.options.email,
            ],
            status: SurveyStatus.CLOSED,
            description: "writing description",
          })
        );
      });
      test("update the survey", async () => {
        const id = crypto.randomUUID();
        await createSurvey(id, {
          ...testSurvey,
          status: SurveyStatus.CLOSED,
        });
        await assertFails(
          updateDoc(surveyRef(id), {
            title: "new title",
          })
        );
      });
      test("update the questions", async () => {
        const id = crypto.randomUUID();
        await createSurvey(id, {
          ...testSurvey,
          status: SurveyStatus.CLOSED,
        });
        await assertFails(
          updateDoc(
            surveyRef(id).collection("questions").doc(crypto.randomUUID()),
            {
              title: "new title",
            }
          )
        );
      });
      test("set the questions", async () => {
        const id = crypto.randomUUID();
        await createSurvey(id, {
          ...testSurvey,
          status: SurveyStatus.CLOSED,
        });
        await assertFails(
          setDoc(
            surveyRef(id).collection("questions").doc(crypto.randomUUID()),
            {
              title: "new title",
            }
          )
        );
      });
      test("update the answers", async () => {
        const id = crypto.randomUUID();
        await createSurvey(id, {
          ...testSurvey,
          status: SurveyStatus.CLOSED,
        });
        await assertFails(
          updateDoc(
            surveyRef(id)
              .collection("questions")
              .doc("any")
              .collection("answers")
              .doc("any"),
            {
              count: increment(1),
            }
          )
        );
      });
      test("set the answers", async () => {
        const id = crypto.randomUUID();
        await createSurvey(id, {
          ...testSurvey,
          status: SurveyStatus.CLOSED,
        });
        await assertFails(
          setDoc(
            surveyRef(id)
              .collection("questions")
              .doc("any")
              .collection("answers")
              .doc("any"),
            {
              count: 0,
            }
          )
        );
      });
    });
  });
  describe("participant", () => {
    describe("cannot", () => {
      test("read the survey", async () => {
        const id = crypto.randomUUID();
        await createSurvey(id, {
          ...testSurvey,
          status: SurveyStatus.CLOSED,
        });

        await assertFails(
          getDoc(surveyRef(id, participantContext!.firestore()))
        );
      });
      test("read the questions", async () => {
        const id = crypto.randomUUID();
        await createSurvey(id, {
          ...testSurvey,
          status: SurveyStatus.CLOSED,
        });
        await assertFails(
          getDocs(
            surveyRef(id, participantContext!.firestore()).collection(
              "questions"
            )
          )
        );
      });
      test("read the answers", async () => {
        const id = crypto.randomUUID();
        await createSurvey(id, {
          ...testSurvey,
          status: SurveyStatus.CLOSED,
        });
        await assertFails(
          getDocs(
            surveyRef(id, participantContext!.firestore())
              .collection("questions")
              .doc(crypto.randomUUID())
              .collection("answers")
          )
        );
      });
      test("update the answers", async () => {
        const id = crypto.randomUUID();
        await createSurvey(id, {
          ...testSurvey,
          status: SurveyStatus.CLOSED,
        });
        await assertFails(
          updateDoc(
            surveyRef(id)
              .collection("questions")
              .doc("any")
              .collection("answers")
              .doc("any"),
            {
              count: increment(1),
            }
          )
        );
      });
    });
  });
});
