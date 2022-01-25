/**
 * Recreate headers from API server response (Remix server fetch)
 * to then redirect and set-cookies in the client
 */
export function recreateHeaders(response: Response): Headers {
	const headers = new Headers();
	const cookies = response.headers.get("Set-Cookie");
	if (cookies) {
		// header's get method returns a comma-separated list of values
		// we can Array.split this because we know Authentication and
		// Refresh cookies does not have any commas
		const [authenticationCookie, refreshCookie] = cookies.split(",");
		headers.append("Set-Cookie", authenticationCookie);
		headers.append("Set-Cookie", refreshCookie);
	}
	return headers;
}
