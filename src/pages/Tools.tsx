import { useParams } from "react-router-dom";
import { ToolList } from "@/features/tools/ToolList";
import { ToolDetail } from "@/features/tools/custom/CustomToolDetail";

const Tools = () => {
  const { slug } = useParams();
  return slug ? <ToolDetail slug={slug} /> : <ToolList />;
};

export default Tools;
