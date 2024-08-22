import React, { useState, useEffect, useRef } from "react";
import { loadWasm } from "./loadWasm";
import WaveSurfer from "wavesurfer.js";

function App() {
  const [audioFile, setAudioFile] = useState(null);
  const [wasm, setWasm] = useState(null);
  const [gain, setGain] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [processedAudioBlob, setProcessedAudioBlob] = useState(null);
  const waveformRef = useRef(null);
  const waveSurfer = useRef(null);

  useEffect(() => {
    loadWasm().then(setWasm);
  }, []);

  useEffect(() => {
    if (waveSurfer.current) {
      waveSurfer.current.on("ready", () => {
        // Play the audio when the waveform is ready
        waveSurfer.current.play();
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waveSurfer.current]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("audio/")) {
      setAudioFile(file);
    } else {
      setErrorMessage("Please select a valid audio file.");
    }
  };

  const processAudio = () => {
    if (audioFile && wasm) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        setLoading(true);
        const arrayBuffer = e.target.result;
        let audioData = new Uint8Array(arrayBuffer);

        console.log("Original Data:", audioData);

        // Apply gain
        let processedData = wasm.apply_gain(audioData, gain);
        console.log("After Gain:", processedData);

        // Apply pitch
        processedData = wasm.apply_pitch(processedData, pitch);
        console.log("After Pitch:", processedData);

        setLoading(false);
        renderWaveform(processedData);
        setProcessedAudioBlob(createWavBlob(processedData));
      };

      reader.readAsArrayBuffer(audioFile);
    }
  };

  const renderWaveform = (processedData) => {
    if (waveSurfer.current) {
      waveSurfer.current.destroy();
    }

    waveSurfer.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "violet",
      progressColor: "purple",
      normalize: true,
      scrollParent: true,
      height: 128,
    });

    const blob = new Blob([processedData.buffer], { type: "audio/wav" });
    waveSurfer.current.loadBlob(blob);
  };

  const createWavBlob = (data) => {
    // Create a new Blob for the processed audio data
    return new Blob([data.buffer], { type: "audio/wav" });
  };

  const downloadFile = () => {
    if (processedAudioBlob) {
      const url = URL.createObjectURL(processedAudioBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "processed_audio.wav";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="App">
      <h1>Real-Time Audio Processor</h1>
      <input type="file" accept="audio/*" onChange={handleFileUpload} />
      <div>
        <label>
          Gain
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={gain}
            onChange={(e) => setGain(parseFloat(e.target.value))}
          />
        </label>
      </div>
      <div>
        <label>
          Pitch
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={pitch}
            onChange={(e) => setPitch(parseFloat(e.target.value))}
          />
        </label>
      </div>
      <button onClick={processAudio} disabled={loading}>
        {loading ? "Processing..." : "Process Audio"}
      </button>
      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
      <div ref={waveformRef} style={{ width: "100%", height: "200px" }}></div>
      {processedAudioBlob && (
        <>
          <button onClick={downloadFile}>Download Processed Audio</button>
          <div>
            <button onClick={() => waveSurfer.current && waveSurfer.current.play()}>
              Play
            </button>
            <button onClick={() => waveSurfer.current && waveSurfer.current.pause()}>
              Pause
            </button>
            <button onClick={() => waveSurfer.current && waveSurfer.current.stop()}>
              Stop
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
