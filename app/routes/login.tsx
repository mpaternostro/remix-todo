import {
	ActionFunction,
	json,
	LinksFunction,
	redirect,
	useActionData,
	useSearchParams,
} from "remix";
import { login } from "~/utils/login.server";
import stylesUrl from "../styles/login.css";

export const links: LinksFunction = () => {
	return [{ rel: "stylesheet", href: stylesUrl }];
};

type ActionData = {
	formError?: string;
	fieldErrors?: {
		username?: string;
		password?: string;
	};
	fields?: {
		username?: string;
		password?: string;
	};
};

function validateUsername(username: string) {
	if (username.length < 5) {
		return "Username must be at least 5 characters";
	}
	return undefined;
}

function validatePassword(password: string) {
	if (password.length < 5) {
		return "Password must be at least 5 characters";
	}
	return undefined;
}

const badRequest = (data: ActionData) => json(data, { status: 400 });
const internalServerError = (data: ActionData) => json(data, { status: 500 });

export const action: ActionFunction = async ({ request }) => {
	const form = await request.formData();
	const username = form.get("username");
	const password = form.get("password");
	const redirectTo = form.get("redirectTo") || "/todos";
	if (
		typeof username !== "string" ||
		typeof password !== "string" ||
		typeof redirectTo !== "string"
	) {
		return badRequest({
			formError: "Form not submitted correctly",
		});
	}

	const fields = {
		username,
		password,
	};
	const fieldErrors = {
		username: validateUsername(username),
		password: validatePassword(password),
	};
	if (Object.values(fieldErrors).some(Boolean)) {
		return badRequest({
			formError: "Some fields are invalid",
			fieldErrors,
			fields,
		});
	}

	try {
		const response = await login(fields);
		if (!response.ok) {
			return badRequest({
				formError: "Username or password did not match",
				fields,
			});
		}
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
		return redirect(redirectTo, {
			headers,
		});
	} catch (error) {
		if (typeof error === "string") {
			return internalServerError({
				formError: error,
			});
		}
		return internalServerError({
			formError: "Something went wrong",
		});
	}
};

export default function Login() {
	const actionData = useActionData<ActionData>();
	const [searchParams] = useSearchParams();

	const formError = actionData?.formError;
	const usernameError = actionData?.fieldErrors?.username;
	const passwordError = actionData?.fieldErrors?.password;

	return (
		<div className="container">
			<div className="content" data-light="">
				<h1>Login</h1>
				<form method="post" aria-describedby="form-error-message">
					<input
						type="hidden"
						name="redirectTo"
						value={searchParams.get("redirectTo") ?? undefined}
					/>
					<div>
						<label htmlFor="username-input">Username</label>
						<input
							type="text"
							id="username-input"
							name="username"
							aria-invalid={usernameError ? true : undefined}
							aria-describedby={usernameError ? "username-error" : undefined}
							defaultValue={actionData?.fields?.username ?? undefined}
							required
						/>
					</div>
					<p id="username-error" className="form-validation-error">
						{usernameError || ""}
					</p>
					<div>
						<label htmlFor="password-input">Password</label>
						<input
							id="password-input"
							name="password"
							type="password"
							aria-invalid={passwordError ? true : undefined}
							aria-describedby={passwordError ? "password-error" : undefined}
							defaultValue={actionData?.fields?.password ?? undefined}
							required
						/>
					</div>
					<p id="password-error" className="form-validation-error">
						{passwordError || ""}
					</p>
					<p id="form-error-message" className="form-validation-error">
						{formError || ""}
					</p>
					<button type="submit" className="button">
						Submit
					</button>
				</form>
			</div>
		</div>
	);
}
