import type { Metadata } from "next";
import Login from "../login";

export const metadata: Metadata = {
  title: "HissabBook | Login",
  description: "Login or register to access your HissabBook account.",
};

export default function LoginPage() {
  return <Login />;
}

