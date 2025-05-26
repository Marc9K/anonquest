import Link from "next/link";

export default function Header() {
  return (
    <header style={{ padding: "1rem", borderBottom: "1px solid #ccc" }}>
      <nav style={{ display: "flex", gap: "1rem" }}>
        <Link href="/">Home</Link>
        <Link href="/login">Log In</Link>
      </nav>
    </header>
  );
}
