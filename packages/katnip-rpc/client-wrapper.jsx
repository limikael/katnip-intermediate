import {useIsoContext} from "isoq";
import {QuickRpcProvider} from "fullstack-utils/use-quick-rpc";

export default function({children}) {
	let iso=useIsoContext();

	return (
		<QuickRpcProvider url="/rpc" fetch={iso.fetch}>
			{children}
		</QuickRpcProvider>
	);
}