import Link from "next/link";

export default function QRPage() {
	const qrOptions = [
		{
			name: "Small QR",
			description: "Compact and easy to share digitally.",
			href: "/smallqr.html",
			icon: "▦",
		},
		{
			name: "Medium QR",
			description: "A balanced option for most displays and prints.",
			href: "/mediumqr.html",
			icon: "▦",
		},
		{
			name: "Big QR",
			description: "Highly visible for posters and larger spaces.",
			href: "/bigqr.html",
			icon: "▦",
		},
	];

	return (
		<main
			style={{
				minHeight: "100vh",
				padding: "clamp(2rem, 8vw, 6rem) 1.5rem",
				background: "linear-gradient(135deg, #f8fafc, #eef2ff)",
				fontFamily: "Arial, sans-serif",
			}}
		>
			<section style={{ maxWidth: "900px", margin: "0 auto" }}>
				<p style={{ color: "#4f46e5", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "0.8rem" }}>
					MosqueBuddy
				</p>
				<h1 style={{ margin: "0.5rem 0", color: "#111827", fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
					Choose your QR size
				</h1>
				<p style={{ color: "#6b7280", fontSize: "1.1rem", marginBottom: "2rem" }}>
					Select the format that best fits where you plan to display it.
				</p>
			<nav aria-label="QR size options" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
				{qrOptions.map((option) => (
					<Link
						key={option.href}
						href={option.href}
						style={{ display: "block", padding: "1.5rem", borderRadius: "1rem", background: "#fff", color: "#111827", textDecoration: "none", boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)", border: "1px solid #e5e7eb" }}
					>
						<span aria-hidden="true" style={{ display: "grid", placeItems: "center", width: "3rem", height: "3rem", marginBottom: "1rem", borderRadius: "0.75rem", background: "#eef2ff", color: "#4f46e5", fontSize: "2rem" }}>
							{option.icon}
						</span>
						<strong style={{ display: "block", fontSize: "1.2rem", marginBottom: "0.5rem" }}>{option.name}</strong>
						<span style={{ display: "block", color: "#6b7280", lineHeight: 1.5 }}>{option.description}</span>
						<span style={{ display: "inline-block", marginTop: "1rem", color: "#4f46e5", fontWeight: 700 }}>Continue →</span>
					</Link>
				))}
			</nav>
			</section>
		</main>
	);
}
