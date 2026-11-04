import { Wordmark } from "@/components/wordmark";

export function AuthScreen({
  kicker,
  title,
  lead,
  children,
  alternate,
}: {
  kicker: string;
  title: string;
  lead: string;
  children: React.ReactNode;
  alternate?: React.ReactNode;
}) {
  return (
    <main className="auth-screen">
      <div className="auth-copy">
        <Wordmark variant="full" />
        <p className="kicker">{kicker}</p>
        <h1>{title}</h1>
        <p>{lead}</p>
        {alternate}
      </div>
      <div className="auth-card">{children}</div>
    </main>
  );
}
