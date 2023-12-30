import {QuickminApiProvider} from "quickmin/use-api";
import {useIsoContext} from "isoq";
import urlJoin from "url-join";

export default function({children}) {
    let iso=useIsoContext();

	return (
		<QuickminApiProvider url="/admin" fetch={iso.fetch}>
			{children}
		</QuickminApiProvider>
	);
}