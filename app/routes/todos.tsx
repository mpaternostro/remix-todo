import {
	ActionFunction,
	Form,
	json,
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
} from "~/generated/graphql";
import { getGraphQLClient } from "~/utils/getGraphQLClient";

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
	if (_action === "delete") {
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
		<>
			<h1>Todos</h1>
			<main>
				{loaderData?.todos.length > 0 ? (
					<ul>
						{loaderData.todos.map((todo) => (
							<li key={todo?.id}>
								<Form
									style={{
										display: "flex",
										flexDirection: "row",
									}}
									method="post"
								>
									<input name="id" value={todo?.id} type="hidden" />
									<span>{todo?.title}</span>
									<button name="_action" value="delete" type="submit">
										⨉
									</button>
								</Form>
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
					<button name="_action" value="create" type="submit">
						Submit
					</button>
				</Form>
				<Form action="/logout" method="post">
					<button type="submit" className="button">
						Logout
					</button>
				</Form>
			</main>
		</>
	);
}
