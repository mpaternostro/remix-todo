import { Outlet } from "remix";

export default function TodosRoute() {
	return (
		<div>
			<h1>Todos</h1>
			<main>
				<Outlet />
			</main>
		</div>
	);
}
