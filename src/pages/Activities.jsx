import { useMemo, useState } from "react";
import { ACTIVITIES } from "@/lib/programme";
import { IMG } from "@/lib/assets";
import { useProgramme } from "@/lib/programmeData";
import Pill from "@/components/cb/Pill";

const QUESTIONS = [
  {
    key: "space",
    q: "What space do you have at home?",
    options: [
      { value: "balcony", label: "A balcony or garden" },
      { value: "windowsill", label: "A windowsill or small pots" },
      { value: "none", label: "No outdoor space" },
    ],
  },
  {
    key: "time",
    q: "How much time do you have?",
    options: [
      { value: "quick", label: "Under 15 minutes" },
      { value: "weekend", label: "A weekend project" },
      { value: "ongoing", label: "An ongoing project" },
    ],
  },
  {
    key: "interest",
    q: "What interests you most?",
    options: [
      { value: "plants", label: "Growing plants" },
      { value: "mushrooms", label: "Growing food" },
      { value: "home", label: "Something for the home" },
    ],
  },
];

export function recommend({ space, time, interest }) {
  if (interest === "mushrooms" && time !== "quick") return "mushrooms";
  if (interest === "plants" && space !== "none") return "plant";
  if (space === "none" && time === "quick") return "deodoriser";
  if (space !== "none" && time !== "quick") return "compost";
  if (interest === "home") return "scrub";
  return "plant";
}

function Quiz({ onDone }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const current = QUESTIONS[step];
  const result = step >= QUESTIONS.length ? recommend(answers) : null;
  const activity = ACTIVITIES.find((a) => a.key === result);

  if (result) {
    return (
      <div className="bg-paper p-6">
        <p className="text-[11px] uppercase tracking-[0.14em] text-sub">recommended for you</p>
        <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-[220px_1fr]">
          <img src={IMG[activity.photo]} alt={activity.name} className="h-[180px] w-full rounded-[2px] object-cover" />
          <div>
            <h3 className="text-[22px] lowercase text-ink">{activity.name}</h3>
            <p className="text-[12px] uppercase tracking-[0.12em] text-sub">
              {activity.time} · {activity.difficulty} · {activity.tag}
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-sub">{activity.summary}</p>
            <div className="mt-3 flex gap-2">
              <Pill
                size="sm"
                onClick={() => {
                  onDone(result, answers);
                }}
              >
                save and start
              </Pill>
              <Pill size="sm" variant="ghost" onClick={() => { setStep(0); setAnswers({}); }}>
                retake
              </Pill>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-paper p-6">
      <p className="text-[11px] uppercase tracking-[0.14em] text-sub">
        question {step + 1} of {QUESTIONS.length}
      </p>
      <h3 className="mt-2 text-[20px] lowercase text-ink">{current.q}</h3>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {current.options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => {
              setAnswers((a) => ({ ...a, [current.key]: o.value }));
              setStep((s) => s + 1);
            }}
            className="border border-rule px-4 py-3 text-left text-[13px] transition-colors hover:border-ink"
          >
            {o.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-sub">Wet grounds first — drying is only needed for the home activities.</p>
    </div>
  );
}

export default function Activities() {
  const { me, saveActivity, saves, updateMe, reuses } = useProgramme();
  const [quizOpen, setQuizOpen] = useState(!me?.quizCompleted);
  const [openKey, setOpenKey] = useState("");

  const savedKeys = useMemo(
    () => new Set([...(me?.savedActivities || []), ...saves.filter((s) => s.employeeEmail === me?.email).map((s) => s.activityKey)]),
    [me, saves]
  );

  const counts = useMemo(() => {
    const map = {};
    reuses.filter((r) => r.status === "validated").forEach((r) => {
      map[r.activityKey] = (map[r.activityKey] || 0) + 1;
    });
    return map;
  }, [reuses]);

  const finishQuiz = async (key, answers) => {
    setQuizOpen(false);
    await saveActivity(key);
    await updateMe({ quizCompleted: true, quizAnswers: Object.values(answers) });
  };

  return (
    <div className="space-y-9">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-sub">activities · {me?.floorCode}</p>
          <h1 className="display mt-3 text-[54px] sm:text-[88px]">reuse.</h1>
          <p className="mt-3 max-w-[54ch] text-[14px] leading-relaxed text-sub">
            Five routes for spent grounds, ordered by how soon you can use them. Wet grounds work for plants,
            compost and mushrooms. The fridge deodoriser and the soap bar need two days of drying first.
          </p>
        </div>
        {!quizOpen && (
          <button type="button" onClick={() => setQuizOpen(true)} className="text-[13px] underline decoration-rule underline-offset-4 hover:text-caramel">
            retake the quiz
          </button>
        )}
      </div>

      {quizOpen && <Quiz onDone={finishQuiz} />}

      {savedKeys.size > 0 && (
        <div>
          <div className="flex items-baseline justify-between border-b border-rule pb-3">
            <h2 className="text-[15px] lowercase">
              <span className="mr-2 text-sub tabular">01</span>my activities
            </h2>
            <span className="text-[11px] uppercase tracking-[0.14em] text-sub">{savedKeys.size} saved</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {[...savedKeys].map((key) => {
              const a = ACTIVITIES.find((x) => x.key === key);
              if (!a) return null;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setOpenKey(key)}
                  className="rounded-full border border-ink px-4 py-2 text-[13px] lowercase transition-colors hover:border-caramel hover:text-caramel"
                >
                  {a.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-baseline justify-between border-b border-rule pb-3">
          <h2 className="text-[15px] lowercase">
            <span className="mr-2 text-sub tabular">02</span>the library
          </h2>
          <span className="text-[11px] uppercase tracking-[0.14em] text-sub">wet grounds first</span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ACTIVITIES.map((a, i) => {
            const open = openKey === a.key;
            return (
              <article key={a.key} className="bg-paper">
                <img src={IMG[a.photo]} alt={a.name} className="h-[190px] w-full rounded-[2px] object-cover" />
                <div className="p-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] tabular text-sub">{String(i + 1).padStart(2, "0")}</span>
                    <span className="text-[10px] uppercase tracking-[0.12em] text-sub">
                      {counts[a.key] || 0} reuses this year
                    </span>
                  </div>
                  <h3 className="mt-1 text-[17px] lowercase text-ink">{a.name}</h3>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-sub">
                    {a.time} · {a.difficulty} · {a.tag}
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-sub">{a.summary}</p>

                  {open && (
                    <div className="mt-3 border-t border-rule pt-3">
                      <ol className="space-y-1.5">
                        {a.steps.map((s, idx) => (
                          <li key={idx} className="flex gap-2 text-[13px] leading-relaxed text-ink">
                            <span className="tabular text-sub">{idx + 1}</span>
                            {s}
                          </li>
                        ))}
                      </ol>
                      <p className="mt-3 border-l-2 border-caramel pl-3 text-[12px] leading-relaxed text-sub">
                        <span className="uppercase tracking-[0.12em] text-ink">safety · </span>
                        {a.safety}
                      </p>
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Pill size="sm" variant={open ? "ghost" : "outline"} onClick={() => setOpenKey(open ? "" : a.key)}>
                      {open ? "hide steps" : "view steps"}
                    </Pill>
                    <Pill size="sm" variant={savedKeys.has(a.key) ? "ghost" : "outline"} onClick={() => saveActivity(a.key)}>
                      {savedKeys.has(a.key) ? "saved" : "save"}
                    </Pill>
                    {!a.wetFriendly && (
                      <span className="text-[11px] text-sub underline decoration-rule underline-offset-4">drying guide</span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}