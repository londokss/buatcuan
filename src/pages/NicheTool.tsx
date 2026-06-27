import { Link } from "react-router-dom";
import { NicheToolFlow } from "@/features/niche-tool/NicheToolFlow";

// Default on, can be disabled without a code change by setting VITE_NICHE_TOOL_V1=false.
const ENABLE_NICHE_TOOL_V1 = import.meta.env.VITE_NICHE_TOOL_V1 !== "false";

const NicheTool = () => {
  if (!ENABLE_NICHE_TOOL_V1) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-extrabold">Alat Penentuan Niche</h1>
        <p className="rounded-2xl bg-secondary/70 p-4 text-sm text-muted-foreground">
          Fitur ini belum aktif. <Link to="/app/tools" className="font-extrabold text-primary">Kembali ke Alat Bantu</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-muted-foreground">Alat Bantu</p>
        <h1 className="text-2xl font-extrabold leading-tight">Penentuan Niche</h1>
      </div>
      <NicheToolFlow />
    </div>
  );
};

export default NicheTool;
