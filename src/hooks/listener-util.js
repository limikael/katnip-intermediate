export function listenerGetDescription(listener) {
	if (listener.sub)
		return "Run subtask: "+listener.sub;

	return listener.description;
}

export function listenerGetOptions(listener) {
	if (listener.sub)
		return listener.hookRunner.getOptionsByEventType(listener.sub);

	if (!listener.options)
		return [];

	return Object.keys(listener.options);
}

export function listenerGetOptionDescriptions(listener, option) {
	if (listener.sub)
		return listener.hookRunner.getOptionDescriptions(listener.sub,option);

	if (!listener.options)
		return [];

	return [listener.options[option]];
}