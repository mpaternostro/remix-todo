import {
	Links,
	LinksFunction,
	LiveReload,
	Meta,
	Outlet,
	useCatch,
} from "remix";
import globalStylesUrl from "./styles/global.css";
import globalMediumStylesUrl from "./styles/global-medium.css";
import globalLargeStylesUrl from "./styles/global-large.css";

export const links: LinksFunction = () => {
	return [
		{
			rel: "stylesheet",
			href: globalStylesUrl,
		},
		{
			rel: "stylesheet",
			href: globalMediumStylesUrl,
			media: "print, (min-width: 640px)",
		},
		{
			rel: "stylesheet",
			href: globalLargeStylesUrl,
			media: "screen and (min-width: 1024px)",
		},
	];
};

function Document({
	children,
	title = `Remix Todos App`,
}: {
	children: React.ReactNode;
	title?: string;
}) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<title>{title}</title>
				<meta name="viewport" content="width=device-width,initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				{children}
				{process.env.NODE_ENV === "development" ? <LiveReload /> : null}
			</body>
		</html>
	);
}

export default function App() {
	return (
		<Document>
			<Outlet />
		</Document>
	);
}

export function CatchBoundary() {
	const caught = useCatch();

	return (
		<Document title={`${caught.status} ${caught.statusText}`}>
			<div className="error-container">
				<h1>
					{caught.status} {caught.statusText}
				</h1>
			</div>
		</Document>
	);
}

export function ErrorBoundary({ error }: { error: Error }) {
	return (
		<Document title="Something went wrong!">
			<div className="error-container">
				<h1>App Error</h1>
				<pre>{error.message}</pre>
			</div>
		</Document>
	);
}
