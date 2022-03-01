import { redirect } from "remix";
import jwt_decode, { JwtPayload } from "jwt-decode";
import { recreateHeaders } from "./recreateHeaders";
import { refreshToken } from "./refreshToken.server";

function validateTokenExpiration(authCookies: string): boolean {
	if (typeof process.env.SERVER_ENDPOINT !== "string") {
		throw new Error("SERVER_ENDPOINT must be set");
	}

	const [accessToken] = authCookies.split(";");
	const { exp } = jwt_decode<JwtPayload>(accessToken);
	if (exp) {
		return exp * 1000 > Date.now();
	}
	return false;
}

export async function validateToken(authCookies: string) {
	const isValidToken = validateTokenExpiration(authCookies);
	if (!isValidToken) {
		const response = await refreshToken(authCookies);
		const data = await response.json();
		if ("statusCode" in data && data.statusCode === 401) {
			// redirect to login page because refresh token is not valid
			throw redirect("/login");
		}
		const headers = recreateHeaders(response);
		return {
			setCookieHeaders: headers,
			newCookies: response.headers.get("set-cookie"),
		};
	}
	return null;
}
