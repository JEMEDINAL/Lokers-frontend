export function ErrorBanner({ message }: { message: string }) {
  return <div className="banner banner-error">{message}</div>;
}
