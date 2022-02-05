export default function TodosIndexRoute() {
	return (
		<div>
			<p>Here&apos;s a random joke:</p>
			<p>I was wondering why the frisbee was getting bigger, then it hit me.</p>
			<form action="/logout" method="post">
				<button type="submit" className="button">
					Logout
				</button>
			</form>
		</div>
	);
}
