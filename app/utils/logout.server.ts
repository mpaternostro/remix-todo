interface ResponseWithData extends Response {
	json: () => Promise<ResponseDataError>;
}

export async function logout(request: Request): Promise<ResponseWithData> {
	if (typeof process.env.SERVER_ENDPOINT !== "string") {
		throw new Error("SERVER_ENDPOINT must be set");
	}
	return fetch(`${process.env.SERVER_ENDPOINT}/auth/logout`, {
		method: "post",
		headers: request.headers,
	});
}
