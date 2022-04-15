import {
	ActionFunction,
	Form,
	json,
	LinksFunction,
	LoaderFunction,
	redirect,
	useActionData,
	useLoaderData,
} from "remix";
import {
	CreateTodo,
	CreateTodoMutation,
	CreateTodoMutationVariables,
	GetTodos,
	GetTodosQuery,
	RemoveTodo,
	RemoveTodoMutation,
	RemoveTodoMutationVariables,
	UpdateTodo,
	UpdateTodoMutation,
	UpdateTodoMutationVariables,
} from "~/generated/graphql";
import { TodoItem } from "~/lib/TodoItem";
import { getGraphQLClient } from "~/utils/getGraphQLClient.server";
import { validateToken } from "~/utils/validateToken.server";
import todosStylesUrl from "../styles/todos.css";

export const links: LinksFunction = () => {
	return [
		{
			rel: "stylesheet",
			href: todosStylesUrl,
		},
	];
};

interface GraphQLError {
	response: {
		errors: {
			message: string;
		}[];
	};
}

function isGraphQLError(error: unknown): error is GraphQLError {
	return typeof error === "object" && error !== null && "response" in error;
}

interface ActionData {
	fieldErrors?: {
		title: string;
	};
}

const badRequest = (data: ActionData, headers: Headers) =>
	json(data, { status: 400, headers });

export const action: ActionFunction = async ({ request }) => {
	const cookies = request.headers.get("Cookie");
	if (!cookies) {
		throw redirect("/login");
	}
	// if there's new cookies these should be set on this action's response
	const newCookies = await validateToken(cookies);
	let headers: Headers = new Headers();
	if (newCookies) {
		headers = newCookies.setCookieHeaders;
	}

	const formData = await request.formData();
	const _action = formData.get("_action");
	const client = getGraphQLClient(newCookies?.newCookies || cookies);
	if (_action === "toggle-completed") {
		const todoId = formData.get("id");
		const isCompleted = formData.get("isCompleted");
		if (
			typeof todoId !== "string" ||
			todoId === "" ||
			typeof isCompleted !== "string"
		) {
			return badRequest({}, headers);
		}
		await client.request<UpdateTodoMutation, UpdateTodoMutationVariables>(
			UpdateTodo,
			{
				updateTodoInput: {
					id: todoId,
					// toggle todo completion
					isCompleted: isCompleted === "true" ? false : true,
				},
			},
		);
		return redirect(request.url, {
			headers,
		});
	}
	if (_action === "update-title") {
		const todoId = formData.get("id");
		const title = formData.get("title");
		if (
			typeof todoId !== "string" ||
			typeof title !== "string" ||
			todoId === "" ||
			title === ""
		) {
			return badRequest({}, headers);
		}
		await client.request<UpdateTodoMutation, UpdateTodoMutationVariables>(
			UpdateTodo,
			{
				updateTodoInput: {
					id: todoId,
					title,
				},
			},
		);
		return redirect(request.url, {
			headers,
		});
	}
	if (_action === "delete") {
		const todoId = formData.get("id");
		if (typeof todoId !== "string" || todoId === "") {
			return badRequest({}, headers);
		}
		await client.request<RemoveTodoMutation, RemoveTodoMutationVariables>(
			RemoveTodo,
			{
				id: todoId,
			},
		);
		return redirect(request.url, {
			headers,
		});
	}
	if (_action === "create") {
		const title = formData.get("title");
		if (typeof title !== "string" || title === "") {
			return badRequest(
				{
					fieldErrors: {
						title: "Title is required",
					},
				},
				headers,
			);
		}
		await client.request<CreateTodoMutation, CreateTodoMutationVariables>(
			CreateTodo,
			{
				title,
			},
		);
		return redirect(request.url, {
			headers,
		});
	}
};

export const loader: LoaderFunction = async ({ request }) => {
	const cookies = request.headers.get("Cookie");
	if (!cookies) {
		throw redirect("/login");
	}

	const headers: Headers = new Headers();
	const client = getGraphQLClient(cookies);
	try {
		const data = await client.request<GetTodosQuery>(GetTodos, {});
		return json(data, {
			headers,
		});
	} catch (error) {
		if (typeof error === "string") {
			throw new Response(error, { status: 500, headers });
		} else if (typeof error === "object" && error !== null) {
			if (isGraphQLError(error)) {
				if (error.response.errors[0].message === "Unauthorized") {
					// you are not logged in, so you are redirected to the login page
					return redirect("/login");
				}
			}
		}
		throw new Error("Unknown error");
	}
};

export default function TodosIndexRoute() {
	const loaderData = useLoaderData<GetTodosQuery>();
	const actionData = useActionData<ActionData>();
	return (
		<div className="main-wrapper">
			<h1>Todos</h1>
			<main>
				{loaderData.todos.length > 0 ? (
					<ul className="todos-list">
						{loaderData.todos
							.sort((a, b) => {
								if (a === null || b === null) {
									return 0;
								}
								const aCreatedAt = new Date(a.createdAt).getTime();
								const bCreatedAt = new Date(b.createdAt).getTime();
								return aCreatedAt - bCreatedAt;
							})
							.map((todo) => (
								<TodoItem key={todo.id} todo={todo} />
							))}
					</ul>
				) : (
					<p>No todos found</p>
				)}
				<Form method="post">
					<label htmlFor="title">Title</label>
					<input
						id="title"
						name="title"
						type="text"
						aria-invalid={Boolean(actionData?.fieldErrors?.title) || undefined}
						aria-describedby={
							actionData?.fieldErrors?.title ? "title-error" : undefined
						}
					/>
					{actionData?.fieldErrors?.title ? (
						<p role="alert" id="title-error">
							{actionData.fieldErrors.title}
						</p>
					) : null}
					<button
						name="_action"
						value="create"
						type="submit"
						className="button button-create"
					>
						Submit
					</button>
				</Form>
			</main>
		</div>
	);
}
