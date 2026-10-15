"use client";

import { motion, useReducedMotion } from "framer-motion";

// Fixed "One Dark"-style palette — intentionally theme-independent so the
// editor reads as an authentic dark code editor regardless of site theme.
const SYNTAX = {
  keyword: "#c678dd",
  fn: "#61afef",
  string: "#98c379",
  danger: "#e06c75",
  text: "#abb2bf",
  comment: "#5c6370",
};

const LINES: { indent?: number; tokens: { text: string; color?: string }[] }[] = [
  { tokens: [{ text: "# AI yordamchi javobingizni tekshiradi", color: SYNTAX.comment }] },
  {
    tokens: [
      { text: "def ", color: SYNTAX.keyword },
      { text: "check_answer", color: SYNTAX.fn },
      { text: "(code):" },
    ],
  },
  {
    indent: 1,
    tokens: [{ text: "result = " }, { text: "run", color: SYNTAX.fn }, { text: "(code)" }],
  },
  { indent: 1, tokens: [{ text: "if ", color: SYNTAX.keyword }, { text: "result.passed:" }] },
  {
    indent: 2,
    tokens: [
      { text: "return ", color: SYNTAX.keyword },
      { text: '"To\'g\'ri!"', color: SYNTAX.string },
    ],
  },
  {
    indent: 1,
    tokens: [
      { text: "return ", color: SYNTAX.keyword },
      { text: '"Qayta urinib ko\'ring"', color: SYNTAX.danger },
    ],
  },
];

export function CodeMockup() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      animate={shouldReduceMotion ? undefined : { y: [0, -10, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      className="w-full max-w-sm overflow-hidden rounded-2xl border shadow-2xl"
      style={{ backgroundColor: "#282c34", borderColor: "rgba(255,255,255,0.08)" }}
    >
      <div
        className="flex items-center gap-1.5 border-b px-4 py-3"
        style={{ backgroundColor: "#21252b", borderColor: "rgba(255,255,255,0.06)" }}
      >
        <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
        <span className="ml-2 text-xs" style={{ color: SYNTAX.text }}>
          mavzu.py
        </span>
      </div>
      <div className="flex p-5 font-mono text-[13px] leading-relaxed">
        <div className="mr-4 select-none text-right" style={{ color: "rgba(255,255,255,0.2)" }}>
          {LINES.map((_, i) => (
            <p key={i}>{i + 1}</p>
          ))}
          <p>{LINES.length + 1}</p>
        </div>
        <div className="min-w-0 flex-1">
          {LINES.map((line, i) => (
            <p key={i} style={{ paddingLeft: `${(line.indent ?? 0) * 1.25}rem` }}>
              {line.tokens.map((token, j) => (
                <span key={j} style={{ color: token.color ?? SYNTAX.text }}>
                  {token.text}
                </span>
              ))}
            </p>
          ))}
          <p className="flex items-center">
            <motion.span
              animate={shouldReduceMotion ? undefined : { opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="inline-block h-4 w-1.5"
              style={{ backgroundColor: SYNTAX.fn }}
            />
          </p>
        </div>
      </div>
      <div
        className="flex items-center gap-2 border-t px-4 py-2.5"
        style={{ backgroundColor: "#21252b", borderColor: "rgba(255,255,255,0.06)" }}
      >
        <motion.span
          animate={shouldReduceMotion ? undefined : { opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          className="h-2 w-2 rounded-full bg-success"
        />
        <span className="text-xs" style={{ color: SYNTAX.text }}>
          Ishga tushirilmoqda...
        </span>
      </div>
    </motion.div>
  );
}
