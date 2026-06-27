import { GenericToolDetail } from "../GenericToolDetail";
import {
  BioNameBankTool,
  AdminGeneratedTool,
  AffiliateGuideTool,
  CaptionHashtagTool,
  ClosingScriptTool,
  CommentTextTool,
  CreatorNotesTool,
  DailyContentIdeaTool,
  HookIdeaTool,
  PhotoFootageTool,
  PhotoVideoTextTool,
  PromotionScriptTool,
  RecipeTextTool,
  ReferenceAccountTool,
  TrendingMusicTool,
  TutorialTextTool,
  UploadGuideTool,
  VideoFootageTool,
} from "./CustomToolPages";

const adminGeneratedSlugs = new Set([
  "ide-teks-tutorial",
  "ide-teks-resep-masakan",
  "ide-caption-hashtag",
  "ide-teks-komentar",
  "script-promosi-buatcuan",
  "script-closing-dm-wa",
  "ide-konten-harian",
  "bank-bio-nama-akun",
]);

export const ToolDetail = ({ slug }: { slug: string }) => {
  if (slug === "catatan-kreator") return <CreatorNotesTool slug={slug} />;
  if (slug === "panduan-upload") return <UploadGuideTool slug={slug} />;
  if (slug === "video-footage") return <VideoFootageTool slug={slug} />;
  if (slug === "foto-footage") return <PhotoFootageTool slug={slug} />;
  if (slug === "ide-hook") return <HookIdeaTool slug={slug} />;
  if (slug === "ide-teks-foto-video") return <PhotoVideoTextTool slug={slug} />;
  if (adminGeneratedSlugs.has(slug)) return <AdminGeneratedTool slug={slug} />;
  if (slug === "ide-teks-tutorial") return <TutorialTextTool slug={slug} />;
  if (slug === "ide-teks-resep-masakan") return <RecipeTextTool slug={slug} />;
  if (slug === "ide-caption-hashtag") return <CaptionHashtagTool slug={slug} />;
  if (slug === "ide-teks-komentar") return <CommentTextTool slug={slug} />;
  if (slug === "ide-sound-musik-trending") return <TrendingMusicTool slug={slug} />;
  if (slug === "script-promosi-buatcuan") return <PromotionScriptTool slug={slug} />;
  if (slug === "script-closing-dm-wa") return <ClosingScriptTool slug={slug} />;
  if (slug === "ide-konten-harian") return <DailyContentIdeaTool slug={slug} />;
  if (slug === "bank-bio-nama-akun") return <BioNameBankTool slug={slug} />;
  if (slug === "inspirasi-akun-referensi") return <ReferenceAccountTool slug={slug} />;
  if (slug === "panduan-affiliate-lengkap") return <AffiliateGuideTool slug={slug} />;

  return <GenericToolDetail slug={slug} />;
};
