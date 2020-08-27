export function getObjPropIgnoreCase(obj:any, prop:string):any {
	if (!obj) return;
	if (!prop) return;
	let keys = Object.keys(obj);
	prop = prop.toLowerCase();
	for (let key of keys) {
		if (key.toLowerCase() === prop) return obj[key];
	}
	return;
}
