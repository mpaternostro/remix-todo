import {
	Form,
	Links,
	LinksFunction,
	LiveReload,
	LoaderFunction,
	Meta,
	Outlet,
	redirect,
	Scripts,
	useCatch,
	useLoaderData,
} from "remix";
import globalStylesUrl from "./styles/global.css";
import globalMediumStylesUrl from "./styles/global-medium.css";
import globalLargeStylesUrl from "./styles/global-large.css";
import { Whoami, WhoamiQuery } from "./generated/graphql";
import { getGraphQLClient } from "./utils/getGraphQLClient.server";
import { validateToken } from "./utils/validateToken.server";

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
	const cookies = request.headers.get("Cookie");
	if (!cookies) {
		if (isLoginPath) {
			return null;
		}
		throw redirect("/login");
	}
	// if there's new cookies these should be set on this loader's response
	const newCookies = await validateToken(cookies);

	// INFO: I believe that using a middleware before getting graphql client might
	// be a better idea because calling `validateToken`, passing new cookies to get
	// graphql client and sending new headers on every loader and action's responses
	// means I have to repeat code along all loaders and actions that need to know if
	// user's token is valid before reaching the graphql server, but right now
	// there's no such thing in remix.run

	let headers: Headers = new Headers();
	if (newCookies) {
		headers = newCookies.setCookieHeaders;
	}

	const client = getGraphQLClient(newCookies?.newCookies || cookies);
	try {
		const data = await client.request<WhoamiQuery>(Whoami, {});
		if (isLoginPath && data.whoAmI) {
			// you are logged in, so you are redirected to the app
			return redirect("/todos", {
				headers,
			});
		}
		return data;
	} catch (error) {
		if (typeof error === "string") {
			throw new Response(error, { status: 500, headers });
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
	const data = useLoaderData<WhoamiQuery>();
	return (
		<Document>
			{data?.whoAmI ? (
				<nav>
					<span>{`Hello ${data.whoAmI.username}`}</span>
					<Form action="/logout" method="post">
						<button type="submit" className="button">
							Logout
						</button>
					</Form>
				</nav>
			) : null}
			<Scripts />
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
