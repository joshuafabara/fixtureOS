import { PageStub } from "@/components/shared/page-stub";
import { Edit } from "lucide-react";
export default function ManualEditPage() {
  return <PageStub title="Edición Manual" description="Arrastra y suelta partidos para reprogramarlos. Los cambios generan un dry run antes de confirmarse." Icon={Edit} />;
}
