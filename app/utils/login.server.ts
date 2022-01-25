type LoginFields = {
	username: string;
	password: string;
};

interface ResponseWithData extends Response {
	json: () => Promise<{
		id: string;
		username: string;
		createdAt: string;
		updatedAt: string;
	}>;
}

export async function login(
	loginFields: LoginFields,
): Promise<ResponseWithData> {
	if (typeof process.env.SERVER_ENDPOINT !== "string") {
		throw new Error("SERVER_ENDPOINT must be set");
	}
	return fetch(`${process.env.SERVER_ENDPOINT}/auth/login`, {
		method: "post",
		headers: {
			"Content-Type": "application/json; charset=utf-8",
		},
		body: JSON.stringify(loginFields),
	});
}
