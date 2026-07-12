import QuizModule from "../components/QuizModule.jsx";

export default function Quiz({ lang, sessionHash }) {
  return <QuizModule lang={lang} sessionHash={sessionHash} />;
}
