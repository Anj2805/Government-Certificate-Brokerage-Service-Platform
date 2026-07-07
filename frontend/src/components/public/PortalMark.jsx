export default function PortalMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-md border border-brand-100 bg-white shadow-sm" aria-hidden="true">
        <div className="grid h-7 w-7 place-items-center rounded-full border-2 border-brand-800">
          <span className="h-2.5 w-2.5 rounded-full bg-saffron-500" />
        </div>
      </div>
      <div>
        <p className="text-base font-semibold leading-5 text-ink-900">SevaSetu</p>
        <p className="text-xs font-medium leading-5 text-ink-600">Certificate & Documentation Assistance</p>
      </div>
    </div>
  );
}
