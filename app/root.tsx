import {
	Links,
	LinksFunction,
	LiveReload,
	LoaderFunction,
	Meta,
	Outlet,
	redirect,
	useCatch,
	useLoaderData,
} from "remix";
import globalStylesUrl from "./styles/global.css";
import globalMediumStylesUrl from "./styles/global-medium.css";
import globalLargeStylesUrl from "./styles/global-large.css";
import { gql, GraphQLClient } from "graphql-request";

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

// replace this with codegen
interface QueryResult {
	whoAmI: {
		id: string;
		username: string;
		currentHashedRefreshToken: string;
		createdAt: string;
		updatedAt: string;
	};
}

// replace this with codegen
const whoami = gql`
	query whoami {
		whoAmI {
			id
			username
			createdAt
			updatedAt
		}
	}
`;

interface GraphQLError {
	response: {
		errors: {
			message: string;
		}[];
	};
}

function isGraphQLError(error: unknown): error is GraphQLError {
	return typeof error === "object" && error !== null && "response" in error;
}

export const loader: LoaderFunction = async ({ request }) => {
	if (typeof process.env.SERVER_ENDPOINT !== "string") {
		throw new Error("SERVER_ENDPOINT must be set");
	}
	const url = new URL(request.url, process.env.SERVER_ENDPOINT);
	const isLoginPath = url.pathname === "/login";
	const client = new GraphQLClient(`${process.env.SERVER_ENDPOINT}/graphql`);
	try {
		const headers = new Headers();
		headers.append("Cookie", request.headers.get("cookie") || "");
		const data = await client.request<QueryResult>(whoami, {}, headers);
		if (isLoginPath && data.whoAmI) {
			// you are logged in, so you are redirected to the app
			return redirect("/todos");
		}
		return data;
	} catch (error) {
		if (typeof error === "string") {
			throw new Response(error, { status: 500 });
		} else if (typeof error === "object" && error !== null) {
			if (isGraphQLError(error)) {
				if (error.response.errors[0].message === "Unauthorized") {
					if (!isLoginPath) {
						// you are not logged in, so you are redirected to the login page
						return redirect("/login");
					}
					// we don't want to throw here, because we know the user is in
					// the login page and not authenticated
					return null;
				}
			}
		}
		throw new Error("Unknown error");
	}
};

export default function App() {
	const data = useLoaderData<QueryResult | null>();
	return (
		<Document>
			{data ? (
				<nav>
					<span>{`Hello ${data.whoAmI.username}`}</span>
				</nav>
			) : null}
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
