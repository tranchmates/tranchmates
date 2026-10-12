import { CAT_SVG, DOG_SVG } from "./svg";

// Static, trusted SVG art (see svg.ts) rendered with CSS idle animations.
export function Mascot({
  kind,
  className = "",
  busy = false,
}: {
  kind: "cat" | "dog";
  className?: string;
  busy?: boolean;
}) {
  return (
    <div
      className={`mascot ${busy ? "is-busy" : ""} ${className}`}
      dangerouslySetInnerHTML={{ __html: kind === "cat" ? CAT_SVG : DOG_SVG }}
    />
  );
}
