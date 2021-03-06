import {
	ActionFunction,
	json,
	Link,
	LinksFunction,
	redirect,
	useActionData,
} from "remix";
import { register } from "~/utils/register.server";
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
	if (typeof username !== "string" || typeof password !== "string") {
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
		const response = await register(fields);
		const data = await response.json();
		if ("statusCode" in data) {
			// if there's statusCode in data then it's an error
			return json(
				{
					formError: data.message,
					fields,
				},
				{
					status: data.statusCode,
				},
			);
		}
		return redirect("/login");
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

export default function Register() {
	const actionData = useActionData<ActionData>();

	const formError = actionData?.formError;
	const usernameError = actionData?.fieldErrors?.username;
	const passwordError = actionData?.fieldErrors?.password;

	return (
		<div className="container">
			<div className="content" data-light="">
				<h1>Register</h1>
				<form method="post" aria-describedby="form-error-message">
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
					<Link to="/login">Already have an account? Sign in</Link>
					<button type="submit" className="button">
						Submit
					</button>
				</form>
			</div>
		</div>
	);
}
