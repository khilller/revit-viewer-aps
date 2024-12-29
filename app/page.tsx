import { Suspense } from "react";
import MainUI from "@/components/MainUI";

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MainUI />
    </Suspense>
  );
}
