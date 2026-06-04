import { redirect } from "next/navigation";

// Route default "/" langsung diarahkan ke halaman login
export default function RootPage() {
  redirect("/login");
}
