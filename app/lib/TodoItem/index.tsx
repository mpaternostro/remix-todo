import { Form, useFetcher } from "remix";
import { GetTodosQuery } from "~/generated/graphql";

interface TodoItemProps {
	todo: NonNullable<GetTodosQuery["todos"][0]>;
}

export function TodoItem({ todo }: TodoItemProps) {
	const fetcher = useFetcher();

	const isDeleting =
		fetcher.submission?.formData.get("_action") === "delete" &&
		fetcher.submission.formData.get("id") === todo.id
			? true
			: false;

	return (
		<li key={todo?.id} className="todo-item">
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
					className={todo?.isCompleted ? "circle circle-fill" : "circle"}
				/>
			</Form>
			<Form method="post" className="update-form">
				<input name="id" value={todo?.id} type="hidden" />
				<input
					type="text"
					name="title"
					defaultValue={todo?.title}
					className="todo-title"
				/>
				<button
					name="_action"
					value="update-title"
					type="submit"
					className="button button-update"
				>
					Save
				</button>
			</Form>
			<fetcher.Form method="post">
				<input name="id" value={todo?.id} type="hidden" />
				<button
					name="_action"
					value="delete"
					type="submit"
					className="button button-delete"
					disabled={isDeleting}
				>
					Delete
				</button>
			</fetcher.Form>
		</li>
	);
}
