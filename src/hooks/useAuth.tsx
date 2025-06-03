import { auth } from "@/app/firebase";
import { useAuthState } from "react-firebase-hooks/auth";

export default function useAuth() {
  // if (process.env.NEXT_PUBLIC_IS_TEST === "true") {
  //   return [
  //     { email: "test@example.com", displayName: "Test Name" },
  //     null,
  //     null,
  //   ];
  // } else {
  const [user, loading, error] = useAuthState(auth);
  return [user, loading, error];
  //   }
}
