interface ResponseWithData extends Response {
	json: () => Promise<
		| {
				id: string;
				username: string;
				createdAt: string;
				updatedAt: string;
		  }
		| ResponseDataError
	>;
}

export async function refreshToken(
	authCookies: string,
): Promise<ResponseWithData> {
	if (typeof process.env.SERVER_ENDPOINT !== "string") {
		throw new Error("SERVER_ENDPOINT must be set");
	}

	const headers = new Headers();
	headers.set("Cookie", authCookies);
	return fetch(`${process.env.SERVER_ENDPOINT}/auth/refresh`, {
		headers,
	});
}
