import { useState } from "react";
import { useAppState } from "../../state/AppStateContext";
import { useLang } from "../../hooks/useLang";
import { usePwaInstall } from "../../hooks/usePwaInstall";
import type { Lang } from "../../models/types";

export function SettingsPage() {
  const { state, updateSettings, updateProfile, resetProgress } = useAppState();
  const { ui } = useLang();
  const { canInstall, promptInstall } = usePwaInstall();
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [name, setName] = useState(state.profile?.name ?? "");
  const [age, setAge] = useState(state.profile?.ageYears ?? 2);

  const saveProfile = () => {
    updateProfile({ name: name.trim() || state.profile?.name, ageYears: age });
  };

  return (
    <div className="flex flex-col gap-6 py-4">
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-bold">{ui("editProfile")}</h2>
        <div className="flex flex-col gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveProfile}
            className="rounded-xl border-2 border-bubblegum px-3 py-2"
          />
          <div className="flex gap-2">
            {[2, 3].map((a) => (
              <button
                key={a}
                onClick={() => {
                  setAge(a);
                  updateProfile({ ageYears: a });
                }}
                className={`rounded-full px-4 py-2 font-bold ${age === a ? "bg-berry text-white" : "bg-cream"}`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-bold">{ui("chooseLanguage")}</h2>
        <div className="flex gap-2">
          {(["he", "en"] as Lang[]).map((lang) => (
            <button
              key={lang}
              onClick={() => updateSettings({ language: lang })}
              className={`rounded-full px-4 py-2 font-bold ${state.settings.language === lang ? "bg-berry text-white" : "bg-cream"}`}
            >
              {lang === "he" ? "עברית" : "English"}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-bold">{ui("soundEffects")}</h2>
        <div className="flex flex-col gap-3">
          <ToggleRow
            label={ui("soundEffects")}
            checked={state.settings.soundEnabled}
            onChange={(v) => updateSettings({ soundEnabled: v })}
          />
          <ToggleRow
            label={ui("voiceInstructions")}
            checked={state.settings.voiceEnabled}
            onChange={(v) => updateSettings({ voiceEnabled: v })}
          />
          <div>
            <p className="mb-1 text-sm font-bold text-choco/60">{ui("soundVolume")}</p>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={state.settings.volume}
              onChange={(e) => updateSettings({ volume: Number(e.target.value) })}
              className="w-full accent-[#ff8fab]"
            />
          </div>
          <ToggleRow
            label="Reduced motion"
            checked={state.settings.reducedMotion}
            onChange={(v) => updateSettings({ reducedMotion: v })}
          />
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-bold">{ui("quietMode")}</h2>
        <div className="flex items-center gap-3">
          <input
            type="time"
            value={state.settings.quietModeStart ?? ""}
            onChange={(e) => updateSettings({ quietModeStart: e.target.value })}
            className="rounded-xl border-2 border-bubblegum px-3 py-2"
          />
          <span>—</span>
          <input
            type="time"
            value={state.settings.quietModeEnd ?? ""}
            onChange={(e) => updateSettings({ quietModeEnd: e.target.value })}
            className="rounded-xl border-2 border-bubblegum px-3 py-2"
          />
        </div>
      </section>

      {canInstall && (
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-bold">{ui("installApp")}</h2>
          <button onClick={promptInstall} className="no-select rounded-full bg-sky-dark px-4 py-2 font-bold text-white">
            {ui("installApp")}
          </button>
        </section>
      )}

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-bold text-berry">{ui("resetProgress")}</h2>
        {!confirmingReset ? (
          <button
            onClick={() => setConfirmingReset(true)}
            className="no-select rounded-full bg-[#ffe3e3] px-4 py-2 font-bold text-berry"
          >
            {ui("resetProgress")}
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-choco/70">{ui("resetConfirm")}</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  resetProgress();
                  setConfirmingReset(false);
                }}
                className="no-select rounded-full bg-berry px-4 py-2 font-bold text-white"
              >
                {ui("resetProgress")}
              </button>
              <button
                onClick={() => setConfirmingReset(false)}
                className="no-select rounded-full bg-cream px-4 py-2 font-bold"
              >
                {ui("back")}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between">
      <span className="text-sm font-bold text-choco/70">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-6 w-6 accent-[#ff8fab]" />
    </label>
  );
}
