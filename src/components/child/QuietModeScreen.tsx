import { Mascot } from "../mascot/Mascot";
import { ParentGateButton } from "../common/ParentGateButton";
import { useLang } from "../../hooks/useLang";
import { useNavigate } from "react-router-dom";

export function QuietModeScreen() {
  const { lang } = useLang();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-[#2b2a4a] to-[#4a3f7a] px-6 text-center text-white">
      <Mascot mood="sleepy" size={160} />
      <h1 className="text-2xl font-extrabold">
        {lang === "he" ? "שששש, זה זמן שקט 😴" : "Shh, it's quiet time 😴"}
      </h1>
      <p className="text-white/70">{lang === "he" ? "בואו נחזור אחרי שנקום!" : "Let's come back after we wake up!"}</p>
      <ParentGateButton onUnlock={() => navigate("/parent")} />
    </div>
  );
}
