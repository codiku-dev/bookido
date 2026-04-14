import Link from "next/link";

export default function NotFound() {
  return (
    <div>
      <h2>Not found</h2>
      <p>
        <Link href="/">Back home</Link>
      </p>
    </div>
  );
}
