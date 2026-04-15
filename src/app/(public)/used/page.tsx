import { redirect } from "next/navigation";

export default function UsedPage() {
  redirect("/list?type=USED_LEASE");
}
