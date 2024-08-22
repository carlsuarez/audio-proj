import React, { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import TimelinePlugin from "wavesurfer.js/dist/plugins/timeline";

function AudioWaveform({ audioData, sampleRate }) {
  const waveformRef = useRef();
  const wavesurferRef = useRef();

  useEffect(() => {
    if (waveformRef.current && audioData) {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }

      wavesurferRef.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: "violet",
        progressColor: "purple",
        height: 100,
        responsive: true,
        interact: false,
        plugins: [
          TimelinePlugin.create({
            container: "#timeline",
            height: 20,
            timeInterval: 1, // Adjust as needed
            primaryLabelInterval: 10, // Adjust as needed
          }),
        ],
      });

      const blob = new Blob([audioData], { type: "audio/wav" });
      wavesurferRef.current.loadBlob(blob);

      return () => wavesurferRef.current.destroy();
    }
  }, [audioData]);

  return (
    <div style={{ width: "400px", margin: "0 auto" }}>
      <div id="waveform" ref={waveformRef} />
      <div id="timeline" />
    </div>
  );
}

export default AudioWaveform;
