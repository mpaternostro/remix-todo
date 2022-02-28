import { GraphQLClient } from "graphql-request";

export function getGraphQLClient(authCookies: string) {
	if (typeof process.env.SERVER_ENDPOINT !== "string") {
		throw new Error("SERVER_ENDPOINT must be set");
	}

	const headers = new Headers();
	headers.append("Cookie", authCookies);
	return new GraphQLClient(`${process.env.SERVER_ENDPOINT}/graphql`, {
		headers,
	});
}
