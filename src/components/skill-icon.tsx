import { MessageSquare, Ruler, MessageCircleQuestion, RefreshCw, CheckCircle2, Users, Scale, Drama, Lightbulb, Columns3, GraduationCap, PenLine, Mail, FileText, Pickaxe, Wrench, Paperclip, FileType, Camera, ScanText, Monitor, Languages, Link, Mic, AudioLines, Globe, Telescope, Cable, Workflow, Clock, Bot, FolderCog, Puzzle, Hammer, Image, Wand2, LayoutTemplate, BarChart3, GitBranch, Palette, Download, Calendar, QrCode, Folders, ClipboardList, Tag, Brain, SlidersHorizontal, Zap, ListChecks, Award, type LucideIcon } from "lucide-react";

/** One icon per skill. Icons, not emojis: the whole product uses this set. */
const ICONS: Record<string, LucideIcon> = {
  chat: MessageSquare, constraints: Ruler, interviewing: MessageCircleQuestion, iteration: RefreshCw, verification: CheckCircle2, audience: Users, steelman: Scale, roleplay: Drama, brainstorming: Lightbulb, comparisons: Columns3, tutoring: GraduationCap, "style-training": PenLine, drafting: Mail, summarizing: FileText, extraction: Pickaxe, "tool-choice": Wrench,
  "file-upload": Paperclip, pdf: FileType, camera: Camera, ocr: ScanText, screenshot: Monitor, translation: Languages, "url-reading": Link, dictation: Mic, "voice-chat": AudioLines,
  "web-search": Globe, "deep-research": Telescope, connectors: Cable, cowork: Workflow, automations: Clock, "browser-agent": Bot, "computer-files": FolderCog, extension: Puzzle, "agent-building": Hammer,
  "image-gen": Image, "image-edit": Wand2, artifacts: LayoutTemplate, charts: BarChart3, diagrams: GitBranch, design: Palette, "file-export": Download, ics: Calendar, qr: QrCode,
  projects: Folders, "custom-instructions": ClipboardList, personalization: Tag, memory: Brain, "model-choice": SlidersHorizontal, skills: Zap, "ask-user": ListChecks,
};

export function SkillIcon({ id, size = 14, className }: { id: string; size?: number; className?: string }) {
  const I = ICONS[id] ?? Award;
  return <I size={size} className={className} aria-hidden />;
}
