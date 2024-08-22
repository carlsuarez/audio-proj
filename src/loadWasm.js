export const loadWasm = async () => {
	const wasm = await import("./wasm/audio_processor.js");
	await wasm.default();
	return wasm;
};
