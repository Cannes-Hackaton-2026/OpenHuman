import { redirect } from "next/navigation";

export default function ClientRegisterPage() {
  // Registration is unified — one flow for everyone
  redirect("/register");
}
