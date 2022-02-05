type RegisterFields = {
	username: string;
	password: string;
};

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

export async function register(
	registerFields: RegisterFields,
): Promise<ResponseWithData> {
	if (typeof process.env.SERVER_ENDPOINT !== "string") {
		throw new Error("SERVER_ENDPOINT must be set");
	}
	return fetch(`${process.env.SERVER_ENDPOINT}/auth/register`, {
		method: "post",
		headers: {
			"Content-Type": "application/json; charset=utf-8",
		},
		body: JSON.stringify(registerFields),
	});
}
