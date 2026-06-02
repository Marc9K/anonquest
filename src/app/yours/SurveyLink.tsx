"use client";

import Link from "next/link";
import {
  Button,
  Card,
  Link as ChakraLink,
  HStack,
  Text,
} from "@chakra-ui/react";
import { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { FirestoreSurvey } from "@/interfaces/firestore";
import { SurveyStatus } from "@/model/SurveyStatus";
import { IoStop } from "react-icons/io5";
import { CiEdit } from "react-icons/ci";
import { AiOutlineEye } from "react-icons/ai";
import Survey from "@/model/Survey";
import { FaPlay, FaCopy } from "react-icons/fa";
import { writeBatch, doc, collection } from "firebase/firestore";
import { db } from "@/app/firebase";
import { useRouter } from "next/navigation";

export default function SurveyLink({
  doc: surveyDoc,
  admin = false,
  userEmail,
  ...args
}: {
  doc: QueryDocumentSnapshot<DocumentData, DocumentData>;
  admin?: boolean;
  userEmail?: string;
}) {
  const data = surveyDoc.data() as FirestoreSurvey;
  const router = useRouter();

  const publish = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const survey = new Survey(surveyDoc.id);
    await survey.start();
    router.refresh();
  };

  const refuse = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!userEmail) return;
    const batch = writeBatch(db);
    batch.delete(doc(db, "participants", userEmail, "surveys", surveyDoc.id));
    batch.delete(
      doc(collection(surveyDoc.ref, "participants"), userEmail)
    );
    await batch.commit();
    router.refresh();
  };

  const copyAndNavigate = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!userEmail) return;
    const original = new Survey(surveyDoc.id);
    await original.load();
    const copied = Survey.createCopy(original, userEmail);
    const formData = new FormData();
    formData.set("title", copied.title ?? "");
    formData.set("emails", "");
    await copied.save(formData);
    if (copied.id) router.push(`/survey/${copied.id}`);
  };

  return (
    <ChakraLink asChild {...args} padding={3} width="100%" display="block">
      <Link href={`/survey/${surveyDoc.id}`}>
        <Card.Root>
          <Card.Title margin={3}>{data.title}</Card.Title>
          <Card.Body>
            {admin ? (
              <HStack>
                {data.status === SurveyStatus.PENDING && (
                  <>
                    <Button direction="row">
                      <Text>edit</Text>
                      <CiEdit />
                    </Button>
                    <Button color="green" variant="outline" onClick={publish}>
                      <FaPlay />
                      <Text>Publish</Text>
                    </Button>
                  </>
                )}
                {data.status === SurveyStatus.ACTIVE && (
                  <Button direction="row">
                    <Text>Manage</Text>
                    <IoStop />
                  </Button>
                )}
                {data.status === SurveyStatus.CLOSED && (
                  <HStack>
                    <Button direction="row">
                      <Text>View results</Text>
                      <AiOutlineEye />
                    </Button>
                    <Button variant="outline" onClick={copyAndNavigate}>
                      <FaCopy />
                      <Text>Copy</Text>
                    </Button>
                  </HStack>
                )}
              </HStack>
            ) : (
              <Button variant="outline" onClick={refuse}>
                Refuse
              </Button>
            )}
          </Card.Body>
          {!admin && <Card.Footer>By {data.ownerEmail}</Card.Footer>}
        </Card.Root>
      </Link>
    </ChakraLink>
  );
}
