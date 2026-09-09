/** Shared, public lesson contracts. Assessment may never add requirements. */
export type LessonId = "shape-answers" | "better-context";
export type Surface = "claude" | "chatgpt";
export interface Exercise {
  title: string;
  instruction: string;
  criterion: string;
  concept: string;
  source?: string;
  choices?: string[];
  example?: string;
  group: string;
}
export interface Lesson {
  id: LessonId;
  title: string;
  outcome: string;
  points: number;
  techniques: string[];
  exercises: Exercise[];
}
const e = (
  title: string,
  instruction: string,
  criterion: string,
  concept: string,
  group: string,
  extra: Partial<Exercise> = {},
): Exercise => ({ title, instruction, criterion, concept, group, ...extra });
const laundry =
  "Separate light and dark clothes. Check the care label. Use the recommended amount of detergent. Select the wash cycle on the label. Remove clothes when the cycle finishes.";
export const LESSONS: Lesson[] = [
  {
    id: "shape-answers",
    title: "Make AI’s answer work for you",
    outcome:
      "You can control the length, audience, and format of an AI answer.",
    points: 60,
    techniques: ["Constraints", "Audience", "Format"],
    exercises: [
      e(
        "You control the length",
        "An answer is too long. Which request would help?",
        "Choose the instruction that asks for less detail.",
        "Length",
        "a1",
        {
          source:
            "Rain forms when water vapor cools and condenses into droplets inside clouds. These droplets collide and grow until they become heavy enough to fall to the ground. Temperature and air movement affect this process.",
          choices: [
            "Explain every part in more detail.",
            "Give me the main idea in one short sentence.",
            "Translate it into another language.",
          ],
          example:
            "Rain falls when water droplets in clouds become heavy enough.",
        },
      ),
      e(
        "Make it shorter",
        "Ask AI to shorten this explanation. Use your own words.",
        "Your request clearly asks for a shorter answer or sets a length limit.",
        "Length",
        "a2",
        {
          source:
            "A rainbow appears when sunlight passes through drops of water. The light bends, reflects inside the drops, and separates into colors. You usually see one when rain is in front of you and the sun is behind you.",
        },
      ),
      e(
        "Choose your audience",
        "Which explanation is written for someone new to the topic?",
        "Recognize the beginner-friendly explanation.",
        "Audience",
        "a3",
        {
          choices: [
            "Evaporation is a liquid-to-gas phase transition.",
            "Evaporation is when water slowly turns into an invisible gas, like a puddle drying.",
          ],
        },
      ),
      e(
        "Explain it to a child",
        "Ask AI to explain why the moon looks different during the month to a young child.",
        "Your request identifies a young child as the audience.",
        "Audience",
        "a4",
      ),
      e(
        "Choose a useful format",
        "You need to follow instructions while washing clothes. Which format is easiest to check as you go?",
        "Choose a checklist for a step-by-step task.",
        "Format",
        "a5",
        {
          choices: ["A long essay", "A checklist", "A poem"],
          example:
            "☐ Check the care label\n☐ Sort the clothes\n☐ Choose the right wash cycle",
        },
      ),
      e(
        "Give instructions a shape",
        "Ask AI to turn these laundry instructions into something you can check off as you go.",
        "Your request asks for a checklist or equivalent checkable steps.",
        "Format",
        "a6",
        { source: laundry },
      ),
      e(
        "Short and understandable",
        "Explain evaporation to someone who has never learned about it. Keep the answer short.",
        "Your request specifies both a beginner audience and brevity.",
        "Length + audience",
        "a7",
        {
          source:
            "Evaporation occurs when molecules at a liquid’s surface gain enough energy to enter the gas phase. Heat and airflow can increase its rate.",
        },
      ),
      e(
        "A compact checklist",
        "Make these laundry instructions into a short checklist.",
        "Your request combines brevity with checklist formatting.",
        "Length + format",
        "a8",
        { source: laundry },
      ),
      e(
        "Adapt the answer",
        "The person using your checklist has never done laundry. Ask AI to adapt the existing checklist for them.",
        "Your follow-up identifies the inexperienced reader and asks to adapt the existing answer.",
        "Audience + refinement",
        "a8",
      ),
      e(
        "Put the pieces together",
        "A friend who has never looked after a plant will use these notes. Get a short checklist they can follow.",
        "Your request combines a beginner audience, brevity, and a checklist using the supplied notes.",
        "Your turn",
        "a10",
        {
          source:
            "Keep the plant in bright, indirect light. Feel the top inch of soil every few days; water only when that part is dry. Let extra water drain out. Do not leave the pot standing in water.",
        },
      ),
    ],
  },
  {
    id: "better-context",
    title: "Get AI to understand what you need",
    outcome:
      "You can use questions, context, and criteria to get more useful help.",
    points: 100,
    techniques: ["Context", "Interviewing", "Refinement"],
    exercises: [
      e(
        "Why is this so generic?",
        "You asked “What should I do this weekend?” and received a generic list. What is missing?",
        "Recognize that the assistant needs relevant context.",
        "Context",
        "b1",
        {
          choices: [
            "A more expensive model is always necessary.",
            "Your interests, budget, and practical limits.",
            "A longer greeting.",
          ],
        },
      ),
      e(
        "Give it something to work with",
        "Ask for weekend ideas using the preferences below.",
        "Your request supplies at least two relevant preferences from the card.",
        "Context",
        "b2",
        {
          source:
            "You enjoy being outdoors. Your budget is $30. You have Saturday afternoon free. You will travel by public transport.",
        },
      ),
      e(
        "Let AI ask first",
        "You are not sure what details to provide. Which approach helps uncover them?",
        "Choose an interview before recommendations.",
        "Interviewing",
        "b3",
        {
          choices: [
            "Ask AI to interview you before recommending something.",
            "Ask for 100 ideas immediately.",
            "Repeat the same vague question.",
          ],
        },
      ),
      e(
        "Start the interview",
        "Ask AI to help plan a weekend activity by interviewing you one question at a time before recommending something.",
        "Your request asks for an interview, one question at a time, before suggestions.",
        "Interviewing",
        "b4",
      ),
      e(
        "Answer with context",
        "Answer the assistant’s question using this preference card. If it asks for an unspecified detail, say it is flexible.",
        "Your message supplies relevant preferences from the card, or states that an unspecified detail is flexible.",
        "Context",
        "b4",
        {
          source:
            "Outdoors; $30 budget; Saturday afternoon; public transport. Other details are flexible.",
        },
      ),
      e(
        "Add a practical limit",
        "A new detail: your friend needs step-free access. Tell AI to include this alongside the preferences already discussed.",
        "Your message adds step-free access as a requirement.",
        "Constraints",
        "b4",
      ),
      e(
        "Use what it knows",
        "Ask for activity options that use the preferences and access requirement from this conversation.",
        "Your request asks for options grounded in the accumulated context.",
        "Combine",
        "b4",
      ),
      e(
        "Choose by a rule",
        "Of those options, prioritize the one with the least travel. Ask AI to explain its choice without inventing travel times.",
        "Your follow-up narrows existing options using least travel and avoids invented travel-time certainty.",
        "Criteria",
        "b4",
      ),
      e(
        "Change one thing",
        "Now rain is forecast. Adapt the recommendation for indoors while keeping the budget and step-free access requirements.",
        "Your follow-up requests an indoor alternative and preserves budget and accessibility.",
        "Refinement",
        "b4",
      ),
      e(
        "Put the pieces together",
        "Help a beginner choose a new hobby. First have AI interview you one question at a time. Answer using the card, then ask for a recommendation that prioritizes the lowest starting cost.",
        "Across this conversation, request a one-question-at-a-time interview, answer at least one question using the card, and request a recommendation prioritizing low starting cost.",
        "Your turn",
        "b10",
        {
          source:
            "The hobby is for a beginner. They have 30 minutes in the evenings, a $25 starting budget, and prefer something creative they can do at home. Other details are flexible.",
        },
      ),
    ],
  },
];
export const lessonById = (id: string) => LESSONS.find((l) => l.id === id);
export interface LessonTurn {
  role: "user" | "assistant";
  content: string;
  step: number;
  group: string;
}
export interface LessonRun {
  member_id?: string;
  lesson_id: LessonId;
  step: number;
  turns: LessonTurn[];
  completed_at: string | null;
  feedback: string;
  last_pass: boolean;
  last_request: string | null;
  revision: number;
}
export const INTERESTS = [
  "Better answers",
  "Writing",
  "Research",
  "Connected information",
  "Automation",
  "Visuals",
  "Building tools",
  "Exploring",
];
export const MOTIVATIONS = [
  "Save time",
  "Improve my work",
  "Advance my career",
  "Create something",
  "Manage everyday life",
  "Feel more confident",
  "Satisfy my curiosity",
];
export const EXPERIENCE = [
  "I’ve barely tried AI",
  "I ask basic questions",
  "I regularly refine answers",
  "I use files and connected tools",
  "I build reusable workflows",
];
export function learningPromise(interests: string[]) {
  if (
    interests.includes("Automation") ||
    interests.includes("Connected information")
  )
    return [
      "Shape useful answers",
      "Find information in connected tools",
      "Work toward a repeatable inbox briefing",
    ];
  if (interests.includes("Visuals") || interests.includes("Building tools"))
    return [
      "Give clear creative instructions",
      "Improve a result through feedback",
      "Work toward a useful visual or tool",
    ];
  if (interests.includes("Research"))
    return [
      "Ask focused questions",
      "Bring relevant sources into a conversation",
      "Work toward a supported recommendation",
    ];
  return [
    "Shape answers for your needs",
    "Give AI the context that matters",
    "Combine useful moves independently",
  ];
}
