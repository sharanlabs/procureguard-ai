const cx = (...classes) => classes.filter(Boolean).join(" ");

function IconBase({ className = "", viewBox = "0 0 24 24", children, ...props }) {
  return (
    <svg
      viewBox={viewBox}
      fill="none"
      className={cx("pg-product-icon", className)}
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function BrandMark({ className = "", ...props }) {
  return (
    <IconBase className={cx("pg-brand-glyph", className)} viewBox="0 0 36 36" {...props}>
      <defs>
        <linearGradient id="pg-brand-tile" x1="8" x2="28" y1="5" y2="31" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7F8DFF" />
          <stop offset=".56" stopColor="#6571F2" />
          <stop offset="1" stopColor="#5058D8" />
        </linearGradient>
        <linearGradient id="pg-brand-shield" x1="18" x2="18" y1="9" y2="27" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#EEF2FF" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="33" height="33" rx="9.5" fill="#F3F5FF" />
      <rect x="1.5" y="1.5" width="33" height="33" rx="9.5" stroke="#DDE4FF" />
      <rect x="4.6" y="4.6" width="26.8" height="26.8" rx="7.5" fill="url(#pg-brand-tile)" />
      <path
        d="M18 9.25 25 11.8v5.35c0 4.55-2.72 7.8-7 9.6-4.28-1.8-7-5.05-7-9.6V11.8l7-2.55Z"
        fill="url(#pg-brand-shield)"
      />
      <path
        d="M18 12.15v11.25c2.68-1.36 4.3-3.48 4.3-6.2v-3.48L18 12.15Z"
        fill="#6571F2"
        fillOpacity=".16"
      />
    </IconBase>
  );
}

export function StartNavIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M5.2 19.1h13.6c.7 0 1.2-.5 1.2-1.2V9.8L12 4 4 9.8v8.1c0 .7.5 1.2 1.2 1.2Z" fill="#F3F6FF" stroke="#6372E8" strokeWidth="1.45" />
      <path d="M9.2 19v-5.2h5.6V19" fill="#FFFFFF" stroke="#6372E8" strokeWidth="1.45" strokeLinejoin="round" />
      <path d="M12 7.7v3.9" stroke="#3AAFC3" strokeWidth="1.55" strokeLinecap="round" />
      <path d="m9.9 9.8 2.1-2.1 2.1 2.1" stroke="#3AAFC3" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

export function SummaryNavIcon(props) {
  return (
    <IconBase {...props}>
      <rect x="4.4" y="11.2" width="3.2" height="7.9" rx="1" fill="#6372E8" />
      <rect x="10.4" y="6" width="3.2" height="13.1" rx="1" fill="#3AAFC3" />
      <rect x="16.4" y="8.7" width="3.2" height="10.4" rx="1" fill="#7FA7DC" />
      <path d="M4 20.2h16" stroke="#334155" strokeOpacity=".36" strokeWidth="1.25" strokeLinecap="round" />
    </IconBase>
  );
}

export function WorkbenchNavIcon(props) {
  return (
    <IconBase {...props}>
      <rect x="4" y="4" width="6.2" height="6.2" rx="1.55" fill="#F3F6FF" stroke="#6372E8" strokeWidth="1.25" />
      <rect x="13.8" y="4" width="6.2" height="6.2" rx="1.55" fill="#EAF8F8" stroke="#3AAFC3" strokeWidth="1.25" />
      <rect x="4" y="13.8" width="6.2" height="6.2" rx="1.55" fill="#FFF7EA" stroke="#D09A4D" strokeWidth="1.25" />
      <rect x="13.8" y="13.8" width="6.2" height="6.2" rx="1.55" fill="#FFF1F1" stroke="#E75A5A" strokeWidth="1.25" />
    </IconBase>
  );
}

export function SuppliersNavIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="9" cy="8" r="2.9" fill="#3AAFC3" />
      <circle cx="15.8" cy="9.2" r="2.45" fill="#7FA7DC" />
      <path d="M4.2 19.5c.5-3.2 2.4-5 4.8-5s4.3 1.8 4.8 5H4.2Z" fill="#EAF8F8" stroke="#3AAFC3" strokeWidth="1.25" />
      <path d="M12.7 19.5c.35-2.35 1.75-3.75 3.6-3.75s3.2 1.4 3.6 3.75h-7.2Z" fill="#F3F6FF" stroke="#6372E8" strokeWidth="1.25" />
    </IconBase>
  );
}

export function AuditNavIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M12 3.8 19.3 6.5v5.4c0 4.5-2.8 7.6-7.3 9.4-4.5-1.8-7.3-4.9-7.3-9.4V6.5L12 3.8Z" fill="#F1FBF6" stroke="#23A86E" strokeWidth="1.45" />
      <path d="m8.75 12.25 2.15 2.15 4.55-5.25" stroke="#23A86E" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16.4 6.9 12 5.25 7.6 6.9" stroke="#6372E8" strokeOpacity=".46" strokeWidth="1.15" strokeLinecap="round" />
    </IconBase>
  );
}

export function PurchaseOrderIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M7.1 3.5h7l3.8 3.8v13.2H7.1a1.8 1.8 0 0 1-1.8-1.8V5.3c0-1 .8-1.8 1.8-1.8Z" fill="#EAF4FF" stroke="#3198D8" strokeWidth="1.25" />
      <path d="M14.1 3.7v4h3.7" fill="#FFFFFF" stroke="#3198D8" strokeWidth="1.25" strokeLinejoin="round" />
      <path d="M8.2 10.8h7.2M8.2 14h6M8.2 17.1h4.3" stroke="#334155" strokeOpacity=".5" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="8.5" cy="7.5" r="1.1" fill="#6671F2" />
    </IconBase>
  );
}

export function GoodsReceiptIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M3.5 9.4c0-.8.6-1.4 1.4-1.4h8.3v7.9H3.5V9.4Z" fill="#B98748" />
      <path d="M13.2 10.5h3.7l3 3v2.4h-6.7v-5.4Z" fill="#35AFC2" />
      <path d="M16.1 11.5h1.1l1.6 1.7h-2.7v-1.7Z" fill="#DDF6F4" />
      <path d="M4.7 9.4h7.1M4.7 11.8h7.1" stroke="#F8E1BD" strokeOpacity=".72" strokeWidth="1" strokeLinecap="round" />
      <path d="M3.1 15.9h17.8" stroke="#445166" strokeWidth="1.35" strokeLinecap="round" />
      <circle cx="7.2" cy="17" r="2.1" fill="#445166" />
      <circle cx="7.2" cy="17" r=".85" fill="#CBD5E1" />
      <circle cx="17.3" cy="17" r="2.1" fill="#445166" />
      <circle cx="17.3" cy="17" r=".85" fill="#CBD5E1" />
      <circle cx="20.1" cy="7.4" r="1.85" fill="#17A66A" />
      <path d="m19.3 7.4.55.6 1.05-1.25" stroke="#FFFFFF" strokeWidth="1.05" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

export function SupplierInvoiceIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M7 3.7h7.4l3.6 3.7v13H7a1.7 1.7 0 0 1-1.7-1.7V5.4c0-.9.8-1.7 1.7-1.7Z" fill="#EEF3FF" stroke="#6671F2" strokeWidth="1.25" />
      <path d="M14.4 3.9v3.8h3.5" fill="#FFFFFF" stroke="#6671F2" strokeWidth="1.25" strokeLinejoin="round" />
      <path d="M8.5 10.6h6.6M8.5 13.5h6.6M8.5 16.4h3.7" stroke="#334155" strokeOpacity=".52" strokeWidth="1.15" strokeLinecap="round" />
      <path d="M16.2 16.1c.9.2 1.4.7 1.4 1.4 0 .9-.8 1.5-2 1.5-.8 0-1.5-.2-2-.6" stroke="#3198D8" strokeWidth="1.1" strokeLinecap="round" />
    </IconBase>
  );
}

export function MatchScaleIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M12 4.1v15.7" stroke="#6671F2" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6.4 8h11.2" stroke="#445166" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M7.1 8 4.4 14.1h5.4L7.1 8Z" fill="#FFF6E5" stroke="#F59E0B" strokeWidth="1.15" strokeLinejoin="round" />
      <path d="M16.9 8 14.2 14.1h5.4L16.9 8Z" fill="#FFF6E5" stroke="#F59E0B" strokeWidth="1.15" strokeLinejoin="round" />
      <path d="M4.4 14.1c.4 1.3 1.3 2 2.7 2s2.3-.7 2.7-2M14.2 14.1c.4 1.3 1.3 2 2.7 2s2.3-.7 2.7-2" stroke="#C58A45" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M8.6 20h6.8" stroke="#6671F2" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="8" r="1.7" fill="#6671F2" />
    </IconBase>
  );
}

export function ReviewIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="10.2" cy="8" r="3.1" fill="#EEF3FF" stroke="#6671F2" strokeWidth="1.2" />
      <path d="M4.8 19.4c.6-3.6 2.7-5.5 5.4-5.5 1.9 0 3.5.9 4.5 2.6" fill="#FFFFFF" />
      <path d="M4.8 19.4c.6-3.6 2.7-5.5 5.4-5.5 1.9 0 3.5.9 4.5 2.6" stroke="#6671F2" strokeWidth="1.25" strokeLinecap="round" />
      <circle cx="17.2" cy="16.5" r="3.3" fill="#EDFDF5" stroke="#17A66A" strokeWidth="1.2" />
      <path d="m15.7 16.5 1 1 1.9-2.2" stroke="#17A66A" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

export function DraftDocumentIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M7.2 3.8h7.1l3.6 3.6v12.8H7.2a1.7 1.7 0 0 1-1.7-1.7v-13c0-1 .8-1.7 1.7-1.7Z" fill="#F1F0FF" stroke="#6970EE" strokeWidth="1.25" />
      <path d="M14.3 4v3.7h3.5" fill="#FFFFFF" stroke="#6970EE" strokeWidth="1.25" strokeLinejoin="round" />
      <path d="M8.5 11h6.8M8.5 14h4.9" stroke="#334155" strokeOpacity=".52" strokeWidth="1.15" strokeLinecap="round" />
      <rect x="13.4" y="15.5" width="5.2" height="4.1" rx="1" fill="#EEF3FF" stroke="#6671F2" strokeWidth="1.1" />
      <path d="M14.7 15.5v-.9a1.3 1.3 0 0 1 2.6 0v.9" stroke="#6671F2" strokeWidth="1.05" strokeLinecap="round" />
    </IconBase>
  );
}

export function AiSparkIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M8.2 7.5a4 4 0 0 1 7.6 0 4.1 4.1 0 0 1 .6 8.1 4.6 4.6 0 0 1-8.8 0 4.1 4.1 0 0 1 .6-8.1Z" fill="#EEF3FF" stroke="#6671F2" strokeWidth="1.25" />
      <path d="M9.1 11.4h5.8M12 8.6v7.1M9.8 15.3c.9-.8 1.6-1.8 2.2-3 .6 1.2 1.3 2.2 2.2 3" stroke="#6671F2" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.6 4.6 19.3 6l1.5.7-1.5.7-.7 1.5-.7-1.5-1.5-.7 1.5-.7.7-1.4Z" fill="#38AFC3" />
      <path d="M5.6 17.3 6 18.1l.8.4-.8.4-.4.8-.4-.8-.8-.4.8-.4.4-.8Z" fill="#F59E0B" />
    </IconBase>
  );
}

export function AiChecksCompleteIcon(props) {
  return (
    <IconBase {...props}>
      <rect x="3.5" y="4.2" width="14.8" height="14.8" rx="4.2" fill="#F3F6FF" stroke="#6671F2" strokeWidth="1.2" />
      <path d="M8.1 11.1h5.5M10.85 8.3v6.2M8.9 14.1c.75-.72 1.4-1.7 1.95-2.95.55 1.25 1.2 2.23 1.95 2.95" stroke="#6671F2" strokeWidth="1.08" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="17" cy="16.8" r="4.25" fill="#EDFDF5" stroke="#17A66A" strokeWidth="1.2" />
      <path d="m15.25 16.75 1.15 1.15 2.35-2.65" stroke="#17A66A" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

export function UploadStageIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M12 4.7v8.8" stroke="#38AFC3" strokeWidth="1.7" strokeLinecap="round" />
      <path d="m8.9 7.7 3.1-3 3.1 3" stroke="#38AFC3" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="5" y="13.2" width="14" height="6" rx="2" fill="#EDFDF5" stroke="#17A66A" strokeWidth="1.25" />
      <circle cx="18.6" cy="5.4" r="2" fill="#17A66A" />
      <path d="m17.8 5.4.5.6 1-1.2" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

export function StatusCheckIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8" fill="currentColor" fillOpacity=".11" stroke="currentColor" strokeWidth="1.25" />
      <path d="m8.5 12.2 2.2 2.2 4.8-5.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}
