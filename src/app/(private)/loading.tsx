export default function PrivateLoading() {
  return <div className="page-loading" role="status" aria-live="polite">
    <span className="page-loading-indicator" aria-hidden="true" />
    <span>正在打开你的空间…</span>
  </div>;
}
