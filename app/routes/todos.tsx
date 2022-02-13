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
import { getGraphQLClient } from "~/utils/getGraphQLClient";
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

const badRequest = (data: ActionData) => json(data, { status: 400 });

export const action: ActionFunction = async ({ request }) => {
	const formData = await request.formData();
	const _action = formData.get("_action");
	const client = getGraphQLClient(request);
	if (_action === "toggle-completed") {
		const todoId = formData.get("id");
		const isCompleted = formData.get("isCompleted");
		if (
			typeof todoId !== "string" ||
			todoId === "" ||
			typeof isCompleted !== "string"
		) {
			return badRequest({});
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
		return redirect(request.url);
	}
	if (_action === "delete") {
		console.log("deleting...");
		const todoId = formData.get("id");
		if (typeof todoId !== "string" || todoId === "") {
			return badRequest({});
		}
		await client.request<RemoveTodoMutation, RemoveTodoMutationVariables>(
			RemoveTodo,
			{
				id: todoId,
			},
		);
		return redirect(request.url);
	}
	if (_action === "create") {
		const title = formData.get("title");
		if (typeof title !== "string" || title === "") {
			return badRequest({
				fieldErrors: {
					title: "Title is required",
				},
			});
		}
		await client.request<CreateTodoMutation, CreateTodoMutationVariables>(
			CreateTodo,
			{
				title,
			},
		);
		return redirect(request.url);
	}
};

export const loader: LoaderFunction = async ({ request }) => {
	try {
		const client = getGraphQLClient(request);
		const data = await client.request<GetTodosQuery>(GetTodos, {});
		return data;
	} catch (error) {
		if (typeof error === "string") {
			throw new Response(error, { status: 500 });
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
			<main
				style={{
					marginTop: "1rem",
				}}
			>
				{loaderData?.todos.length > 0 ? (
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
								<li key={todo?.id}>
									<div
										style={{
											display: "flex",
											flexDirection: "row",
											alignItems: "center",
										}}
									>
										<Form method="post">
											<input name="id" value={todo?.id} type="hidden" />
											<input
												name="isCompleted"
												value={todo?.isCompleted.toString()}
												type="hidden"
											/>
											<button
												name="_action"
												value="toggle-completed"
												type="submit"
												className={
													todo?.isCompleted ? "circle circle-fill" : "circle"
												}
											/>
										</Form>
										<span
											style={{
												flex: "1",
											}}
										>
											{todo?.title}
										</span>
										<Form method="post">
											<input name="id" value={todo?.id} type="hidden" />
											<button
												name="_action"
												value="delete"
												type="submit"
												className="button button-delete"
											>
												Delete
											</button>
										</Form>
									</div>
								</li>
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
