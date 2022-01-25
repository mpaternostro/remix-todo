import { redirect } from "remix";
import { recreateHeaders } from "./recreateHeaders";

export async function logout(request: Request) {
	if (typeof process.env.SERVER_ENDPOINT !== "string") {
		throw new Error("SERVER_ENDPOINT must be set");
	}
	const response = await fetch(`${process.env.SERVER_ENDPOINT}/auth/logout`, {
		method: "post",
		headers: request.headers,
	});
	if (response.ok) {
		const headers = recreateHeaders(response);
		return redirect("/login", {
			headers,
		});
	}
}
