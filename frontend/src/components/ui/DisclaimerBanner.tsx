export function DisclaimerBanner() {
  return (
    <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
      <svg className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L1 21h22L12 2zm0 3.5L20.5 19h-17L12 5.5zm-1 4.5v4h2v-4h-2zm0 6v2h2v-2h-2z"/></svg>
      <p className="text-sm text-amber-800">
        <strong>Research/decision-support output only</strong> -- not a substitute for professional medical diagnosis.
        This is an experimental research prototype. Results must not be used for clinical decision-making.
      </p>
    </div>
  );
}