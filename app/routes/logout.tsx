import { json, redirect } from "remix";
import type { ActionFunction, LoaderFunction } from "remix";
import { logout } from "~/utils/logout.server";
import { recreateHeaders } from "~/utils/recreateHeaders";

type ActionData = {
	error?: string;
};

const internalServerError = (data: ActionData) => json(data, { status: 500 });

export const action: ActionFunction = async ({ request }) => {
	try {
		const response = await logout(request);
		if (response.ok === false) {
			const data = await response.json();
			// we don't care about Response's data if we were logged out successfully
			return json(
				{
					error: data.message,
				},
				{
					status: data.statusCode,
				},
			);
		}
		const headers = recreateHeaders(response);
		return redirect("/login", {
			headers,
		});
	} catch (error) {
		if (typeof error === "string") {
			return internalServerError({
				error,
			});
		}
		return internalServerError({
			error: "Something went wrong",
		});
	}
};

export const loader: LoaderFunction = () => {
	return redirect("/login");
};
